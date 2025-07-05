# Vercel v0 Setup Guide

## Overview

Vercel v0 doesn't support external Prisma databases, but we can use **Vercel Postgres** which is fully supported and integrates seamlessly with Prisma.

## Solution: Vercel Postgres + Prisma

### Why This Works:
- ✅ **Vercel Postgres** is fully supported in v0
- ✅ **Prisma works** with Vercel Postgres
- ✅ **No code changes** needed
- ✅ **Automatic connection pooling**
- ✅ **Built-in security**

## Setup Steps

### 1. Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your preferred region
6. Select a plan (Hobby is fine for MVP)

### 2. Get Connection String

1. In your database settings, copy the connection string
2. It will look like: `postgresql://default:password@host:port/verceldb`

### 3. Update Environment Variables

Set these in your Vercel project settings:

```env
DATABASE_URL="postgresql://default:password@host:port/verceldb"
JWT_SECRET="your-secure-jwt-secret"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Deploy with v0

1. Push your code to GitHub
2. Connect to Vercel v0
3. Vercel will automatically:
   - Detect the Prisma schema
   - Run `prisma generate` during build
   - Connect to Vercel Postgres
   - Deploy your app

## Alternative: Direct Vercel Postgres (No Prisma)

If you prefer to remove Prisma entirely:

### 1. Install Vercel Postgres
```bash
pnpm add @vercel/postgres
```

### 2. Replace Prisma with Direct Queries

```typescript
// lib/db.ts
import { sql } from '@vercel/postgres';

export async function createMeal(description: string, mealType: string, carbs: number) {
  const result = await sql`
    INSERT INTO meals (description, meal_type, estimated_carbs, created_at)
    VALUES (${description}, ${mealType}, ${carbs}, NOW())
    RETURNING *
  `;
  return result.rows[0];
}

export async function getMeals() {
  const result = await sql`
    SELECT * FROM meals 
    ORDER BY created_at DESC
  `;
  return result.rows;
}
```

### 3. Create Database Schema

```sql
-- Create tables manually in Vercel Postgres
CREATE TABLE meals (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  meal_type VARCHAR(20) NOT NULL,
  estimated_carbs FLOAT NOT NULL,
  estimated_sugar FLOAT DEFAULT 0,
  ai_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Migration Strategy

### Option A: Keep Prisma (Recommended)
1. ✅ **Easier migration** - no code changes
2. ✅ **Type safety** - Prisma provides excellent TypeScript support
3. ✅ **Future flexibility** - can easily switch databases later
4. ✅ **Better DX** - Prisma Studio, migrations, etc.

### Option B: Remove Prisma
1. ⚠️ **More work** - need to rewrite database layer
2. ✅ **Simpler deployment** - fewer dependencies
3. ⚠️ **Less type safety** - manual SQL queries
4. ⚠️ **More maintenance** - manual schema management

## Recommended Approach

**Use Vercel Postgres with Prisma** because:

1. **No code changes needed** - just switch database URL
2. **Better developer experience** - Prisma provides great tooling
3. **Type safety** - Prisma generates TypeScript types
4. **Future-proof** - can easily migrate to other databases later
5. **Vercel v0 compatible** - Vercel Postgres is fully supported

## Deployment Checklist

- [ ] Create Vercel Postgres database
- [ ] Set `DATABASE_URL` environment variable
- [ ] Set `JWT_SECRET` environment variable  
- [ ] Set `OPENAI_API_KEY` environment variable
- [ ] Deploy to Vercel v0
- [ ] Run database migrations (if using Prisma)
- [ ] Test meal logging functionality
- [ ] Test voice recognition features

## Troubleshooting

### Common Issues:

1. **"Prisma not supported"** - Use Vercel Postgres instead of external databases
2. **"Database connection failed"** - Check `DATABASE_URL` environment variable
3. **"Migration failed"** - Run `prisma db push` locally first
4. **"Build failed"** - Ensure `prisma generate` runs during build

### Commands for Local Testing:

```bash
# Test database connection
pnpm db:studio

# Push schema to database
pnpm db:push

# Generate Prisma client
pnpm db:generate
```

## Next Steps

1. **Choose your approach** (Prisma + Vercel Postgres recommended)
2. **Set up Vercel Postgres** database
3. **Update environment variables**
4. **Deploy to Vercel v0**
5. **Test all functionality**

The app will work perfectly with Vercel v0 using Vercel Postgres! 🚀 