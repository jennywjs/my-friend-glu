import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/middleware'
import { analyzeMeal } from '@/lib/ai-service'

// POST - Log a new meal
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const body = await request.json()
    const { description, mealType } = body
    
    if (!description || !mealType) {
      return NextResponse.json(
        { error: 'Description and meal type are required' },
        { status: 400 }
      )
    }
    
    // Analyze meal with AI
    const analysis = await analyzeMeal(description)
    
    // Create meal record
    const meal = await prisma.meal.create({
      data: {
        userId: authResult.user.userId,
        description,
        mealType,
        estimatedCarbs: analysis.estimatedCarbs,
        estimatedSugar: analysis.estimatedSugar,
        aiSummary: analysis.summary
      }
    })
    
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - Retrieve meal history
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const date = searchParams.get('date')
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = { userId: authResult.user.userId }
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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 