import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { analyzeMeal } from '@/lib/ai-service'

// POST - Log a new meal
export async function POST(request: NextRequest) {
  try {
    // Remove authentication for MVP deployability
    // const authResult = await authenticateRequest(request)
    // if ('error' in authResult) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.status }
    //   )
    // }
    
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
    const meal = await prisma.meal.create({
      data: {
        // userId: authResult.user.userId, // Remove userId for now
        description,
        mealType,
        estimatedCarbs: analysis.estimatedCarbs,
        estimatedSugar: analysis.estimatedSugar,
        aiSummary: analysis.summary
      }
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
    // Remove authentication for MVP deployability
    // const authResult = await authenticateRequest(request)
    // if ('error' in authResult) {
    //   return NextResponse.json(
    //     { error: authResult.error },
    //     { status: authResult.status }
    //   )
    // }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const date = searchParams.get('date')
    
    console.log('Fetching meals with params:', { page, limit, date })
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {} // Remove userId filter for now
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      where.createdAt = {
        gte: startDate,
        lt: endDate
      }
    }
    
    // Get meals with pagination
    const meals = await prisma.meal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        description: true,
        mealType: true,
        estimatedCarbs: true,
        estimatedSugar: true,
        aiSummary: true,
        createdAt: true
      }
    })
    
    // Get total count
    const total = await prisma.meal.count({ where })
    
    console.log(`Found ${meals.length} meals out of ${total} total`)
    
    return NextResponse.json({
      meals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Meal retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 