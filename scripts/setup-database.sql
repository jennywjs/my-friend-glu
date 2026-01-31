-- Create MealType enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create meals table with all columns including photoUrl and carbSource
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$ BEGIN
    ALTER TABLE "meals" ADD CONSTRAINT "meals_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add photoUrl and carbSource columns if table already exists but columns don't
DO $$ BEGIN
    ALTER TABLE "meals" ADD COLUMN "photoUrl" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "meals" ADD COLUMN "carbSource" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
