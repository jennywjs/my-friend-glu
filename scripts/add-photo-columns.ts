import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding photo_url and carb_source columns to meals table...')
  
  try {
    // Check if columns already exist by querying the table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
    `)
    console.log('Added photoUrl column')
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "carbSource" TEXT;
    `)
    console.log('Added carbSource column')
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
