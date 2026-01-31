import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    console.log('[v0] Starting database setup...')
    
    // Create MealType enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
          CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'SNACK');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;
    `)
    console.log('[v0] MealType enum created')
    
    // Create users table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('[v0] Users table created')
    
    // Create email index
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `)
    console.log('[v0] Users email index created')
    
    // Create meals table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "meals" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "mealType" "MealType" NOT NULL,
          "description" TEXT NOT NULL,
          "estimatedCarbs" DOUBLE PRECISION NOT NULL,
          "estimatedSugar" DOUBLE PRECISION NOT NULL,
          "aiSummary" TEXT,
          "photoUrl" TEXT,
          "carbSource" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
      );
    `)
    console.log('[v0] Meals table created')
    
    // Verify tables exist
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    console.log('[v0] Tables in database:', tables)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup complete',
      tables 
    })
  } catch (error) {
    console.error('[v0] Database setup error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to setup database' })
}
