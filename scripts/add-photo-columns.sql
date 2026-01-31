-- Add photoUrl and carbSource columns to meals table
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "meals" ADD COLUMN IF NOT EXISTS "carbSource" TEXT;
