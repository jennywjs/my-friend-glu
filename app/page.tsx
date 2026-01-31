"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Clock, Loader2 } from "lucide-react"
import ConversationalLogger from "@/components/conversational-logger"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
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
  photoUrl?: string
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

  // Setup database and fetch meals on component mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure database tables exist
        await fetch('/api/setup-db', { method: 'POST' })
      } catch (e) {
        console.log('[v0] DB setup call completed')
      }
      fetchMeals()
    }
    initializeApp()
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
          synthesizedSummary: meal.aiSummary || meal.description,
          ingredients: [meal.description],
          chatHistory: [],
          photoUrl: meal.photoUrl,
        }))
        setMealEntries(formattedMeals)
      }
    } catch (error) {
      console.error('Error fetching meals:', error)
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
      const mealTypeMap: Record<string, string> = {
        breakfast: 'BREAKFAST',
        brunch: 'LUNCH',
        lunch: 'LUNCH',
        dinner: 'DINNER',
        snack: 'SNACK'
      }

      const backendMealType = mealTypeMap[entry.type] || 'SNACK'

      const response = await logMeal({
        description: entry.description,
        mealType: backendMealType
      })

      if (response.meal) {
        const newEntry: MealEntry = {
          id: response.meal.id,
          type: response.meal.mealType.toLowerCase() as "breakfast" | "brunch" | "lunch" | "dinner" | "snack",
          description: response.meal.description,
          carbs: response.meal.estimatedCarbs,
          timestamp: new Date(response.meal.createdAt),
          aiSummary: response.meal.aiSummary || response.meal.description,
          synthesizedSummary: response.meal.aiSummary || response.meal.description,
          ingredients: [response.meal.description],
          chatHistory: [],
          photoUrl: entry.photoUrl,
        }

        if (editingEntry) {
          setMealEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? newEntry : e)))
          setEditingEntry(null)
        } else {
          setMealEntries((prev) => [newEntry, ...prev])
        }
      }
    } catch (error) {
      console.error('Error logging meal:', error)
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

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case "breakfast":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "brunch":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "lunch":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "dinner":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "snack":
        return "bg-violet-50 text-violet-700 border-violet-200"
      default:
        return "bg-stone-50 text-stone-700 border-stone-200"
    }
  }

  // Calculate today's carbs
  const todaysCarbs = mealEntries
    .filter(meal => {
      const today = new Date()
      return meal.timestamp.toDateString() === today.toDateString()
    })
    .reduce((sum, meal) => sum + meal.carbs, 0)

  const todaysMeals = mealEntries.filter(meal => {
    const today = new Date()
    return meal.timestamp.toDateString() === today.toDateString()
  })

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
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">My Friend Glu</h1>
              <p className="text-stone-500 text-sm mt-0.5">Build your carb intuition</p>
            </div>
            <Button
              onClick={() => handleLogMeal("food")}
              className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl px-4"
            >
              <Camera className="h-4 w-4 mr-2" />
              Log Meal
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Today's Summary - Simplified to carbs only */}
        <Card className="mb-6 border-stone-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 mb-1">Today's carbs</p>
                <p className="text-3xl font-semibold text-stone-900">{todaysCarbs}g</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-500 mb-1">Meals logged</p>
                <p className="text-3xl font-semibold text-stone-900">{todaysMeals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Timeline */}
        <div className="mb-4">
          <h2 className="text-lg font-medium text-stone-900">Recent Meals</h2>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        ) : mealEntries.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-8 w-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">No meals logged yet</h3>
              <p className="text-stone-500 mb-6">
                Snap a photo of your food to start building your carb intuition
              </p>
              <Button
                onClick={() => handleLogMeal("food")}
                className="bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
              >
                Log Your First Meal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-340px)]">
            <div className="space-y-4">
              {mealEntries.map((entry, index) => {
                // Show date header if it's the first item or different date from previous
                const showDateHeader = index === 0 || 
                  formatDate(entry.timestamp) !== formatDate(mealEntries[index - 1].timestamp)
                
                return (
                  <div key={entry.id}>
                    {showDateHeader && (
                      <p className="text-sm font-medium text-stone-500 mb-3 mt-2">
                        {formatDate(entry.timestamp)}
                      </p>
                    )}
                    
                    {/* Photo-Primary Meal Card */}
                    <Card className="overflow-hidden border-stone-200 shadow-sm hover:shadow-md transition-shadow">
                      {/* Photo Section - Primary Element */}
                      {entry.photoUrl ? (
                        <div className="relative aspect-[16/9] bg-stone-100">
                          <img
                            src={entry.photoUrl}
                            alt={entry.description}
                            className="w-full h-full object-cover"
                          />
                          {/* Overlay with carb count */}
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
                              <span className="text-lg font-semibold text-stone-900">{entry.carbs}g</span>
                              <span className="text-stone-500 text-sm ml-1">carbs</span>
                            </div>
                          </div>
                          {/* Menu */}
                          <div className="absolute top-3 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-stone-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ) : (
                        // Fallback for meals without photos
                        <div className="relative bg-gradient-to-br from-stone-100 to-stone-200 aspect-[16/9] flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-4xl font-semibold text-stone-700">{entry.carbs}g</p>
                            <p className="text-stone-500 text-sm">carbs</p>
                          </div>
                          {/* Menu */}
                          <div className="absolute top-3 right-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 bg-white/80 rounded-full hover:bg-white"
                                >
                                  <MoreHorizontal className="h-4 w-4 text-stone-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                                  Edit
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )}
                      
                      {/* Info Section */}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`${getMealTypeColor(entry.type)} border text-xs font-medium`}
                              >
                                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                              </Badge>
                              <span className="text-xs text-stone-400 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(entry.timestamp)}
                              </span>
                            </div>
                            
                            {/* Carb source summary - key insight from PRD */}
                            <p className="text-sm text-stone-600 line-clamp-2">
                              {entry.synthesizedSummary || entry.description}
                            </p>
                          </div>
                          
                          {/* Carb count for non-photo cards */}
                          {!entry.photoUrl && (
                            <div className="text-right flex-shrink-0">
                              <p className="text-lg font-semibold text-stone-900">{entry.carbs}g</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}
