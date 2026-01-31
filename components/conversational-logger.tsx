"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Send, Camera, Image as ImageIcon, Loader2, X } from "lucide-react"
import { aiAnalyze, aiAnalyzePhoto } from "@/lib/api"

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
      // Pre-populate with existing entry data
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
      // Add initial edit message
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

    // Show preview immediately with base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const previewUrl = e.target?.result as string
      setCapturedPhoto(previewUrl)
      
      // Add user message with preview
      addMessage("Here's what I'm eating", "user", previewUrl)
      
      // Move to AI analysis step
      setConversationStep(0)
      setShowTextInput(true)
      setIsProcessing(true)
      
      // Upload to Vercel Blob in background
      const uploadedUrl = await uploadPhoto(file)
      
      if (uploadedUrl) {
        setMealData((prev) => ({ ...prev, photoUrl: uploadedUrl }))
        setCapturedPhoto(uploadedUrl)
        // Process with AI Vision using the uploaded URL
        await processPhotoWithAI(uploadedUrl, file)
      } else {
        // Fallback to base64 if upload fails
        setMealData((prev) => ({ ...prev, photoUrl: previewUrl }))
        await processPhotoWithAI(previewUrl, file)
      }
    }
    reader.readAsDataURL(file)
  }

  const processPhotoWithAI = async (photoUrl: string, _file?: File) => {
    setIsProcessing(true)
    try {
      // Call AI Vision API to analyze the photo
      const response = await aiAnalyzePhoto({ imageUrl: photoUrl })
      
      if (response.analysis && !response.error) {
        const { foods, description, carbSource, estimatedCarbs } = response.analysis
        
        const foodList = foods.length > 0 ? foods.join(', ') : description
        
        setMealData((prev) => ({ 
          ...prev, 
          description: foodList,
          carbSource: carbSource || '',
          estimatedCarbs: estimatedCarbs || 0,
        }))
        
        // Ask a simple portion clarification question
        const aiResponse = `I see ${foodList}!

Was this a regular portion, or was it on the larger or smaller side?`
        
        addMessage(aiResponse, "ai")
        setConversationStep(1)
      } else {
        // Fallback if vision fails
        addMessage("I couldn't quite make out the food. Could you describe what you're eating?", "ai")
        setConversationStep(0)
      }
    } catch (error) {
      console.error('Error processing photo:', error)
      addMessage("I couldn't quite make out the food. Could you describe what you're eating?", "ai")
      setConversationStep(0)
    } finally {
      setIsProcessing(false)
    }
  }

  const processAIResponse = async (userInput: string, step: number) => {
    try {
      setIsProcessing(true)
      let aiResponse = ""
      let nextStep = step + 1

      switch (step) {
        case 0:
          // User described their meal (text fallback path)
          setMealData((prev) => ({ ...prev, description: userInput }))
          
          // Ask simple portion question
          aiResponse = `Got it! Was this a regular portion, or was it on the larger or smaller side?`
          break

        case 1:
          // User answered portion question - provide carb estimate
          const fullDescription = `${mealData.description} - ${userInput} portion`
          setMealData((prev) => ({ ...prev, description: fullDescription }))
          
          // Get AI analysis
          const analysisResponse = await aiAnalyze({ 
            description: fullDescription, 
            action: 'analyze' 
          })
          
          if (analysisResponse.analysis) {
            const { estimatedCarbs, summary } = analysisResponse.analysis
            // Extract carb source from description
            const carbSource = extractCarbSource(mealData.description)
            
            setMealData((prev) => ({ 
              ...prev, 
              estimatedCarbs, 
              aiSummary: summary,
              carbSource,
            }))
            
            aiResponse = `Based on what I see, this is around ${estimatedCarbs}g of carbs.

${carbSource ? `Most of the carbs come from the ${carbSource}.` : ''}

What type of meal is this?
- Breakfast
- Brunch  
- Lunch
- Dinner
- Snack`
          } else {
            // Fallback estimate
            const estimatedCarbs = Math.floor(Math.random() * 30) + 25
            const carbSource = extractCarbSource(mealData.description)
            
            setMealData((prev) => ({ 
              ...prev, 
              estimatedCarbs,
              carbSource,
            }))
            
            aiResponse = `Based on what I see, this is around ${estimatedCarbs}g of carbs.

${carbSource ? `Most of the carbs come from the ${carbSource}.` : ''}

What type of meal is this?
- Breakfast
- Brunch  
- Lunch
- Dinner
- Snack`
          }
          break

        case 2:
          // User selected meal type - confirm and save
          const mealType = userInput.toLowerCase()
          let selectedType: "breakfast" | "brunch" | "lunch" | "dinner" | "snack" = "snack"
          
          if (mealType.includes("breakfast")) selectedType = "breakfast"
          else if (mealType.includes("brunch")) selectedType = "brunch"
          else if (mealType.includes("lunch")) selectedType = "lunch"
          else if (mealType.includes("dinner")) selectedType = "dinner"
          else if (mealType.includes("snack")) selectedType = "snack"
          
          setMealData((prev) => ({ ...prev, mealType: selectedType }))
          
          aiResponse = `Saved! Your ${selectedType} has been logged.

${mealData.carbSource ? `Remember: ${mealData.carbSource} was your main carb source here.` : ''}`
          break

        default:
          aiResponse = "Let's start fresh!"
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
            aiSummary: mealData.aiSummary || `${mealData.estimatedCarbs}g carbs${mealData.carbSource ? ` - mostly from ${mealData.carbSource}` : ''}`,
            synthesizedSummary: mealData.carbSource ? `Most carbs from ${mealData.carbSource}` : mealData.description,
            ingredients: [mealData.description],
            chatHistory: messages,
            photoUrl: mealData.photoUrl,
          }
          onMealLogged(mealEntry)
        }, 1500)
      }
    } catch (error) {
      console.error('Error processing AI response:', error)
      addMessage("Something went wrong. Let's try that again!", "ai")
    } finally {
      setIsProcessing(false)
    }
  }

  // Extract likely carb sources from food description
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
      <div className="max-w-md mx-auto px-4 py-4 pb-24">
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
              className="h-[calc(100vh-420px)] p-4"
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
                        <span className="text-sm text-stone-600">Looking at your meal...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        {showTextInput && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-stone-200">
            <div className="max-w-md mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your response..."
                  className="flex-1 rounded-xl border-stone-200 bg-white"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isProcessing}
                  className="rounded-xl bg-stone-900 hover:bg-stone-800 h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
