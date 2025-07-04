"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Clock, Utensils, Coffee, Loader2 } from "lucide-react"
import ConversationalLogger from "@/components/conversational-logger"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { getMeals, logMeal } from "@/lib/api"

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

export default function HomePage() {
  const [showLogger, setShowLogger] = useState(false)
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentLogType, setCurrentLogType] = useState<"food">("food")
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null)

  // Fetch meals from backend on component mount
  useEffect(() => {
    fetchMeals()
  }, [])

  const fetchMeals = async () => {
    try {
      setLoading(true)
      const response = await getMeals()
      if (response.meals) {
        const formattedMeals: MealEntry[] = response.meals.map((meal: any) => ({
          id: meal.id,
          type: meal.mealType.toLowerCase() as "breakfast" | "brunch" | "lunch" | "dinner" | "snack",
          description: meal.description,
          carbs: meal.estimatedCarbs,
          timestamp: new Date(meal.createdAt),
          aiSummary: meal.aiSummary || meal.description,
          recommendation: "A gentle walk after eating could help balance your glucose levels.",
          synthesizedSummary: meal.aiSummary || meal.description,
          ingredients: [meal.description], // Simplified for now
          chatHistory: [],
        }))
        setMealEntries(formattedMeals)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
      // Fallback to empty array if API fails
      setMealEntries([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogMeal = (type: "food") => {
    setCurrentLogType(type)
    setShowLogger(true)
  }

  const handleEditEntry = (entry: MealEntry) => {
    setEditingEntry(entry)
    setShowLogger(true)
  }

  const handleMealLogged = async (entry: Omit<MealEntry, "id" | "timestamp">) => {
    try {
      console.log('Attempting to log meal:', entry)
      
      // Map frontend meal type to backend meal type
      const mealTypeMap: Record<string, string> = {
        breakfast: 'BREAKFAST',
        brunch: 'LUNCH', // Map brunch to lunch for backend
        lunch: 'LUNCH',
        dinner: 'DINNER',
        snack: 'SNACK'
      }

      const backendMealType = mealTypeMap[entry.type] || 'SNACK'
      console.log('Mapped meal type:', { frontend: entry.type, backend: backendMealType })

      // Log meal to backend
      console.log('Calling logMeal API...')
      const response = await logMeal({
        description: entry.description,
        mealType: backendMealType
      })
      
      console.log('API response:', response)

      if (response.meal) {
        console.log('Meal saved successfully to database')
        // Create new entry from backend response
        const newEntry: MealEntry = {
          id: response.meal.id,
          type: response.meal.mealType.toLowerCase() as "breakfast" | "brunch" | "lunch" | "dinner" | "snack",
          description: response.meal.description,
          carbs: response.meal.estimatedCarbs,
          timestamp: new Date(response.meal.createdAt),
          aiSummary: response.meal.aiSummary || response.meal.description,
          recommendation: response.recommendations?.[0] || "A gentle walk after eating could help balance your glucose levels.",
          synthesizedSummary: response.meal.aiSummary || response.meal.description,
          ingredients: [response.meal.description],
          chatHistory: [],
        }

        if (editingEntry) {
          // Update existing entry
          setMealEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? newEntry : e)))
          setEditingEntry(null)
        } else {
          // Add new entry to the beginning
          setMealEntries((prev) => [newEntry, ...prev])
        }
      } else {
        console.error('No meal data in API response:', response)
        throw new Error('No meal data received from API')
      }
    } catch (error) {
      console.error('Error logging meal:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      
      // Fallback to local state if API fails
      if (editingEntry) {
        const updatedEntry: MealEntry = {
          ...entry,
          id: editingEntry.id,
          timestamp: editingEntry.timestamp,
        }
        setMealEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? updatedEntry : e)))
        setEditingEntry(null)
      } else {
        const newEntry: MealEntry = {
          ...entry,
          id: Date.now().toString(),
          timestamp: new Date(),
        }
        setMealEntries((prev) => [newEntry, ...prev])
      }
    }
    setShowLogger(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMealIcon = (type: string) => {
    switch (type) {
      case "breakfast":
      case "lunch":
      case "dinner":
        return <Utensils className="h-4 w-4" />
      case "snack":
        return <Coffee className="h-4 w-4" />
      default:
        return <Utensils className="h-4 w-4" />
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

  if (showLogger) {
    return (
      <ConversationalLogger
        logType={currentLogType}
        editingEntry={editingEntry}
        onMealLogged={handleMealLogged}
        onCancel={() => {
          setShowLogger(false)
          setEditingEntry(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Friend Glu</h1>
              <p className="text-gray-600 mt-1">Your AI-powered gestational diabetes companion</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => handleLogMeal("food")}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Log Meal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Meals</p>
                  <p className="text-2xl font-bold text-gray-900">{mealEntries.length}</p>
                </div>
                <Utensils className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Carbs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mealEntries.reduce((sum, meal) => sum + meal.carbs, 0)}g
                  </p>
                </div>
                <Coffee className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Insights</p>
                  <p className="text-2xl font-bold text-gray-900">{mealEntries.filter(m => m.aiSummary).length}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meal Timeline */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Today's Meals</h2>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-500" />}
            </div>
            
            {mealEntries.length === 0 && !loading ? (
              <div className="text-center py-12">
                <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No meals logged yet</h3>
                <p className="text-gray-600 mb-4">Start by logging your first meal to track your nutrition</p>
                <Button
                  onClick={() => handleLogMeal("food")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  Log Your First Meal
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {mealEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start space-x-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                          {getMealIcon(entry.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getMealTypeColor(entry.type)}>
                              {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <h3 className="font-medium text-gray-900 mb-1">{entry.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">{entry.synthesizedSummary}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Coffee className="h-3 w-3 mr-1" />
                              {entry.carbs}g carbs
                            </span>
                          </div>
                          
                          {entry.recommendation && (
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              💡 {entry.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
