import { Pool } from '@neondatabase/serverless'

async function main() {
  const databaseUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL or PRISMA_DATABASE_URL not set')
  }
  
  console.log('Connecting to database...')
  const pool = new Pool({ connectionString: databaseUrl })
  
  console.log('Creating MealType enum...')
  await pool.query(`
    DO $$ BEGIN
        CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'SNACK');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `)
  
  console.log('Creating users table...')
  await pool.query(`
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
  
  console.log('Creating users email index...')
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
  `)
  
  console.log('Creating meals table...')
  await pool.query(`
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
  
  console.log('Database setup complete!')
  
  // Verify tables exist
  const result = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`)
  console.log('Tables in database:', result.rows)
  
  await pool.end()
}

main().catch(console.error)
