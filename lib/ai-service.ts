import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface MealAnalysis {
  estimatedCarbs: number
  estimatedSugar: number
  summary: string
  recommendations: string[]
  error?: string
}

export async function analyzeMeal(description: string): Promise<MealAnalysis> {
  const prompt = `
You are a nutritionist specializing in gestational diabetes. Analyze the following meal description and provide:

1. Estimated carbohydrates in grams
2. Estimated sugar in grams
3. A brief summary of the meal
4. 2-3 actionable recommendations for managing blood glucose

Meal description: "${description}"

Respond in JSON format:
{
  "estimatedCarbs": number,
  "estimatedSugar": number,
  "summary": "string",
  "recommendations": ["string", "string"]
}

Be conservative with estimates and consider cultural foods. Focus on practical advice for expecting mothers with gestational diabetes.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful nutritionist assistant for gestational diabetes management."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from AI service')
    }

    const analysis = JSON.parse(response) as MealAnalysis
    
    // Validate the response
    if (typeof analysis.estimatedCarbs !== 'number' || 
        typeof analysis.estimatedSugar !== 'number' ||
        typeof analysis.summary !== 'string' ||
        !Array.isArray(analysis.recommendations)) {
      throw new Error('Invalid AI response format')
    }

    return analysis
  } catch (error: any) {
    console.error('AI analysis error:', error)
    
    // Check for specific OpenAI quota error
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return {
        estimatedCarbs: 30,
        estimatedSugar: 5,
        summary: `Meal logged: ${description}`,
        recommendations: [
          "Consider taking a gentle walk after this meal",
          "Monitor your blood glucose levels in the next 2 hours"
        ],
        error: "AI analysis temporarily unavailable due to quota limits. Using standard estimates."
      }
    }
    
    // Fallback response for other errors
    return {
      estimatedCarbs: 30,
      estimatedSugar: 5,
      summary: `Meal logged: ${description}`,
      recommendations: [
        "Consider taking a gentle walk after this meal",
        "Monitor your blood glucose levels in the next 2 hours"
      ],
      error: "AI analysis temporarily unavailable. Using standard estimates."
    }
  }
}

export async function generateClarifyingQuestions(description: string): Promise<string[]> {
  const prompt = `
Given this meal description: "${description}"

Generate 1-2 clarifying questions to better estimate the nutritional content. Focus on:
- Portion sizes
- Specific ingredients
- Cooking methods
- Cultural food items

Return as a JSON array of strings.
`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful nutritionist assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      return ["Could you tell me more about the portion sizes?"]
    }

    const questions = JSON.parse(response) as string[]
    return Array.isArray(questions) ? questions : ["Could you tell me more about the portion sizes?"]
  } catch (error: any) {
    console.error('Error generating clarifying questions:', error)
    
    // Check for specific OpenAI quota error
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      return ["AI temporarily unavailable. Could you tell me more about the portion sizes?"]
    }
    
    return ["Could you tell me more about the portion sizes?"]
  }
}
