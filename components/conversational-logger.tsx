"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Mic, MicOff } from "lucide-react"

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
  const [currentStep, setCurrentStep] = useState<"initial" | "details" | "mealType" | "confirmation" | "done">(
    "initial",
  )
  const [mealData, setMealData] = useState<{
    description: string
    carbs: number
    type?: "breakfast" | "brunch" | "lunch" | "dinner" | "snack"
    ingredients: string[]
    recommendation?: string
  }>({
    description: "",
    carbs: 0,
    ingredients: [],
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingEntry) {
      // Pre-populate with existing entry data
      setMessages(editingEntry.chatHistory || [])
      setMealData({
        description: editingEntry.description,
        carbs: editingEntry.carbs,
        type: editingEntry.type,
        ingredients: editingEntry.ingredients,
        recommendation: editingEntry.recommendation,
      })
      // Add initial edit message
      const editMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: `Hi! I see you want to edit your ${editingEntry.type}. What changes would you like to make?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, editMessage])
      setCurrentStep("initial")
    } else {
      // Start fresh conversation
      const initialMessage: Message = {
        id: Date.now().toString(),
        type: "ai",
        content: "Hi Mato! What did you eat? Describe your meal in as much detail as you can.",
        timestamp: new Date(),
      }
      setMessages([initialMessage])
      setCurrentStep("initial")
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

  const simulateAIResponse = (userInput: string) => {
    try {
      setTimeout(
        () => {
          let aiResponse = ""
          let nextStep = currentStep

          switch (currentStep) {
            case "initial":
              // Analyze the food description
              const description = userInput.toLowerCase()
              let estimatedCarbs = 30 // Default estimate
              let ingredients: string[] = []
              let recommendation = ""

              // Simple keyword-based analysis
              if (description.includes("oatmeal") || description.includes("porridge")) {
                estimatedCarbs = 45
                ingredients = ["1 cup rolled oats", "1/2 cup mixed berries", "1 tbsp honey", "1 cup milk"]
                recommendation = "Great choice! The fiber helps slow glucose absorption."
              } else if (description.includes("apple") && description.includes("peanut butter")) {
                estimatedCarbs = 25
                ingredients = ["1 medium apple", "2 tbsp natural peanut butter"]
                recommendation = "Perfect snack balance of carbs and protein."
              } else if (description.includes("kung pao") || description.includes("chicken")) {
                estimatedCarbs = 55
                ingredients = ["1/2 plate kung pao chicken", "1 cup steamed rice", "1 bok choy", "spicy and sour soup"]
                recommendation = "Slightly high in carbs. A gentle walk could help balance your glucose."
              } else if (description.includes("sandwich")) {
                estimatedCarbs = 40
                ingredients = ["2 slices whole grain bread", "turkey", "lettuce", "tomato", "cheese"]
                recommendation = "Good protein balance. Consider whole grain bread for better glucose control."
              } else if (description.includes("salad")) {
                estimatedCarbs = 15
                ingredients = ["mixed greens", "cherry tomatoes", "cucumber", "olive oil dressing"]
                recommendation = "Excellent low-carb choice! Perfect for glucose management."
              } else {
                // Generic response
                ingredients = ["mixed ingredients based on your description"]
                recommendation = "Remember to monitor your glucose levels after eating."
              }

              setMealData((prev) => ({
                ...prev,
                description: userInput,
                carbs: estimatedCarbs,
                ingredients,
                recommendation,
              }))

              aiResponse = `I can see you had ${userInput}. Let me ask a few questions to get accurate details. How would you describe the portion size? Was it a small, medium, or large serving?`
              nextStep = "details"
              break

            case "details":
              // Adjust carbs based on portion size
              let carbAdjustment = 1
              if (userInput.toLowerCase().includes("small")) {
                carbAdjustment = 0.7
              } else if (userInput.toLowerCase().includes("large") || userInput.toLowerCase().includes("big")) {
                carbAdjustment = 1.3
              }

              const adjustedCarbs = Math.round(mealData.carbs * carbAdjustment)
              setMealData((prev) => ({ ...prev, carbs: adjustedCarbs }))

              aiResponse = `Got it! Based on your description, I estimate about ${adjustedCarbs}g of carbohydrates. Now, what type of meal was this?`
              nextStep = "mealType"
              break

            case "mealType":
              // Determine meal type
              let mealType: "breakfast" | "brunch" | "lunch" | "dinner" | "snack" = "snack"
              const input = userInput.toLowerCase()

              if (input.includes("breakfast")) mealType = "breakfast"
              else if (input.includes("brunch")) mealType = "brunch"
              else if (input.includes("lunch")) mealType = "lunch"
              else if (input.includes("dinner")) mealType = "dinner"
              else if (input.includes("snack")) mealType = "snack"
              else {
                // Auto-detect based on time
                const hour = new Date().getHours()
                if (hour < 10) mealType = "breakfast"
                else if (hour < 12) mealType = "brunch"
                else if (hour < 17) mealType = "lunch"
                else if (hour < 21) mealType = "dinner"
                else mealType = "snack"
              }

              setMealData((prev) => ({ ...prev, type: mealType }))

              aiResponse = `Perfect! I've logged this as a ${mealType}. Here's your meal summary:

**${mealType.charAt(0).toUpperCase() + mealType.slice(1)}**: ${mealData.description}
**Carbohydrates**: ${mealData.carbs}g
**Ingredients**: ${mealData.ingredients.join(", ")}

${mealData.recommendation ? `💡 **Tip**: ${mealData.recommendation}` : ""}

Does this look correct? Say "yes" to save or tell me what to change.`
              nextStep = "confirmation"
              break

            case "confirmation":
              if (
                userInput.toLowerCase().includes("yes") ||
                userInput.toLowerCase().includes("correct") ||
                userInput.toLowerCase().includes("save")
              ) {
                aiResponse =
                  "Great! Your meal has been saved successfully. You can now return to your timeline to see the entry."
                nextStep = "done"

                // Save the meal
                setTimeout(() => {
                  onMealLogged({
                    type: mealData.type!,
                    description: mealData.description,
                    carbs: mealData.carbs,
                    aiSummary: `${mealData.description} with ${mealData.carbs}g carbs`,
                    synthesizedSummary: `A ${mealData.type} with balanced nutrition`,
                    ingredients: mealData.ingredients,
                    recommendation: mealData.recommendation,
                    chatHistory: [
                      ...messages,
                      { id: Date.now().toString(), type: "user", content: userInput, timestamp: new Date() },
                    ],
                  })
                }, 1000)
              } else {
                aiResponse =
                  "What would you like to change? You can update the portion size, ingredients, or any other details."
                nextStep = "details"
              }
              break

            default:
              aiResponse = "I'm here to help you log your meals. What did you eat?"
              nextStep = "initial"
          }

          addMessage(aiResponse, "ai")
          setCurrentStep(nextStep)
        },
        1000 + Math.random() * 1000,
      ) // Simulate thinking time
    } catch (error) {
      console.error("Error in AI response:", error)
      addMessage("Sorry, I encountered an error. Please try again.", "ai")
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    addMessage(inputValue, "user")
    simulateAIResponse(inputValue)
    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage()
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{editingEntry ? "Edit Meal" : "Log Food"}</h1>
              <p className="text-sm text-gray-600">
                {editingEntry ? "Update your meal details" : "Tell me what you ate"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 pb-24">
        {/* Chat Messages */}
        <ScrollArea className="h-[calc(100vh-200px)] mb-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] ${
                    message.type === "user" ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white" : "bg-white"
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.type === "user" ? "text-pink-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Meal Type Selection */}
            {currentStep === "mealType" && (
              <div className="flex justify-start">
                <Card className="bg-white max-w-[80%]">
                  <CardContent className="p-3">
                    <p className="text-sm mb-3">Quick select meal type:</p>
                    <div className="flex flex-wrap gap-2">
                      {["breakfast", "brunch", "lunch", "dinner", "snack"].map((type) => (
                        <Badge
                          key={type}
                          className={`cursor-pointer hover:opacity-80 ${getMealTypeColor(type)}`}
                          onClick={() => {
                            addMessage(type, "user")
                            simulateAIResponse(type)
                          }}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        {currentStep === "done" ? (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-md mx-auto px-4 py-3">
              <Button onClick={onCancel} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                Done - Return to Timeline
              </Button>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
            <div className="max-w-md mx-auto px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                    onClick={toggleListening}
                  >
                    {isListening ? <MicOff className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isListening && <p className="text-xs text-center text-gray-500 mt-2">🎤 Listening... (simulated)</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
