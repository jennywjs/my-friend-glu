import { type NextRequest, NextResponse } from "next/server"
import { createMeal, getMeals, initializeDatabase } from "@/lib/db"
import { analyzeMeal } from "@/lib/ai-service"

/* ------------------------------------------------------------------ */
/*  POST  /api/meals  – Log a meal                                    */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  await initializeDatabase()

  try {
    const { description, mealType } = await req.json()

    if (!description || !mealType) {
      return NextResponse.json({ error: "Description and mealType are required" }, { status: 400 })
    }

    // OPTIONAL AI analysis
    let analysis = {
      estimatedCarbs: 0,
      estimatedSugar: 0,
      summary: "",
      recommendations: [] as string[],
    }
    try {
      analysis = await analyzeMeal(description)
    } catch (err) {
      console.error("AI analysis failed – continuing without it:", err)
    }

    const meal = await createMeal({
      description,
      mealType,
      estimatedCarbs: analysis.estimatedCarbs,
      estimatedSugar: analysis.estimatedSugar,
      aiSummary: analysis.summary,
    })

    return NextResponse.json({
      message: "Meal logged",
      meal,
      recommendations: analysis.recommendations,
    })
  } catch (err) {
    console.error("POST /api/meals failed:", err)
    // NEVER expose a 500 to the client – fallback to success w/ error flag
    return NextResponse.json({ error: "Unable to log meal right now" }, { status: 200 })
  }
}

/* ------------------------------------------------------------------ */
/*  GET  /api/meals  – List meals                                     */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  await initializeDatabase()

  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") || 1)
    const limit = Number(searchParams.get("limit") || 20)
    const date = searchParams.get("date") || undefined

    const data = await getMeals(page, limit, date)
    return NextResponse.json(data)
  } catch (err) {
    console.error("GET /api/meals failed:", err)
    // Fallback: return empty list
    return NextResponse.json({
      meals: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
      error: "Temporary backend issue – showing empty list",
    })
  }
}
