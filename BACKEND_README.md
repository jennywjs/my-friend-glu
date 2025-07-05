# My Friend Glu - Backend API

This is the backend API for the My Friend Glu application, designed to help expecting mothers manage gestational diabetes through AI-powered meal tracking.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **AI-Powered Meal Analysis**: OpenAI integration for intelligent carbohydrate estimation
- **Conversational Interface**: Natural language processing for meal descriptions
- **Meal History**: Comprehensive meal logging and retrieval system
- **User Profiles**: User management and profile updates

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI GPT-4 for meal analysis
- **API**: RESTful endpoints with TypeScript

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
# or
pnpm install
\`\`\`

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY="your-openai-api-key-here"

# App Configuration
NODE_ENV="development"
\`\`\`

### 3. Database Setup

\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio to view/edit data
npm run db:studio
\`\`\`

### 4. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:3000/api/`

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Mato"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Mato"
  }
}
\`\`\`

#### POST `/api/auth/login`
Login with existing credentials.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Mato"
  }
}
\`\`\`

### Meals

#### POST `/api/meals`
Log a new meal with AI analysis.

**Headers:**
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

**Request Body:**
\`\`\`json
{
  "description": "Half plate Kung Pao chicken, 1 bok choy, 1 small bowl of rice, spicy and sour soup",
  "mealType": "LUNCH"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Meal logged successfully",
  "meal": {
    "id": "meal-id",
    "description": "Half plate Kung Pao chicken...",
    "mealType": "LUNCH",
    "estimatedCarbs": 55,
    "estimatedSugar": 8,
    "aiSummary": "Meal logged: Half plate Kung Pao chicken...",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "recommendations": [
    "A gentle walk could help balance your glucose",
    "Monitor your blood glucose levels in the next 2 hours"
  ]
}
\`\`\`

#### GET `/api/meals`
Retrieve meal history with pagination and filtering.

**Headers:**
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `date` (optional): Filter by date (YYYY-MM-DD format)

**Response:**
\`\`\`json
{
  "meals": [
    {
      "id": "meal-id",
      "description": "Meal description",
      "mealType": "LUNCH",
      "estimatedCarbs": 55,
      "estimatedSugar": 8,
      "aiSummary": "AI summary",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
\`\`\`

### AI Analysis

#### POST `/api/ai/analyze`
Analyze meal descriptions or generate clarifying questions.

**Headers:**
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

**Request Body:**
\`\`\`json
{
  "description": "Half plate Kung Pao chicken, 1 bok choy, 1 small bowl of rice",
  "action": "analyze" // or "clarify"
}
\`\`\`

**Response (analyze):**
\`\`\`json
{
  "action": "analyze",
  "analysis": {
    "estimatedCarbs": 55,
    "estimatedSugar": 8,
    "summary": "Meal logged: Half plate Kung Pao chicken...",
    "recommendations": ["A gentle walk could help..."]
  },
  "message": "Meal logged: Half plate Kung Pao chicken...",
  "recommendations": ["A gentle walk could help..."]
}
\`\`\`

**Response (clarify):**
\`\`\`json
{
  "action": "clarify",
  "questions": [
    "What size was the bowl of rice?",
    "Was the chicken breaded or plain?"
  ],
  "message": "Here are some questions to help me better understand your meal:"
}
\`\`\`

### User Profile

#### GET `/api/user/profile`
Get user profile information.

**Headers:**
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

**Response:**
\`\`\`json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "Mato",
    "createdAt": "2024-01-01T00:00:00Z",
    "mealCount": 45
  }
}
\`\`\`

#### PUT `/api/user/profile`
Update user profile.

**Headers:**
\`\`\`
Authorization: Bearer <jwt-token>
\`\`\`

**Request Body:**
\`\`\`json
{
  "name": "New Name"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "New Name",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
\`\`\`

## Database Schema

### Users Table
- `id`: Unique user identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: User's display name
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Meals Table
- `id`: Unique meal identifier
- `userId`: Foreign key to users table
- `mealType`: Enum (BREAKFAST, LUNCH, DINNER, SNACK)
- `description`: User's meal description
- `estimatedCarbs`: AI-estimated carbohydrates in grams
- `estimatedSugar`: AI-estimated sugar in grams
- `aiSummary`: AI-generated meal summary
- `createdAt`: Meal logging timestamp
- `updatedAt`: Last update timestamp

## AI Integration

The backend uses OpenAI's GPT-4 model for:

1. **Meal Analysis**: Estimating carbohydrates and sugar content from natural language descriptions
2. **Clarifying Questions**: Generating follow-up questions to improve accuracy
3. **Recommendations**: Providing actionable advice for glucose management

The AI is specifically trained to handle:
- Cultural and diverse food items
- Complex mixed dishes
- Conservative nutritional estimates
- Gestational diabetes-specific recommendations

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses without sensitive data exposure

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run db:generate`: Generate Prisma client
- `npm run db:push`: Push schema changes to database
- `npm run db:studio`: Open Prisma Studio

### Environment Variables

- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `NODE_ENV`: Environment (development/production)

## Production Deployment

1. Set up a production database (PostgreSQL recommended)
2. Configure environment variables for production
3. Generate a secure JWT secret
4. Set up OpenAI API key
5. Build and deploy the application

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write tests for new features
5. Update documentation

## Support

For questions or issues, please refer to the main project documentation or create an issue in the repository.
