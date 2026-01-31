import { generateText, Output } from 'ai'
import { z } from 'zod'

export interface MealAnalysis {
  estimatedCarbs: number
  estimatedSugar: number
  summary: string
  carbSource: string
  foodItems: string[]
  error?: string
}

export interface PhotoAnalysis {
  foods: string[]
  description: string
  carbSource: string
  estimatedCarbs: number
  error?: string
}

const MealAnalysisSchema = z.object({
  estimatedCarbs: z.number(),
  estimatedSugar: z.number(),
  summary: z.string(),
  carbSource: z.string().nullable(),
  foodItems: z.array(z.string()),
})

const PhotoAnalysisSchema = z.object({
  foods: z.array(z.string()),
  description: z.string(),
  carbSource: z.string().nullable(),
  estimatedCarbs: z.number(),
})

export async function analyzeMeal(description: string): Promise<MealAnalysis> {
  const prompt = `
You are a friendly carb-awareness assistant. Analyze the following meal description and provide:

1. Estimated carbohydrates in grams (be conservative)
2. Estimated sugar in grams
3. A brief, friendly summary (1-2 sentences)
4. The main carb source (e.g., "rice", "pasta", "bread")
5. List of identified food items

Meal description: "${description}"

Important:
- Focus ONLY on carbs, not calories or other macros
- Be non-judgmental and supportive
- Handle cultural/diverse foods accurately
- Use simple language
`

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
      experimental_output: Output.object({
        schema: MealAnalysisSchema,
      }),
    })

    const analysis = result.experimental_output
    
    if (!analysis) {
      throw new Error('No analysis output')
    }

    return {
      estimatedCarbs: analysis.estimatedCarbs,
      estimatedSugar: analysis.estimatedSugar,
      summary: analysis.summary,
      carbSource: analysis.carbSource || '',
      foodItems: analysis.foodItems,
    }
  } catch (error: unknown) {
    console.error('AI analysis error:', error)
    
    // Fallback response
    return {
      estimatedCarbs: 30,
      estimatedSugar: 5,
      summary: `Meal logged: ${description}`,
      carbSource: '',
      foodItems: [description],
      error: "AI analysis temporarily unavailable. Using standard estimates."
    }
  }
}

export async function analyzePhotoMeal(imageUrl: string): Promise<PhotoAnalysis> {
  console.log('[v0] analyzePhotoMeal called with imageUrl:', imageUrl?.substring(0, 100))
  
  const prompt = `
You are a friendly carb-awareness assistant helping someone track their meals.

Look at this food photo and identify:
1. All visible food items (be specific about cultural dishes)
2. A natural description of the meal
3. The main carbohydrate source (e.g., "rice", "naan", "pasta")
4. Estimated total carbohydrates in grams

Important guidelines:
- Focus ONLY on carbs, not calories or other macros
- Be non-judgmental and supportive  
- Recognize diverse cuisines (Indian, Mexican, Asian, etc.)
- If portion is unclear, assume a typical serving
- Use simple, friendly language
`

  try {
    console.log('[v0] Calling generateText with image...')
    const result = await generateText({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image', image: new URL(imageUrl) },
          ],
        },
      ],
      experimental_output: Output.object({
        schema: PhotoAnalysisSchema,
      }),
    })
    console.log('[v0] generateText result:', result.experimental_output)

    const analysis = result.experimental_output
    
    if (!analysis) {
      throw new Error('No analysis output')
    }

    return {
      foods: analysis.foods,
      description: analysis.description,
      carbSource: analysis.carbSource || '',
      estimatedCarbs: analysis.estimatedCarbs,
    }
  } catch (error: unknown) {
    console.error('[v0] Photo analysis error:', error)
    console.error('[v0] Error details:', error instanceof Error ? error.message : String(error))
    
    return {
      foods: [],
      description: '',
      carbSource: '',
      estimatedCarbs: 0,
      error: "Couldn't analyze the photo. Please describe what you're eating."
    }
  }
}

export async function generateClarifyingQuestions(description: string): Promise<string[]> {
  const prompt = `
Given this meal description: "${description}"

Generate 1 simple question to better estimate carbs. Focus on:
- Portion size using relatable terms (like "fist-sized" or "cup")
- Main starchy items

Keep it conversational and non-judgmental. Return as a JSON array with 1 question.
`

  try {
    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      prompt,
    })

    const response = result.text
    if (!response) {
      return ["Was this a regular portion, or was it on the larger or smaller side?"]
    }

    const questions = JSON.parse(response) as string[]
    return Array.isArray(questions) ? questions : ["Was this a regular portion?"]
  } catch (error: unknown) {
    console.error('Error generating clarifying questions:', error)
    return ["Was this a regular portion, or was it on the larger or smaller side?"]
  }
}
