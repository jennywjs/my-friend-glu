import { NextResponse } from "next/server"
import { createMeal, getMeals as dbGetMeals, initializeDatabase } from "@/lib/db"

/**
 * Initialise once (safe – `initializeDatabase` is idempotent).
 * If Postgres is unavailable it silently switches the DB layer to
 * the in-memory fallback, so the route can keep working.
 */
initializeDatabase().catch((err) => {
  console.error("Database initialization failed:", err)
})

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

function errorResponse(message: string, status = 500, details?: any) {
  console.error(`API Error (${status}):`, message, details)
  return new NextResponse(
    JSON.stringify({
      error: message,
      status,
      timestamp: new Date().toISOString(),
      details: details ? String(details) : undefined,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  )
}

/* ------------------------------------------------------------------ */
/*  GET /api/meals                                                    */
/* ------------------------------------------------------------------ */

export async function GET(req: Request) {
  try {
    console.log("GET /api/meals - Starting request")

    const url = new URL(req.url)
    const page = Number(url.searchParams.get("page") ?? 1)
    const limit = Number(url.searchParams.get("limit") ?? 20)
    const date = url.searchParams.get("date") ?? undefined

    console.log(`GET /api/meals - Parameters: page=${page}, limit=${limit}, date=${date}`)

    const data = await dbGetMeals(page, limit, date)
    console.log(`GET /api/meals - Success: Found ${data.meals?.length || 0} meals`)

    return json(data)
  } catch (err) {
    console.error("GET /api/meals - Database error:", err)

    // Provide detailed error information
    const errorDetails = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    }

    return json({
      meals: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      error: `Database error: ${errorDetails.message}`,
      errorDetails,
    })
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/meals                                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: Request) {
  try {
    console.log("POST /api/meals - Starting request")

    let body: { description: string; mealType: string } | undefined

    try {
      body = await req.json()
      console.log("POST /api/meals - Request body:", body)
    } catch (parseErr) {
      console.error("POST /api/meals - JSON parse error:", parseErr)
      return errorResponse("Invalid JSON in request body", 400, parseErr)
    }

    if (!body?.description || !body?.mealType) {
      console.error("POST /api/meals - Missing required fields:", {
        hasDescription: !!body?.description,
        hasMealType: !!body?.mealType,
        body,
      })
      return errorResponse("Missing required fields: description and mealType are required", 400)
    }

    console.log(`POST /api/meals - Creating meal: "${body.description}" (${body.mealType})`)

    const newMeal = await createMeal({
      description: body.description,
      mealType: body.mealType,
      estimatedCarbs: 0,
      estimatedSugar: 0,
    })

    console.log("POST /api/meals - Success: Created meal with ID:", newMeal.id)

    return json({ meal: newMeal })
  } catch (err) {
    console.error("POST /api/meals - Database error:", err)

    const errorDetails = {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
    }

    return json({
      error: `Failed to create meal: ${errorDetails.message}`,
      errorDetails,
    })
  }
}
