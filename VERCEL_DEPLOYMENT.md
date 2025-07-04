# Vercel Deployment Guide

## Prisma Client Issue Resolution

The "cannot find module '.prisma/client/default'" error has been addressed with the following changes:

### 1. Package.json Updates
- Added `"postinstall": "prisma generate"` script
- This ensures Prisma client is generated after dependencies are installed

### 2. Vercel Configuration
- Created `vercel.json` with proper build commands
- Configured `buildCommand` to run `prisma generate && next build`
- Set `installCommand` to use `pnpm install`

### 3. Next.js Configuration
- Updated `next.config.mjs` to handle Prisma client as external package
- Added `serverComponentsExternalPackages: ['@prisma/client']`

### 4. Database Configuration
- Enhanced `lib/db.ts` with better logging and error handling
- **Updated to PostgreSQL** for production deployment

## PostgreSQL Database Setup

### 1. Create Vercel Postgres Database
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Choose your preferred region and plan
4. Wait for database creation to complete

### 2. Get Database Connection String
1. In your database settings, copy the connection string
2. It will look like: `postgresql://default:password@host:port/verceldb`

## Environment Variables Setup

### Required Environment Variables
Set these in your Vercel project settings (Project Settings → Environment Variables):

```
DATABASE_URL=postgresql://default:password@host:port/verceldb
JWT_SECRET=your-super-secret-jwt-key
OPENAI_API_KEY=your-openai-api-key
```

### Local Development (.env file)
Create a `.env` file in your project root:
```env
DATABASE_URL="postgresql://default:password@host:port/verceldb"
JWT_SECRET="your-super-secret-jwt-key"
OPENAI_API_KEY="your-openai-api-key"
```

## Database Migration Steps

### 1. Generate Prisma Client
```bash
pnpm db:generate
```

### 2. Create Initial Migration
```bash
pnpm db:migrate
```

### 3. For Production Deployment
```bash
# Apply migrations to production database
pnpm db:migrate:deploy
```

## Deploy Commands
```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Deploy to Vercel
vercel --prod
```

## Post-Deployment Verification

After deployment:
1. **Check database connection**: Verify tables are created in Vercel Postgres
2. **Test API endpoints**: Ensure `/api/meals` and other endpoints work
3. **Check logs**: Monitor Vercel Function Logs for any errors
4. **Verify environment variables**: Confirm all variables are set correctly

## Troubleshooting

### If you still get Prisma client errors:
1. **Clear Vercel cache**: Go to Project Settings → General → Clear Build Cache
2. **Redeploy**: Trigger a new deployment
3. **Check environment variables**: Ensure `DATABASE_URL` is set correctly
4. **Verify database connection**: Test your database connection string

### Common Issues:
- **SQLite in production**: ✅ Fixed - Now using PostgreSQL
- **Missing environment variables**: Ensure all required env vars are set in Vercel
- **Build timeout**: Increase function timeout in `vercel.json` if needed
- **Database connection failed**: Check if Vercel Postgres is properly configured

## Database Migration Strategy

✅ **PostgreSQL Setup Complete**:
1. ✅ Updated `prisma/schema.prisma` to use PostgreSQL
2. ✅ Added migration scripts to `package.json`
3. ✅ Created comprehensive setup guide (`POSTGRESQL_SETUP.md`)

## Monitoring
- Check Vercel Function Logs for any Prisma errors
- Monitor database connection performance in Vercel Postgres dashboard
- Set up alerts for database connection failures
- Use Vercel Postgres dashboard to monitor query performance

## Next Steps
1. Set up your Vercel Postgres database
2. Update environment variables with the connection string
3. Run migrations: `pnpm db:migrate:deploy`
4. Deploy your application
5. Test all functionality in production 