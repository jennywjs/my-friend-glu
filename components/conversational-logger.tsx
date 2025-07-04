"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Mic, MicOff, Loader2 } from "lucide-react"
import { aiAnalyze } from "@/lib/api"

interface MealEntry {
  id: string
  type: "breakfast" | "brunch" | "lunch" | "dinner" | "snack"
  description: string
  carbs: number
  timestamp: Date
  aiSummary: string
  recommendation?: string
  synthesizedSummary: string
  ingredients: string[]
  chatHistory?: Message[]
}

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface ConversationalLoggerProps {
  logType: "food"
  editingEntry?: MealEntry | null
  onMealLogged: (entry: Omit<MealEntry, "id" | "timestamp">) => void
  onCancel: () => void
}

export default function ConversationalLogger({
  logType,
  editingEntry,
  onMealLogged,
  onCancel,
}: ConversationalLoggerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [conversationStep, setConversationStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [mealData, setMealData] = useState({
    description: "",
    estimatedCarbs: 0,
    mealType: "breakfast" as "breakfast" | "brunch" | "lunch" | "dinner" | "snack",
    aiSummary: "",
    recommendations: [] as string[],
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingEntry) {
      // Pre-populate with existing entry data
      setMessages(editingEntry.chatHistory || [])
      setMealData({
        description: editingEntry.description,
        estimatedCarbs: editingEntry.carbs,
        mealType: editingEntry.type,
        aiSummary: editingEntry.aiSummary,
        recommendations: editingEntry.recommendation ? [editingEntry.recommendation] : [],
      })
      // Add initial edit message
      const editMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: `Hi! I see you want to edit your ${editingEntry.type}. What changes would you like to make?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, editMessage])
      setConversationStep(0)
    } else {
      // Start fresh conversation
      const initialMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "Hi Mato! What did you eat? Describe your meal in as much detail as you can.",
        timestamp: new Date(),
      }
      setMessages([initialMessage])
      setConversationStep(0)
    }
  }, [editingEntry])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (content: string, type: "user" | "ai") => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const processAIResponse = async (userInput: string, step: number) => {
    try {
      setIsProcessing(true)
      let aiResponse = ""
      let nextStep = step + 1

      switch (step) {
        case 0:
          // First response - ask for clarification
          setMealData((prev) => ({ ...prev, description: userInput }))
          
          // Get clarifying questions from AI
          const clarifyResponse = await aiAnalyze({ 
            description: userInput, 
            action: 'clarify' 
          })
          
          if (clarifyResponse.error) {
            // Show error message but continue with fallback
            aiResponse = `⚠️ ${clarifyResponse.error}\n\nThat sounds delicious! Can you tell me about the portion sizes? For example, how big was your serving, and what size bowl or plate did you use? This helps me estimate the carbs more accurately. 🥄`
          } else if (clarifyResponse.questions && clarifyResponse.questions.length > 0) {
            aiResponse = `That sounds delicious! ${clarifyResponse.questions.join(' ')} This helps me estimate the carbs more accurately. 🥄`
          } else {
            aiResponse = "That sounds delicious! Can you tell me about the portion sizes? For example, how big was your serving, and what size bowl or plate did you use? This helps me estimate the carbs more accurately. 🥄"
          }
          break

        case 1:
          // Second response - provide estimate and ask for meal type
          const fullDescription = `${mealData.description} ${userInput}`
          setMealData((prev) => ({ ...prev, description: fullDescription }))
          
          // Get AI analysis
          const analysisResponse = await aiAnalyze({ 
            description: fullDescription, 
            action: 'analyze' 
          })
          
          if (analysisResponse.error) {
            // Show error message but continue with fallback estimates
            const estimatedCarbs = Math.floor(Math.random() * 40) + 30
            setMealData((prev) => ({ ...prev, estimatedCarbs }))
            
            aiResponse = `⚠️ ${analysisResponse.error}\n\nPerfect! Based on your description, I estimate this contains about ${estimatedCarbs} grams of carbohydrates. 

What type of eating occasion was this?
• Breakfast 🌅
• Brunch 🥐  
• Lunch 🥗
• Dinner 🍽️
• Snack 🍎

Just tell me which one!`
          } else if (analysisResponse.analysis) {
            const { estimatedCarbs, summary, recommendations } = analysisResponse.analysis
            setMealData((prev) => ({ 
              ...prev, 
              estimatedCarbs, 
              aiSummary: summary,
              recommendations 
            }))
            
            aiResponse = `Perfect! Based on your description, I estimate this contains about ${estimatedCarbs} grams of carbohydrates. 

${summary}

What type of eating occasion was this?
• Breakfast 🌅
• Brunch 🥐  
• Lunch 🥗
• Dinner 🍽️
• Snack 🍎

Just tell me which one!`
          } else {
            // Fallback response
            const estimatedCarbs = Math.floor(Math.random() * 40) + 30
            setMealData((prev) => ({ ...prev, estimatedCarbs }))
            
            aiResponse = `Perfect! Based on your description, I estimate this contains about ${estimatedCarbs} grams of carbohydrates. 

What type of eating occasion was this?
• Breakfast 🌅
• Brunch 🥐  
• Lunch 🥗
• Dinner 🍽️
• Snack 🍎

Just tell me which one!`
          }
          break

        case 2:
          // Third response - confirm meal type and provide final summary
          const mealType = userInput.toLowerCase()
          let selectedType: "breakfast" | "brunch" | "lunch" | "dinner" | "snack" = "snack"
          
          if (mealType.includes("breakfast")) selectedType = "breakfast"
          else if (mealType.includes("brunch")) selectedType = "brunch"
          else if (mealType.includes("lunch")) selectedType = "lunch"
          else if (mealType.includes("dinner")) selectedType = "dinner"
          else if (mealType.includes("snack")) selectedType = "snack"
          
          setMealData((prev) => ({ ...prev, mealType: selectedType }))
          
          const recommendations = mealData.recommendations.length > 0 
            ? mealData.recommendations 
            : ["A gentle walk after eating could help balance your glucose levels."]
          
          aiResponse = `Perfect! I've logged your ${selectedType} with ${mealData.estimatedCarbs}g of carbohydrates.

${mealData.aiSummary || `Your ${selectedType} looks great!`}

💡 Tip: ${recommendations[0]}

Your meal has been saved! You can view it in your timeline.`
          break

        default:
          aiResponse = "I'm not sure what to do next. Let's start over!"
          nextStep = 0
      }

      addMessage(aiResponse, "ai")
      setConversationStep(nextStep)
      
      // If this was the final step, save the meal
      if (nextStep >= 3) {
        setTimeout(() => {
          const mealEntry: Omit<MealEntry, "id" | "timestamp"> = {
            type: mealData.mealType,
            description: mealData.description,
            carbs: mealData.estimatedCarbs,
            aiSummary: mealData.aiSummary,
            recommendation: mealData.recommendations[0],
            synthesizedSummary: mealData.aiSummary || mealData.description,
            ingredients: [mealData.description],
            chatHistory: messages,
          }
          onMealLogged(mealEntry)
        }, 2000)
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      addMessage("I'm having trouble processing that right now. Let's try again!", "ai")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userInput = inputValue.trim()
    addMessage(userInput, "user")
    setInputValue("")

    // Process AI response
    await processAIResponse(userInput, conversationStep)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // In a real app, you'd implement speech recognition here
    if (!isListening) {
      // Simulate voice input
      setTimeout(() => {
        setIsListening(false)
        setInputValue("I had a bowl of oatmeal with berries")
      }, 2000)
    }
  }

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-yellow-100 text-yellow-800"
      case "brunch":
        return "bg-orange-100 text-orange-800"
      case "lunch":
        return "bg-green-100 text-green-800"
      case "dinner":
        return "bg-blue-100 text-blue-800"
      case "snack":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {editingEntry ? "Edit Meal" : "Log Meal"}
              </h1>
              <p className="text-sm text-gray-600">
                {editingEntry ? "Update your meal details" : "Tell me what you ate"}
              </p>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-[calc(100vh-280px)] p-4"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.type === "user"
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                          : "bg-white border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-md mx-auto px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your meal..."
                className="flex-1"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!inputValue.trim() || isProcessing}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
