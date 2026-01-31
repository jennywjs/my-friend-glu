-- Create MealType enum
DO $$ BEGIN
    CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'SNACK');
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Create meals table (without foreign key for now since users may not exist)
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
