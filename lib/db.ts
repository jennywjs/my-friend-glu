// Conditional import - only import @vercel/postgres if DATABASE_URL is available
let sql: any = null
if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
  try {
    const { sql: pgSql } = require("@vercel/postgres")
    sql = pgSql
  } catch (error) {
    console.warn("Failed to import @vercel/postgres, falling back to in-memory storage")
  }
}

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
/*  In-memory fallback                                                */
/* ------------------------------------------------------------------ */

const mem: Meal[] = []
let nextId = 1

function memCreate(data: CreateMealData): Meal {
  const meal: Meal = {
    id: String(nextId++),
    description: data.description,
    mealType: data.mealType,
    estimatedCarbs: data.estimatedCarbs,
    estimatedSugar: data.estimatedSugar,
    aiSummary: data.aiSummary,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  mem.unshift(meal)
  return meal
}

function memPaginate(page = 1, limit = 20, date?: string) {
  let list = mem
  if (date) {
    const d = new Date(date).toDateString()
    list = list.filter((m) => new Date(m.createdAt).toDateString() === d)
  }
  const start = (page - 1) * limit
  const slice = list.slice(start, start + limit)
  return {
    meals: slice,
    pagination: {
      page,
      limit,
      total: list.length,
      pages: Math.ceil(list.length / limit),
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Fallback logic                                                    */
/* ------------------------------------------------------------------ */

let forceMemory = false

/* ------------------------------------------------------------------ */
/*  Detect missing driver at module load                              */
/* ------------------------------------------------------------------ */

if (!sql) {
  console.warn("@vercel/postgres not available – using in-memory store only")
  forceMemory = true
}

function useMem() {
  return forceMemory || sql === null || (!process.env.POSTGRES_URL && !process.env.POSTGRES_HOST)
}

function handlePgError(err: unknown) {
  console.error("Postgres error – switching to in-memory store:", err)
  forceMemory = true
}

/* ------------------------------------------------------------------ */
/*  Public CRUD                                                       */
/* ------------------------------------------------------------------ */

export async function createMeal(data: CreateMealData): Promise<Meal> {
  if (useMem()) return memCreate(data)
  try {
    const r = await sql`
      INSERT INTO meals
        (description, meal_type, estimated_carbs, estimated_sugar, ai_summary,
         created_at, updated_at)
      VALUES
        (${data.description}, ${data.mealType}, ${data.estimatedCarbs},
         ${data.estimatedSugar}, ${data.aiSummary ?? null}, NOW(), NOW())
      RETURNING *
    `
    const m = r.rows[0]
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
    handlePgError(err)
    return memCreate(data)
  }
}

export async function getMeals(page = 1, limit = 20, date?: string) {
  if (useMem()) return memPaginate(page, limit, date)
  try {
    const where = date ? sql`WHERE DATE(created_at) = ${date}` : sql``
    const rows = await sql`
      SELECT * FROM meals
      ${where}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `
    const count = await sql`
      SELECT COUNT(*) AS total FROM meals ${where}
    `
    const meals = rows.rows.map((m) => ({
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
    handlePgError(err)
    return memPaginate(page, limit, date)
  }
}

export async function getMealById(id: string) {
  if (useMem()) return mem.find((m) => m.id === id) || null
  try {
    const r = await sql`SELECT * FROM meals WHERE id = ${id}`
    if (!r.rows.length) return null
    const m = r.rows[0]
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
    handlePgError(err)
    return mem.find((m) => m.id === id) || null
  }
}

export async function updateMeal(id: string, data: Partial<CreateMealData>) {
  if (useMem()) {
    const idx = mem.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error("Meal not found")
    mem[idx] = { ...mem[idx], ...data, updatedAt: new Date() }
    return mem[idx]
  }
  try {
    const r = await sql`
      UPDATE meals
      SET description     = COALESCE(${data.description}, description),
          meal_type       = COALESCE(${data.mealType}, meal_type),
          estimated_carbs = COALESCE(${data.estimatedCarbs}, estimated_carbs),
          estimated_sugar = COALESCE(${data.estimatedSugar}, estimated_sugar),
          ai_summary      = COALESCE(${data.aiSummary}, ai_summary),
          updated_at      = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    const m = r.rows[0]
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
    handlePgError(err)
    return mem.find((m) => m.id === id) || null
  }
}

export async function deleteMeal(id: string) {
  if (useMem()) {
    const idx = mem.findIndex((m) => m.id === id)
    if (idx !== -1) mem.splice(idx, 1)
    return
  }
  try {
    await sql`DELETE FROM meals WHERE id = ${id}`
  } catch (err) {
    handlePgError(err)
    return
  }
}

/* ------------------------------------------------------------------ */
/*  Initialise                                                        */
/* ------------------------------------------------------------------ */

export async function initializeDatabase() {
  if (useMem()) {
    console.log("🗄️  Using in-memory store – Postgres env vars missing or disabled")
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
    console.log("Postgres schema verified ✅")
  } catch (err) {
    handlePgError(err)
  }
}
