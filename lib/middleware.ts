import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './auth'

export async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader || undefined)
  
  if (!token) {
    return { error: 'No token provided', status: 401 }
  }
  
  const payload = verifyToken(token)
  if (!payload) {
    return { error: 'Invalid token', status: 401 }
  }
  
  return { user: payload }
}

export function validateMealData(data: any) {
  const errors: string[] = []
  
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required and must be a string')
  }
  
  if (!data.mealType || !['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(data.mealType)) {
    errors.push('Valid meal type is required')
  }
  
  return errors.length === 0 ? null : errors
}

export function validateUserData(data: any) {
  const errors: string[] = []
  
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email is required')
  }
  
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Password must be at least 6 characters')
  }
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required')
  }
  
  return errors.length === 0 ? null : errors
} 