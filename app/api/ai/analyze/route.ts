import { NextRequest, NextResponse } from 'next/server'
import { analyzeMeal, analyzePhotoMeal, generateClarifyingQuestions } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    const { description, imageUrl, action = 'analyze' } = await request.json()

    // Photo analysis action
    if (action === 'photo' && imageUrl) {
      const analysis = await analyzePhotoMeal(imageUrl)
      
      return NextResponse.json({
        action: 'photo',
        analysis,
        error: analysis.error
      })
    }

    // Text-based analysis
    if (action === 'analyze') {
      if (!description) {
        return NextResponse.json(
          { error: 'Description is required for analysis' },
          { status: 400 }
        )
      }
      
      const analysis = await analyzeMeal(description)
      
      return NextResponse.json({
        action: 'analyze',
        analysis,
        message: analysis.summary,
        error: analysis.error
      })
    }
    
    // Clarifying questions
    if (action === 'clarify') {
      if (!description) {
        return NextResponse.json(
          { error: 'Description is required for clarification' },
          { status: 400 }
        )
      }
      
      const questions = await generateClarifyingQuestions(description)
      
      return NextResponse.json({
        action: 'clarify',
        questions,
        error: questions.some(q => q.includes('unavailable')) ? 
          'AI temporarily unavailable.' : undefined
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "analyze", "photo", or "clarify"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze meal' },
      { status: 500 }
    )
  }
}
