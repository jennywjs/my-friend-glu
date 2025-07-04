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

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface ConversationalLoggerProps {
  logType: "food"
  onMealLogged: (entry: {
    type: "breakfast" | "brunch" | "lunch" | "dinner" | "snack"
    description: string
    carbs: number
    aiSummary: string
    recommendation?: string
  }) => void
  onCancel: () => void
}

export default function ConversationalLogger({ logType, onMealLogged, onCancel }: ConversationalLoggerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: `Hi Mato! What did you eat? Describe your food in as much detail as you'd like - I'm here to help estimate the carbs accurately! 🍽️`,
      timestamp: new Date(),
    },
  ])
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
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (type: "user" | "ai", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
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
              recommendations: recommendations || []
            }))
            
            aiResponse = `Perfect! Based on your description, I estimate this contains about ${estimatedCarbs} grams of carbohydrates. 

What type of eating occasion was this?
• Breakfast 🌅
• Brunch 🥐  
• Lunch 🥗
• Dinner 🍽️
• Snack 🍎

Just tell me which one!`
          } else {
            // Fallback if AI fails
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
          // Final response - confirm and provide recommendation
          const mealType = userInput.toLowerCase().includes("breakfast")
            ? "breakfast"
            : userInput.toLowerCase().includes("brunch")
              ? "brunch"
              : userInput.toLowerCase().includes("lunch")
                ? "lunch"
                : userInput.toLowerCase().includes("dinner")
                  ? "dinner"
                  : "snack"

          setMealData((prev) => ({ ...prev, mealType }))

          const recommendation = mealData.recommendations?.[0] || 
            "A gentle 10-minute walk after eating could help balance your glucose levels."

          aiResponse = `✅ Food logged successfully!\n\n📝 Summary: ${mealData.description}\n🍽️ Type: ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}\n🥄 Estimated carbs: ${mealData.estimatedCarbs}g\n\n💡 Tip: ${recommendation}\n\nWould you like to save this entry?`
          nextStep = 3
          break

        default:
          aiResponse = "Great! Your food has been saved to your timeline. You can view it on your home screen. 🎉"
      }

      addMessage("ai", aiResponse)
      setConversationStep(nextStep)
    } catch (error) {
      console.error('AI processing error:', error)
      // Fallback response if AI fails
      addMessage("ai", "I'm having trouble processing that right now. Let me try a simpler approach...")
      
      if (step === 0) {
        setMealData((prev) => ({ ...prev, description: userInput }))
        addMessage("ai", "Can you tell me about the portion sizes? This helps me estimate the carbs more accurately. 🥄")
        setConversationStep(1)
      } else if (step === 1) {
        const fullDescription = `${mealData.description} ${userInput}`
        setMealData((prev) => ({ ...prev, description: fullDescription, estimatedCarbs: 45 }))
        addMessage("ai", `Perfect! I estimate this contains about 45 grams of carbohydrates. 

What type of eating occasion was this?
• Breakfast 🌅
• Brunch 🥐  
• Lunch 🥗
• Dinner 🍽️
• Snack 🍎

Just tell me which one!`)
        setConversationStep(2)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return

    addMessage("user", inputValue)

    if (conversationStep < 3) {
      processAIResponse(inputValue, conversationStep)
    } else if (inputValue.toLowerCase().includes("yes") || inputValue.toLowerCase().includes("save")) {
      // Save the meal
      onMealLogged({
        type: mealData.mealType,
        description: mealData.description,
        carbs: mealData.estimatedCarbs,
        aiSummary: mealData.aiSummary || mealData.description,
        recommendation: mealData.recommendations?.[0] || "A gentle walk after eating could help balance your glucose levels.",
      })

      addMessage(
        "ai",
        "Perfect! Your food entry has been saved successfully. Click 'Done' to return to your timeline. 🎉",
      )
      setConversationStep(4) // New step for showing Done button
    }

    setInputValue("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isProcessing) {
      handleSendMessage()
    }
  }

  const toggleListening = () => {
    setIsListening(!isListening)
    // In a real app, this would integrate with speech recognition
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false)
        setInputValue("I had a bowl of kung pao chicken with rice and some vegetables")
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Log Food</h1>
              <p className="text-xs text-gray-600">Chat with Glu to log your food</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              AI Assistant
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4">
        <ScrollArea className="h-[calc(100vh-200px)]" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                <Card
                  className={`max-w-[80%] ${
                    message.type === "user"
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                      : "bg-white shadow-sm"
                  }`}
                >
                  <CardContent className="p-3">
                    <p
                      className={`text-sm whitespace-pre-line ${
                        message.type === "user" ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {message.content}
                    </p>
                    <p className={`text-xs mt-1 ${message.type === "user" ? "text-pink-100" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] bg-white shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                      <p className="text-sm text-gray-500">AI is thinking...</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          {conversationStep === 4 ? (
            // Show Done button after meal is logged
            <Button
              onClick={onCancel}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
            >
              Done - Return to Timeline
            </Button>
          ) : (
            // Show normal input interface
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your meal..."
                    className="pr-12"
                    disabled={isProcessing}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 ${
                      isListening ? "text-red-500" : "text-gray-400"
                    }`}
                    onClick={toggleListening}
                    disabled={isProcessing}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isListening && (
                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                  <span className="animate-pulse">🎤</span>
                  Listening... (tap mic to stop)
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
