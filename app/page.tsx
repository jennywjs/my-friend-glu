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
      // Map frontend meal type to backend meal type
      const mealTypeMap: Record<string, string> = {
        breakfast: 'BREAKFAST',
        brunch: 'LUNCH', // Map brunch to lunch for backend
        lunch: 'LUNCH',
        dinner: 'DINNER',
        snack: 'SNACK'
      }

      const backendMealType = mealTypeMap[entry.type] || 'SNACK'

      // Log meal to backend
      const response = await logMeal({
        description: entry.description,
        mealType: backendMealType
      })

      if (response.meal) {
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
      }
    } catch (error) {
      console.error('Error logging meal:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">My Friend Glu</h1>
              <p className="text-sm text-gray-600">Hi Mato! Ready to log your meals?</p>
            </div>
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium flex items-center gap-1">
                    Today
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Today</DropdownMenuItem>
                  <DropdownMenuItem>Last 3 days</DropdownMenuItem>
                  <DropdownMenuItem>Last week</DropdownMenuItem>
                  <DropdownMenuItem>Last month</DropdownMenuItem>
                  <DropdownMenuItem>Last 3 months</DropdownMenuItem>
                  <DropdownMenuItem>This year</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 pb-20">
        {/* Daily Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {mealEntries.reduce((sum, entry) => sum + entry.carbs, 0)}g
              </p>
              <p className="text-xs text-gray-600">Total Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{mealEntries.length}</p>
              <p className="text-xs text-gray-600">Food Entries</p>
            </div>
          </div>
          <div className="text-center">
            {(() => {
              const totalCarbs = mealEntries.reduce((sum, entry) => sum + entry.carbs, 0)
              const entryCount = mealEntries.length
              if (totalCarbs < 150 && entryCount >= 4) {
                return (
                  <p className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                    🎉 You're doing great! Keep it up!
                  </p>
                )
              } else if (totalCarbs > 200) {
                return (
                  <p className="text-sm text-orange-700 bg-orange-50 px-3 py-1 rounded-full">
                    ⚠️ Consider reducing carb intake a little
                  </p>
                )
              } else if (entryCount < 3) {
                return (
                  <p className="text-sm text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                    📝 Try to log more meals for better tracking
                  </p>
                )
              } else {
                return (
                  <p className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-full">
                    👍 You're on the right track!
                  </p>
                )
              }
            })()}
          </div>
        </div>

        {/* Timeline Header */}
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Timeline</h2>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-3">
            {loading ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 text-gray-400 mb-3 animate-spin" />
                  <p className="text-gray-600 text-center">Loading your meals...</p>
                </CardContent>
              </Card>
            ) : mealEntries.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 text-center">
                    No meals logged yet today.
                    <br />
                    Tap "Log Meal" or "Log Snack" to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              mealEntries.map((entry) => (
                <Card key={entry.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleEditEntry(entry)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getMealIcon(entry.type)}
                        <Badge className={getMealTypeColor(entry.type)}>
                          {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatTime(entry.timestamp)}</p>
                        <p className="text-sm font-semibold text-gray-900">{entry.carbs}g carbs</p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-base text-gray-900 font-semibold mb-2">
                        {entry.description}
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <p className="text-xs font-medium text-gray-700 mb-1">AI Summary:</p>
                        <p className="text-xs text-gray-600 leading-relaxed">{entry.aiSummary}</p>
                      </div>
                    </div>

                    {entry.recommendation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs text-blue-800">
                          <span className="font-medium">💡 Tip:</span> {entry.recommendation}
                        </p>
                      </div>
                    )}

                    <div className="mt-2 text-right">
                      <p className="text-xs text-gray-400">Tap to edit</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      {/* Fixed Bottom Log Food Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <Button
            onClick={() => handleLogMeal("food")}
            className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg flex items-center justify-center gap-3"
          >
            <Utensils className="h-5 w-5" />
            <span className="text-lg font-semibold">Log Food</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
