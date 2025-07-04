# PostgreSQL Setup Guide

## Database Provider Options

### 1. Vercel Postgres (Recommended for Vercel deployment)
- **Pros**: Native integration with Vercel, automatic connection pooling
- **Cons**: Limited to Vercel ecosystem
- **Setup**: 
  1. Go to Vercel Dashboard → Your Project → Storage
  2. Create a new Postgres database
  3. Copy the connection string to your environment variables

### 2. Supabase (Popular alternative)
- **Pros**: Free tier, great UI, real-time features
- **Cons**: Requires external service
- **Setup**:
  1. Go to [supabase.com](https://supabase.com)
  2. Create new project
  3. Go to Settings → Database → Connection string
  4. Copy the connection string

### 3. PlanetScale (MySQL alternative)
- **Pros**: Serverless, branching, great developer experience
- **Cons**: MySQL (not PostgreSQL)
- **Setup**:
  1. Go to [planetscale.com](https://planetscale.com)
  2. Create new database
  3. Get connection string from Connect tab

### 4. Railway (Simple setup)
- **Pros**: Easy setup, good free tier
- **Cons**: Requires external service
- **Setup**:
  1. Go to [railway.app](https://railway.app)
  2. Create new project → Provision PostgreSQL
  3. Copy connection string from Variables tab

## Environment Variables Setup

### Local Development (.env file)
```env
# PostgreSQL Database URL
DATABASE_URL="postgresql://username:password@host:port/database_name"

# Other required variables
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="your-openai-api-key"
```

### Vercel Production
Set these in Vercel Dashboard → Project Settings → Environment Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database_name
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

## Database Migration Steps

### 1. Set up your database and get the connection string

### 2. Update your .env file with the PostgreSQL URL
```env
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

### 3. Generate Prisma client
```bash
pnpm db:generate
```

### 4. Create and apply migrations
```bash
# Create initial migration
pnpm db:migrate

# Or if you want to push schema directly (for development)
pnpm db:push
```

### 5. For production deployment
```bash
# Apply migrations to production database
pnpm db:migrate:deploy
```

## Connection String Format

### Standard PostgreSQL
```
postgresql://username:password@host:port/database_name
```

### Examples:
- **Local**: `postgresql://postgres:password@localhost:5432/myfriendglu`
- **Supabase**: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`
- **Vercel Postgres**: `postgresql://default:[YOUR-PASSWORD]@[YOUR-HOST]:5432/verceldb`
- **Railway**: `postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/railway`

## Troubleshooting

### Common Issues:

1. **Connection refused**: Check if database is running and accessible
2. **Authentication failed**: Verify username/password in connection string
3. **Database does not exist**: Create the database first
4. **SSL required**: Add `?sslmode=require` to connection string for cloud databases

### SSL Configuration
For cloud databases, you might need to add SSL parameters:
```
postgresql://username:password@host:port/database_name?sslmode=require
```

## Quick Start with Vercel Postgres

1. **Create Vercel Postgres Database**:
   - Go to Vercel Dashboard → Your Project → Storage
   - Click "Create Database" → Select "Postgres"
   - Choose region and plan

2. **Get Connection String**:
   - Copy the connection string from the database settings
   - It will look like: `postgresql://default:password@host:port/verceldb`

3. **Set Environment Variables**:
   - Add `DATABASE_URL` to your Vercel project environment variables
   - Add the same to your local `.env` file for development

4. **Deploy**:
   - Push your code to trigger deployment
   - The database will be automatically connected

## Migration from SQLite

If you have existing data in SQLite:

1. **Export data** (if needed):
   ```bash
   # Create a backup of your SQLite data
   cp prisma/dev.db prisma/backup.db
   ```

2. **Set up PostgreSQL** following the steps above

3. **Apply schema**:
   ```bash
   pnpm db:push
   ```

4. **Import data** (if needed):
   - You'll need to write a migration script to transfer data
   - Or manually recreate the data in the new database

## Verification

After setup, verify everything works:

```bash
# Check database connection
pnpm db:studio

# Test API endpoints
curl http://localhost:3000/api/meals
```

## Production Checklist

- [ ] PostgreSQL database created
- [ ] Connection string added to environment variables
- [ ] Prisma schema updated to use PostgreSQL
- [ ] Migrations created and applied
- [ ] Environment variables set in Vercel
- [ ] Application deployed and tested
- [ ] Database connection verified in production 