import { NextRequest, NextResponse } from 'next/server'
import { analyzeMeal, generateClarifyingQuestions } from '@/lib/ai-service'

export async function POST(request: NextRequest) {
  try {
    // Remove authentication for MVP deployability
    // const authHeader = request.headers.get('authorization')
    // const token = extractTokenFromHeader(authHeader || undefined)
    // const user = token ? verifyToken(token) : null
    
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { description, action = 'analyze' } = await request.json()

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    if (action === 'analyze') {
      const analysis = await analyzeMeal(description)
      
      return NextResponse.json({
        action: 'analyze',
        analysis,
        message: analysis.summary,
        recommendations: analysis.recommendations,
        error: analysis.error
      })
    } else if (action === 'clarify') {
      const questions = await generateClarifyingQuestions(description)
      
      return NextResponse.json({
        action: 'clarify',
        questions,
        error: questions.some(q => q.includes('AI temporarily unavailable')) ? 
          'AI temporarily unavailable due to quota limits.' : undefined
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "analyze" or "clarify"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in AI analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze meal' },
      { status: 500 }
    )
  }
} 