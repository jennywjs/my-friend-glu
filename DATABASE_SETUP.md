# Database Setup for Vercel v0

## Overview

This project now uses **Vercel Postgres** directly without Prisma for better compatibility with Vercel v0.

## Setup Steps

### 1. Create Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose your preferred region
6. Select a plan (Hobby is fine for MVP)

### 2. Environment Variables

Set these in your Vercel project settings:

```env
POSTGRES_URL="postgresql://default:password@host:port/verceldb"
POSTGRES_HOST="your-host"
POSTGRES_DATABASE="verceldb"
POSTGRES_USERNAME="default"
POSTGRES_PASSWORD="your-password"
JWT_SECRET="your-secure-jwt-secret"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. Database Schema

The database schema is automatically created when the app first runs. The `meals` table will be created with this structure:

```sql
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

### 4. Deploy to Vercel v0

1. Push your code to GitHub
2. Connect to Vercel v0
3. The database will be automatically initialized on first API call

## Local Development

### Prerequisites

1. **Vercel CLI** (optional, for local testing)
2. **Environment variables** set locally

### Local Testing

```bash
# Start development server
pnpm dev

# The database will be automatically initialized when you make API calls
```

## Database Functions

The app uses these database functions from `lib/db.ts`:

- `createMeal()` - Create a new meal
- `getMeals()` - Get meals with pagination
- `getMealById()` - Get a single meal
- `updateMeal()` - Update a meal
- `deleteMeal()` - Delete a meal
- `initializeDatabase()` - Create tables (auto-run)

## Migration from Prisma

### What Changed:

1. ✅ **Removed Prisma** - No more `@prisma/client` dependency
2. ✅ **Added Vercel Postgres** - Direct SQL queries
3. ✅ **Automatic schema creation** - Tables created on first run
4. ✅ **Simplified deployment** - No migration files needed

### Benefits:

- ✅ **Vercel v0 compatible** - No external database dependencies
- ✅ **Faster deployment** - No Prisma generation step
- ✅ **Simpler setup** - Just environment variables
- ✅ **Automatic scaling** - Vercel Postgres handles it

## Troubleshooting

### Common Issues:

1. **"Database connection failed"**
   - Check environment variables in Vercel dashboard
   - Ensure Vercel Postgres is created and running

2. **"Table doesn't exist"**
   - The table is created automatically on first API call
   - Check the logs for initialization errors

3. **"Build failed"**
   - No more Prisma-related build issues
   - Check for other dependency issues

### Commands:

```bash
# Check database connection (in development)
curl http://localhost:3000/api/meals

# View logs in Vercel dashboard
# Check Function Logs for any database errors
```

## Next Steps

1. ✅ **Create Vercel Postgres database**
2. ✅ **Set environment variables**
3. ✅ **Deploy to Vercel v0**
4. ✅ **Test meal logging functionality**

The app is now fully compatible with Vercel v0! 🚀 