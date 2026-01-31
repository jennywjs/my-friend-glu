"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Camera, Image as ImageIcon, Loader2 } from "lucide-react"
import { aiAnalyze, aiAnalyzePhoto, logMeal } from "@/lib/api"

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
  photoUrl?: string
}

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  imageUrl?: string
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
  const [conversationStep, setConversationStep] = useState(-1) // -1 = photo capture step
  const [isProcessing, setIsProcessing] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [showTextInput, setShowTextInput] = useState(false)
  const [readyToLog, setReadyToLog] = useState(false) // New state for showing Log button
  const [mealData, setMealData] = useState({
    description: "",
    estimatedCarbs: 0,
    mealType: "snack" as "breakfast" | "brunch" | "lunch" | "dinner" | "snack",
    aiSummary: "",
    carbSource: "",
    recommendations: [] as string[],
    photoUrl: "",
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingEntry) {
      setMessages(editingEntry.chatHistory || [])
      setMealData({
        description: editingEntry.description,
        estimatedCarbs: editingEntry.carbs,
        mealType: editingEntry.type,
        aiSummary: editingEntry.aiSummary,
        carbSource: "",
        recommendations: editingEntry.recommendation ? [editingEntry.recommendation] : [],
        photoUrl: editingEntry.photoUrl || "",
      })
      if (editingEntry.photoUrl) {
        setCapturedPhoto(editingEntry.photoUrl)
      }
      const editMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: "ai",
        content: `I see you want to update this meal. Would you like to take a new photo, or just tell me what changed?`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, editMessage])
      setConversationStep(0)
      setShowTextInput(true)
    }
  }, [editingEntry])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const addMessage = (content: string, type: "user" | "ai", imageUrl?: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      content,
      timestamp: new Date(),
      imageUrl,
    }
    setMessages((prev) => [...prev, newMessage])
    return newMessage
  }

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error uploading photo:', error)
      return null
    }
  }

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string
      setCapturedPhoto(previewUrl)
      
      addMessage("Here's what I'm eating", "user", previewUrl)
      
      setConversationStep(0)
      setShowTextInput(false) // Don't show text input yet
      setIsProcessing(true)
      
      const uploadedUrl = await uploadPhoto(file)
      
      if (uploadedUrl) {
        setMealData((prev) => ({ ...prev, photoUrl: uploadedUrl }))
        setCapturedPhoto(uploadedUrl)
        await processPhotoWithAI(uploadedUrl)
      } else {
        setMealData((prev) => ({ ...prev, photoUrl: previewUrl }))
        await processPhotoWithAI(previewUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const processPhotoWithAI = async (photoUrl: string) => {
    setIsProcessing(true)
    try {
      const response = await aiAnalyzePhoto({ imageUrl: photoUrl })
      console.log('[v0] AI Photo response:', response)
      
      if (response.analysis && !response.analysis.error && response.analysis.foods?.length > 0) {
        const { foods, description, carbSource, estimatedCarbs } = response.analysis
        
        const foodList = foods.length > 0 ? foods.join(', ') : description
        
        setMealData((prev) => ({ 
          ...prev, 
          description: foodList,
          carbSource: carbSource || '',
          estimatedCarbs: estimatedCarbs || 0,
          aiSummary: carbSource ? `Most carbs from ${carbSource}` : foodList,
        }))
        
        // Show carb estimate directly - no questions
        const aiResponse = `I see ${foodList}!

**Estimated carbs: ~${estimatedCarbs}g**
${carbSource ? `\nMost carbs come from the ${carbSource}.` : ''}

Tap "Log Meal" below when you're ready to save.`
        
        addMessage(aiResponse, "ai")
        setReadyToLog(true) // Show the Log button
        setShowTextInput(false)
      } else {
        // AI couldn't analyze - ask for description
        addMessage("I couldn't quite make out the food. Could you describe what you're eating?", "ai")
        setShowTextInput(true)
        setConversationStep(0)
      }
    } catch (error) {
      console.error('Error processing photo:', error)
      addMessage("I couldn't quite make out the food. Could you describe what you're eating?", "ai")
      setShowTextInput(true)
      setConversationStep(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogMeal = async () => {
    setIsProcessing(true)
    
    try {
      // Determine meal type based on time of day
      const hour = new Date().getHours()
      let autoMealType: "breakfast" | "brunch" | "lunch" | "dinner" | "snack" = "snack"
      if (hour >= 5 && hour < 10) autoMealType = "breakfast"
      else if (hour >= 10 && hour < 12) autoMealType = "brunch"
      else if (hour >= 12 && hour < 15) autoMealType = "lunch"
      else if (hour >= 17 && hour < 21) autoMealType = "dinner"
      
      // Save to database
      const result = await logMeal({
        description: mealData.description,
        mealType: autoMealType.toUpperCase(),
        photoUrl: mealData.photoUrl,
        carbSource: mealData.carbSource,
      })
      
      console.log('[v0] Meal logged result:', result)
      
      // Create meal entry for parent component
      const mealEntry: Omit<MealEntry, "id" | "timestamp"> = {
        type: autoMealType,
        description: mealData.description,
        carbs: mealData.estimatedCarbs,
        aiSummary: mealData.aiSummary || `${mealData.estimatedCarbs}g carbs`,
        synthesizedSummary: mealData.carbSource ? `Most carbs from ${mealData.carbSource}` : mealData.description,
        ingredients: [mealData.description],
        chatHistory: messages,
        photoUrl: mealData.photoUrl,
      }
      
      addMessage(`Logged! Your ${autoMealType} has been saved.`, "ai")
      
      setTimeout(() => {
        onMealLogged(mealEntry)
      }, 1000)
    } catch (error) {
      console.error('Error logging meal:', error)
      addMessage("Something went wrong saving your meal. Please try again.", "ai")
    } finally {
      setIsProcessing(false)
    }
  }

  const processAIResponse = async (userInput: string, step: number) => {
    try {
      setIsProcessing(true)

      if (step === 0) {
        // User described their meal via text
        setMealData((prev) => ({ ...prev, description: userInput }))
        
        // Get AI analysis for text description
        const analysisResponse = await aiAnalyze({ 
          description: userInput, 
          action: 'analyze' 
        })
        
        if (analysisResponse.analysis) {
          const { estimatedCarbs, summary, carbSource } = analysisResponse.analysis
          
          setMealData((prev) => ({ 
            ...prev, 
            estimatedCarbs, 
            aiSummary: summary,
            carbSource: carbSource || extractCarbSource(userInput),
          }))
          
          const aiResponse = `Got it!

**Estimated carbs: ~${estimatedCarbs}g**
${carbSource ? `\nMost carbs come from the ${carbSource}.` : ''}

Tap "Log Meal" below when you're ready to save.`
          
          addMessage(aiResponse, "ai")
          setReadyToLog(true)
          setShowTextInput(false)
        } else {
          // Fallback estimate
          const estimatedCarbs = 30
          const carbSource = extractCarbSource(userInput)
          
          setMealData((prev) => ({ 
            ...prev, 
            estimatedCarbs,
            carbSource,
          }))
          
          const aiResponse = `Got it!

**Estimated carbs: ~${estimatedCarbs}g**
${carbSource ? `\nMost carbs come from the ${carbSource}.` : ''}

Tap "Log Meal" below when you're ready to save.`
          
          addMessage(aiResponse, "ai")
          setReadyToLog(true)
          setShowTextInput(false)
        }
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      addMessage("Something went wrong. Let's try that again!", "ai")
    } finally {
      setIsProcessing(false)
    }
  }

  const extractCarbSource = (description: string): string => {
    const carbFoods = [
      'rice', 'pasta', 'noodles', 'bread', 'naan', 'tortilla', 'potato', 'fries',
      'beans', 'lentils', 'oatmeal', 'cereal', 'fruit', 'banana', 'apple',
      'quinoa', 'couscous', 'wrap', 'bun', 'roll', 'crackers', 'chips'
    ]
    const lowerDesc = description.toLowerCase()
    const found = carbFoods.find(food => lowerDesc.includes(food))
    return found || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isProcessing) return

    const userInput = inputValue.trim()
    addMessage(userInput, "user")
    setInputValue("")

    await processAIResponse(userInput, conversationStep)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextFallback = () => {
    setShowTextInput(true)
    setConversationStep(0)
    addMessage("What did you eat? Just describe it however feels natural.", "ai")
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    setMessages([])
    setConversationStep(-1)
    setShowTextInput(false)
    setReadyToLog(false)
    setMealData({
      description: "",
      estimatedCarbs: 0,
      mealType: "snack",
      aiSummary: "",
      carbSource: "",
      recommendations: [],
      photoUrl: "",
    })
  }

  // Photo capture screen (default first step)
  if (conversationStep === -1 && !editingEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200">
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-lg font-medium text-stone-900">Log Meal</h1>
              <div className="w-16" />
            </div>
          </div>
        </div>

        {/* Photo Capture Area */}
        <div className="max-w-md mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-stone-900 mb-2">
              What are you eating?
            </h2>
            <p className="text-stone-600">
              Snap a photo and I'll estimate the carbs
            </p>
          </div>

          {/* Camera Button - Primary Action */}
          <div className="space-y-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-300 bg-white hover:bg-stone-50 hover:border-stone-400 transition-all flex flex-col items-center justify-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <span className="text-lg font-medium text-stone-700">Take Photo</span>
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {/* Secondary Options */}
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-4 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
              >
                <ImageIcon className="h-5 w-5 text-stone-500" />
                <span className="text-stone-700">Choose Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <button
                onClick={handleTextFallback}
                className="flex-1 py-4 px-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition-colors text-stone-700"
              >
                Type Instead
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-lg font-medium text-stone-900">
              {editingEntry ? "Edit Meal" : "Log Meal"}
            </h1>
            {capturedPhoto && (
              <Button
                variant="ghost"
                size="sm"
                onClick={retakePhoto}
                className="text-stone-600 hover:text-stone-900"
              >
                Retake
              </Button>
            )}
            {!capturedPhoto && <div className="w-16" />}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="max-w-md mx-auto px-4 py-4 pb-32">
        {/* Photo Preview */}
        {capturedPhoto && (
          <div className="mb-4 relative">
            <img
              src={capturedPhoto}
              alt="Meal photo"
              className="w-full aspect-[4/3] object-cover rounded-xl"
            />
          </div>
        )}

        <Card className="shadow-sm border-stone-200">
          <CardContent className="p-0">
            <ScrollArea 
              ref={scrollAreaRef}
              className="h-[calc(100vh-480px)] p-4"
            >
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.type === "user"
                          ? "bg-stone-900 text-white"
                          : "bg-white border border-stone-200 text-stone-900"
                      }`}
                    >
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Food"
                          className="w-full rounded-lg mb-2"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                        <span className="text-sm text-stone-600">Analyzing your meal...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Action Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-stone-200">
        <div className="max-w-md mx-auto px-4 py-4">
          {readyToLog ? (
            // Show Log button when ready
            <Button
              onClick={handleLogMeal}
              disabled={isProcessing}
              className="w-full py-6 text-lg font-medium rounded-xl bg-stone-900 hover:bg-stone-800"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : null}
              Log Meal
            </Button>
          ) : showTextInput ? (
            // Show text input when AI needs clarification
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you ate..."
                className="flex-1 rounded-xl border-stone-200 bg-white py-6"
                disabled={isProcessing}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isProcessing}
                className="rounded-xl bg-stone-900 hover:bg-stone-800 h-12 w-12"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
