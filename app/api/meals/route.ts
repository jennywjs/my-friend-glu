import { NextResponse } from "next/server"

import { createMeal, getMeals as dbGetMeals, initializeDatabase } from "@/lib/db"

/**
 * Initialise once (safe – `initializeDatabase` is idempotent).
 * If Postgres is unavailable it silently switches the DB layer to
 * the in-memory fallback, so the route can keep working.
 */
initializeDatabase().catch(console.error)

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function json(data: any, init?: ResponseInit) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

/* ------------------------------------------------------------------ */
/*  GET /api/meals                                                    */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const page = Number(url.searchParams.get("page") ?? 1)
    const limit = Number(url.searchParams.get("limit") ?? 20)
    const date = url.searchParams.get("date") ?? undefined

    const data = await dbGetMeals(page, limit, date)
    return json(data)
  } catch (err) {
    console.error("GET /api/meals failed:", err)
    // Never bubble the error – always return a safe structure
    return json({
      meals: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      error: "Internal server error (fallback)",
    })
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/meals                                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { description: string; mealType: string } | undefined
    if (!body?.description || !body?.mealType) {
      return json({ error: "description and mealType are required" })
    }

    const newMeal = await createMeal({
      description: body.description,
      mealType: body.mealType,
      estimatedCarbs: 0,
      estimatedSugar: 0,
    })

    return json({ meal: newMeal })
  } catch (err) {
    console.error("POST /api/meals failed:", err)
    return json({ error: "Internal server error (fallback)" })
  }
}
