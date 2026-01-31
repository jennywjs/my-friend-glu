import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Test connection and create tables using raw SQL
  // This uses the same DATABASE_URL as Prisma
  
  console.log('Creating MealType enum...')
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
        CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'DINNER', 'SNACK');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;
  `)
  
  console.log('Creating users table...')
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
  
  console.log('Creating users email index...')
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
  `)
  
  console.log('Creating meals table...')
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
  
  console.log('Database setup complete!')
  
  // Verify tables exist
  const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  console.log('Tables in database:', tables)
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
