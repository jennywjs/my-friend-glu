import { sql } from '@vercel/postgres';

export interface Meal {
  id: string;
  description: string;
  mealType: string;
  estimatedCarbs: number;
  estimatedSugar: number;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMealData {
  description: string;
  mealType: string;
  estimatedCarbs: number;
  estimatedSugar: number;
  aiSummary?: string;
}

// In-memory database for local development
let inMemoryMeals: Meal[] = [];
let nextId = 1;

// Check if we're in development and don't have Vercel Postgres env vars
const isLocalDevelopment = process.env.NODE_ENV === 'development' && 
  (!process.env.POSTGRES_URL && !process.env.POSTGRES_HOST);

// Create a new meal
export async function createMeal(data: CreateMealData): Promise<Meal> {
  try {
    if (isLocalDevelopment) {
      // Use in-memory database for local development
      const meal: Meal = {
        id: nextId.toString(),
        description: data.description,
        mealType: data.mealType,
        estimatedCarbs: data.estimatedCarbs,
        estimatedSugar: data.estimatedSugar,
        aiSummary: data.aiSummary,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryMeals.unshift(meal);
      nextId++;
      return meal;
    }

    const result = await sql`
      INSERT INTO meals (description, meal_type, estimated_carbs, estimated_sugar, ai_summary, created_at, updated_at)
      VALUES (${data.description}, ${data.mealType}, ${data.estimatedCarbs}, ${data.estimatedSugar}, ${data.aiSummary || null}, NOW(), NOW())
      RETURNING *
    `;
    
    const meal = result.rows[0];
    return {
      id: meal.id,
      description: meal.description,
      mealType: meal.meal_type,
      estimatedCarbs: parseFloat(meal.estimated_carbs),
      estimatedSugar: parseFloat(meal.estimated_sugar),
      aiSummary: meal.ai_summary,
      createdAt: new Date(meal.created_at),
      updatedAt: new Date(meal.updated_at)
    };
  } catch (error) {
    console.error('Error creating meal:', error);
    throw new Error('Failed to create meal');
  }
}

// Get all meals with pagination
export async function getMeals(page: number = 1, limit: number = 20, date?: string): Promise<{ meals: Meal[], pagination: any }> {
  try {
    if (isLocalDevelopment) {
      // Use in-memory database for local development
      let filteredMeals = inMemoryMeals;
      
      if (date) {
        const targetDate = new Date(date);
        filteredMeals = inMemoryMeals.filter(meal => {
          const mealDate = new Date(meal.createdAt);
          return mealDate.toDateString() === targetDate.toDateString();
        });
      }
      
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedMeals = filteredMeals.slice(startIndex, endIndex);
      
      return {
        meals: paginatedMeals,
        pagination: {
          page,
          limit,
          total: filteredMeals.length,
          pages: Math.ceil(filteredMeals.length / limit)
        }
      };
    }

    let result;
    let countResult;
    
    if (date) {
      result = await sql`
        SELECT * FROM meals 
        WHERE DATE(created_at) = ${date}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      
      countResult = await sql`
        SELECT COUNT(*) as total FROM meals 
        WHERE DATE(created_at) = ${date}
      `;
    } else {
      result = await sql`
        SELECT * FROM meals 
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `;
      
      countResult = await sql`
        SELECT COUNT(*) as total FROM meals
      `;
    }
    
    const total = parseInt(countResult.rows[0].total);
    
    const meals = result.rows.map(meal => ({
      id: meal.id,
      description: meal.description,
      mealType: meal.meal_type,
      estimatedCarbs: parseFloat(meal.estimated_carbs),
      estimatedSugar: parseFloat(meal.estimated_sugar),
      aiSummary: meal.ai_summary,
      createdAt: new Date(meal.created_at),
      updatedAt: new Date(meal.updated_at)
    }));
    
    return {
      meals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching meals:', error);
    throw new Error('Failed to fetch meals');
  }
}

// Get a single meal by ID
export async function getMealById(id: string): Promise<Meal | null> {
  try {
    if (isLocalDevelopment) {
      // Use in-memory database for local development
      return inMemoryMeals.find(meal => meal.id === id) || null;
    }

    const result = await sql`
      SELECT * FROM meals WHERE id = ${id}
    `;
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const meal = result.rows[0];
    return {
      id: meal.id,
      description: meal.description,
      mealType: meal.meal_type,
      estimatedCarbs: parseFloat(meal.estimated_carbs),
      estimatedSugar: parseFloat(meal.estimated_sugar),
      aiSummary: meal.ai_summary,
      createdAt: new Date(meal.created_at),
      updatedAt: new Date(meal.updated_at)
    };
  } catch (error) {
    console.error('Error fetching meal:', error);
    throw new Error('Failed to fetch meal');
  }
}

// Update a meal
export async function updateMeal(id: string, data: Partial<CreateMealData>): Promise<Meal> {
  try {
    if (isLocalDevelopment) {
      // Use in-memory database for local development
      const index = inMemoryMeals.findIndex(meal => meal.id === id);
      if (index === -1) {
        throw new Error('Meal not found');
      }
      
      const updatedMeal = {
        ...inMemoryMeals[index],
        ...data,
        updatedAt: new Date()
      };
      inMemoryMeals[index] = updatedMeal;
      return updatedMeal;
    }

    // For now, let's use a simpler approach - update all fields
    const result = await sql`
      UPDATE meals 
      SET description = ${data.description || ''}, 
          meal_type = ${data.mealType || ''}, 
          estimated_carbs = ${data.estimatedCarbs || 0}, 
          estimated_sugar = ${data.estimatedSugar || 0}, 
          ai_summary = ${data.aiSummary || null}, 
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    const meal = result.rows[0];
    return {
      id: meal.id,
      description: meal.description,
      mealType: meal.meal_type,
      estimatedCarbs: parseFloat(meal.estimated_carbs),
      estimatedSugar: parseFloat(meal.estimated_sugar),
      aiSummary: meal.ai_summary,
      createdAt: new Date(meal.created_at),
      updatedAt: new Date(meal.updated_at)
    };
  } catch (error) {
    console.error('Error updating meal:', error);
    throw new Error('Failed to update meal');
  }
}

// Delete a meal
export async function deleteMeal(id: string): Promise<void> {
  try {
    if (isLocalDevelopment) {
      // Use in-memory database for local development
      const index = inMemoryMeals.findIndex(meal => meal.id === id);
      if (index !== -1) {
        inMemoryMeals.splice(index, 1);
      }
      return;
    }

    await sql`
      DELETE FROM meals WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw new Error('Failed to delete meal');
  }
}

// Initialize database schema (run this once)
export async function initializeDatabase(): Promise<void> {
  try {
    if (isLocalDevelopment) {
      console.log('Using in-memory database for local development');
      return;
    }

    await sql`
      CREATE TABLE IF NOT EXISTS meals (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        meal_type VARCHAR(20) NOT NULL,
        estimated_carbs FLOAT NOT NULL,
        estimated_sugar FLOAT DEFAULT 0,
        ai_summary TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}
