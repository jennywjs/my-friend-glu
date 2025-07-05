// Database Types
export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Meal {
  id: string
  userId: string
  mealType: MealType
  description: string
  estimatedCarbs: number
  estimatedSugar: number
  aiSummary?: string
  createdAt: Date
  updatedAt: Date
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK'
}

// API Request/Response Types
export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export interface MealLogRequest {
  description: string
  mealType: MealType
}

export interface MealLogResponse {
  message: string
  meal: {
    id: string
    description: string
    mealType: MealType
    estimatedCarbs: number
    estimatedSugar: number
    aiSummary?: string
    createdAt: Date
  }
  recommendations: string[]
}

export interface MealHistoryResponse {
  meals: Array<{
    id: string
    description: string
    mealType: MealType
    estimatedCarbs: number
    estimatedSugar: number
    aiSummary?: string
    createdAt: Date
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface AIAnalysisRequest {
  description: string
  action?: 'analyze' | 'clarify'
}

export interface AIAnalysisResponse {
  action: 'analyze' | 'clarify'
  analysis?: {
    estimatedCarbs: number
    estimatedSugar: number
    summary: string
    recommendations: string[]
  }
  questions?: string[]
  message: string
  recommendations?: string[]
}

export interface UserProfileResponse {
  user: {
    id: string
    email: string
    name: string
    createdAt: Date
    mealCount: number
  }
}

export interface UpdateProfileRequest {
  name: string
}

// Error Types
export interface APIError {
  error: string
  details?: string[]
  status?: number
}

// AI Service Types
export interface MealAnalysis {
  estimatedCarbs: number
  estimatedSugar: number
  summary: string
  recommendations: string[]
}

// Authentication Types
export interface JWTPayload {
  userId: string
  email: string
}

// Utility Types
export interface PaginationParams {
  page?: number
  limit?: number
  date?: string
}

export interface DatabaseWhereClause {
  userId: string
  createdAt?: {
    gte: Date
    lt: Date
  }
}
