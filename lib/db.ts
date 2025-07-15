import { sql } from "@vercel/postgres"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface Meal {
  id: string
  description: string
  mealType: string
  estimatedCarbs: number
  estimatedSugar: number
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMealData {
  description: string
  mealType: string
  estimatedCarbs: number
  estimatedSugar: number
  aiSummary?: string
}

/* ------------------------------------------------------------------ */
/*  In-memory fallback store                                          */
/* ------------------------------------------------------------------ */

const memMeals: Meal[] = []
let nextId = 1

/* ------------------------------------------------------------------ */
/*  Fallback logic                                                    */
/* ------------------------------------------------------------------ */

/**
 * When TRUE all subsequent operations use the in-memory store.
 * We start in “unknown” mode and switch forever on first Postgres failure.
 */
let forceMemory = false

function shouldUseMemory() {
  // If we have no Postgres env vars or we blew up once, use memory.
  if (forceMemory) return true
  return !process.env.POSTGRES_URL && !process.env.POSTGRES_HOST
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function memCreate(data: CreateMealData): Meal {
  const meal: Meal = {
    id: (nextId++).toString(),
    description: data.description,
    mealType: data.mealType,
    estimatedCarbs: data.estimatedCarbs,
    estimatedSugar: data.estimatedSugar,
    aiSummary: data.aiSummary,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  memMeals.unshift(meal)
  return meal
}

function memPaginate(page: number, limit: number, date?: string) {
  let meals = memMeals
  if (date) {
    const target = new Date(date).toDateString()
    meals = meals.filter((m) => new Date(m.createdAt).toDateString() === target)
  }
  const start = (page - 1) * limit
  const slice = meals.slice(start, start + limit)
  return {
    meals: slice,
    pagination: {
      page,
      limit,
      total: meals.length,
      pages: Math.ceil(meals.length / limit),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export async function createMeal(data: CreateMealData): Promise<Meal> {
  if (shouldUseMemory()) return memCreate(data)

  try {
    const result = await sql`
      INSERT INTO meals (description, meal_type, estimated_carbs, estimated_sugar, ai_summary, created_at, updated_at)
      VALUES (${data.description}, ${data.mealType}, ${data.estimatedCarbs}, ${data.estimatedSugar},
              ${data.aiSummary || null}, NOW(), NOW())
      RETURNING *
    `
    const r = result.rows[0]
    return {
      id: r.id,
      description: r.description,
      mealType: r.meal_type,
      estimatedCarbs: Number(r.estimated_carbs),
      estimatedSugar: Number(r.estimated_sugar),
      aiSummary: r.ai_summary,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    }
  } catch (err) {
    console.error("Postgres unavailable, switching to in-memory store:", err)
    forceMemory = true
    return memCreate(data)
  }
}

export async function getMeals(page = 1, limit = 20, date?: string) {
  if (shouldUseMemory()) return memPaginate(page, limit, date)

  try {
    const whereDate = date ? sql`WHERE DATE(created_at) = ${date}` : sql``
    const result = await sql`
      SELECT * FROM meals
      ${whereDate}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `
    const count = await sql`
      SELECT COUNT(*) AS total FROM meals ${whereDate}
    `
    const meals = result.rows.map((m) => ({
      id: m.id,
      description: m.description,
      mealType: m.meal_type,
      estimatedCarbs: Number(m.estimated_carbs),
      estimatedSugar: Number(m.estimated_sugar),
      aiSummary: m.ai_summary,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }))
    return {
      meals,
      pagination: {
        page,
        limit,
        total: Number(count.rows[0].total),
        pages: Math.ceil(Number(count.rows[0].total) / limit),
      },
    }
  } catch (err) {
    console.error("Postgres unavailable, switching to in-memory store:", err)
    forceMemory = true
    return memPaginate(page, limit, date)
  }
}

export async function getMealById(id: string): Promise<Meal | null> {
  if (shouldUseMemory()) return memMeals.find((m) => m.id === id) || null

  try {
    const result = await sql`SELECT * FROM meals WHERE id = ${id}`
    if (!result.rows.length) return null
    const m = result.rows[0]
    return {
      id: m.id,
      description: m.description,
      mealType: m.meal_type,
      estimatedCarbs: Number(m.estimated_carbs),
      estimatedSugar: Number(m.estimated_sugar),
      aiSummary: m.ai_summary,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }
  } catch (err) {
    console.error("Postgres unavailable, switching to in-memory store:", err)
    forceMemory = true
    return memMeals.find((m) => m.id === id) || null
  }
}

export async function updateMeal(id: string, data: Partial<CreateMealData>): Promise<Meal> {
  if (shouldUseMemory()) {
    const idx = memMeals.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error("Meal not found")
    memMeals[idx] = { ...memMeals[idx], ...data, updatedAt: new Date() }
    return memMeals[idx]
  }

  try {
    const result = await sql`
      UPDATE meals
      SET description     = ${data.description ?? sql`description`},
          meal_type       = ${data.mealType ?? sql`meal_type`},
          estimated_carbs = ${data.estimatedCarbs ?? sql`estimated_carbs`},
          estimated_sugar = ${data.estimatedSugar ?? sql`estimated_sugar`},
          ai_summary      = ${data.aiSummary ?? sql`ai_summary`},
          updated_at      = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    const m = result.rows[0]
    return {
      id: m.id,
      description: m.description,
      mealType: m.meal_type,
      estimatedCarbs: Number(m.estimated_carbs),
      estimatedSugar: Number(m.estimated_sugar),
      aiSummary: m.ai_summary,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }
  } catch (err) {
    console.error("Postgres unavailable, switching to in-memory store:", err)
    forceMemory = true
    return updateMeal(id, data) // retry with memory
  }
}

export async function deleteMeal(id: string): Promise<void> {
  if (shouldUseMemory()) {
    const idx = memMeals.findIndex((m) => m.id === id)
    if (idx !== -1) memMeals.splice(idx, 1)
    return
  }

  try {
    await sql`DELETE FROM meals WHERE id = ${id}`
  } catch (err) {
    console.error("Postgres unavailable, switching to in-memory store:", err)
    forceMemory = true
    return deleteMeal(id) // retry with memory
  }
}

/* ------------------------------------------------------------------ */
/*  No-op initialise (optional)                                       */
/* ------------------------------------------------------------------ */

export async function initializeDatabase() {
  if (shouldUseMemory()) {
    console.log("🗄️  Using in-memory store – no Postgres or connection failed")
    return
  }
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        estimated_carbs FLOAT NOT NULL,
        estimated_sugar FLOAT DEFAULT 0,
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("Postgres schema OK")
  } catch (err) {
    console.error("Could not init Postgres – switching to memory store:", err)
    forceMemory = true
  }
}
