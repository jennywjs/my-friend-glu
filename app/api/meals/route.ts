import { NextRequest, NextResponse } from 'next/server'
import { createMeal, getMeals, initializeDatabase } from '@/lib/db'
import { analyzeMeal } from '@/lib/ai-service'

// POST - Log a new meal
export async function POST(request: NextRequest) {
  try {
    // Initialize database schema if needed
    await initializeDatabase()
    
    const body = await request.json()
    const { description, mealType } = body
    
    console.log('Received meal data:', { description, mealType })
    
    if (!description || !mealType) {
      return NextResponse.json(
        { error: 'Description and meal type are required' },
        { status: 400 }
      )
    }
    
    // Analyze meal with AI
    console.log('Analyzing meal with AI...')
    const analysis = await analyzeMeal(description)
    console.log('AI analysis result:', analysis)
    
    // Create meal record
    console.log('Creating meal record in database...')
    const meal = await createMeal({
      description,
      mealType,
      estimatedCarbs: analysis.estimatedCarbs,
      estimatedSugar: analysis.estimatedSugar,
      aiSummary: analysis.summary
    })
    
    console.log('Meal created successfully:', meal)
    
    return NextResponse.json({
      message: 'Meal logged successfully',
      meal: {
        id: meal.id,
        description: meal.description,
        mealType: meal.mealType,
        estimatedCarbs: meal.estimatedCarbs,
        estimatedSugar: meal.estimatedSugar,
        aiSummary: meal.aiSummary,
        createdAt: meal.createdAt
      },
      recommendations: analysis.recommendations,
      error: analysis.error
    })
    
  } catch (error) {
    console.error('Meal logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve meal history
export async function GET(request: NextRequest) {
  try {
    // Initialize database schema if needed
    await initializeDatabase()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const date = searchParams.get('date')
    
    console.log('Fetching meals with params:', { page, limit, date })
    
    const result = await getMeals(page, limit, date || undefined)
    
    console.log(`Found ${result.meals.length} meals out of ${result.pagination.total} total`)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Meal retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
