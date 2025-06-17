import fs from 'fs';
import path from 'path';
import { MealPlanRequest, GeneratedMealPlan, GeneratedMeal } from './openai';

/**
 * Mock meal plan data structure from JSON file
 */
interface MockMealData {
  mealTitle: string;
  description: string;
  ingredients: string[];
  instructions: string;
}

/**
 * Cache for mock data to avoid repeated file reads
 */
let mockDataCache: MockMealData[] | null = null;

/**
 * Loads mock meal plan data from JSON file
 * Uses caching to improve performance on subsequent calls
 */
function loadMockMealData(): MockMealData[] {
  if (mockDataCache) {
    return mockDataCache;
  }

  try {
    const mockDataPath = path.join(process.cwd(), 'mock-data', 'mockMealPlans.json');
    const rawData = fs.readFileSync(mockDataPath, 'utf-8');
    mockDataCache = JSON.parse(rawData);
    
    if (!Array.isArray(mockDataCache)) {
      throw new Error('Mock data must be an array');
    }
    
    return mockDataCache;
  } catch (error) {
    console.error('Error loading mock meal data:', error);
    throw new Error('Failed to load mock meal plan data. Ensure mock-data/mockMealPlans.json exists and is valid JSON.');
  }
}

/**
 * Converts mock meal data to the expected GeneratedMeal format
 */
function convertMockToGeneratedMeal(mockMeal: MockMealData, index: number, day: number, type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): GeneratedMeal {
  return {
    name: `Day ${day}: ${mockMeal.mealTitle}`,
    type,
    description: mockMeal.description,
    ingredients: mockMeal.ingredients.map(ingredient => `1 ${ingredient}`), // Add basic quantities
    instructions: [mockMeal.instructions],
    prepTime: 15, // Default prep time
    cookTime: 20, // Default cook time
    servings: 2,  // Default servings
    nutrition: {
      calories: 350,
      protein: 15,
      carbs: 45,
      fat: 12
    }
  };
}

/**
 * Generates a mock meal plan based on the request parameters
 * @param request - The meal plan generation request
 * @returns Promise<GeneratedMealPlan> - Mock meal plan data
 */
export async function generateMockMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
  try {
    const mockMeals = loadMockMealData();
    const generatedMeals: GeneratedMeal[] = [];
    
    const { duration = 7, dietType = 'Balanced' } = request;
    
    // Generate meals for the specified duration
    for (let day = 1; day <= duration; day++) {
      const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner'];
      
      // Add snack if preferences allow
      if (request.preferences?.cookingTime !== 'quick') {
        mealTypes.push('snack');
      }
      
      mealTypes.forEach((mealType, typeIndex) => {
        // Cycle through available mock meals
        const mockMealIndex = (day - 1 + typeIndex) % mockMeals.length;
        const mockMeal = mockMeals[mockMealIndex];
        
        const generatedMeal = convertMockToGeneratedMeal(mockMeal, mockMealIndex, day, mealType);
        generatedMeals.push(generatedMeal);
      });
    }
    
    const planName = `${duration}-Day ${dietType} Meal Plan (Mock)`;
    const description = `A mock ${duration}-day meal plan featuring balanced meals with fresh ingredients. This is generated from sample data for development purposes.`;
    
    return {
      name: planName,
      description,
      meals: generatedMeals
    };
  } catch (error) {
    console.error('Error generating mock meal plan:', error);
    throw new Error('Failed to generate mock meal plan: ' + (error as Error).message);
  }
}

/**
 * Generates a mock grocery list from the provided meals
 * @param meals - Array of generated meals
 * @returns Promise<string[]> - Mock grocery list
 */
export async function shuffleMockMeal(currentMeal: GeneratedMeal, userPreferences?: any): Promise<GeneratedMeal> {
  try {
    const mockMeals = loadMockMealData();
    
    // Find alternative meals that match the meal type
    const availableAlternatives = mockMeals.filter((mockMeal, index) => {
      const testMeal = convertMockToGeneratedMeal(mockMeal, index, 1, currentMeal.type);
      return testMeal.name !== currentMeal.name;
    });
    
    if (availableAlternatives.length === 0) {
      // If no alternatives found, create a variation of the current meal
      return {
        ...currentMeal,
        name: `Alternative ${currentMeal.name}`,
        description: `A variation of ${currentMeal.name} with similar nutritional profile`,
        nutrition: {
          ...currentMeal.nutrition,
          calories: Math.max(200, Math.round(currentMeal.nutrition.calories + (Math.random() * 100 - 50)))
        }
      };
    }
    
    // Select random alternative and convert to GeneratedMeal
    const randomIndex = Math.floor(Math.random() * availableAlternatives.length);
    const selectedMockMeal = availableAlternatives[randomIndex];
    const alternativeMeal = convertMockToGeneratedMeal(selectedMockMeal, randomIndex, 1, currentMeal.type);
    
    // Adjust to match original meal characteristics
    alternativeMeal.servings = currentMeal.servings;
    alternativeMeal.nutrition.calories = Math.max(200, Math.round(currentMeal.nutrition.calories + (Math.random() * 100 - 50)));
    
    return alternativeMeal;
  } catch (error) {
    console.error('Error shuffling mock meal:', error);
    throw new Error('Failed to shuffle meal: ' + (error as Error).message);
  }
}

export async function generateMockGroceryList(meals: GeneratedMeal[]): Promise<string[]> {
  try {
    const ingredientCounts = new Map<string, { total: number, unit: string }>();
    
    meals.forEach(meal => {
      meal.ingredients.forEach(ingredient => {
        // Parse quantity, unit, and ingredient name
        const match = ingredient.match(/^(\d+(?:\.\d+)?|\d+\/\d+)?\s*(cups?|tbsp|tsp|oz|slices?|medium|large|small|cloves?)?\s*(.+)/i);
        
        if (match) {
          const [, quantityStr, unit, name] = match;
          let quantity = 1;
          if (quantityStr) {
            if (quantityStr.includes('/')) {
              const [num, den] = quantityStr.split('/').map(n => parseFloat(n));
              quantity = num / den;
            } else {
              quantity = parseFloat(quantityStr);
            }
          }
          const cleanUnit = unit?.toLowerCase() || '';
          const cleanName = name.trim().toLowerCase();
          
          // Create a key combining ingredient name and unit for proper aggregation
          const key = `${cleanName}|${cleanUnit}`;
          
          if (ingredientCounts.has(key)) {
            const existing = ingredientCounts.get(key)!;
            existing.total += quantity;
          } else {
            ingredientCounts.set(key, { total: quantity, unit: cleanUnit });
          }
        }
      });
    });

    // Convert back to readable grocery list format
    const groceryList: string[] = [];
    
    ingredientCounts.forEach(({ total, unit }, key) => {
      const [name] = key.split('|');
      
      // Format the quantity nicely
      let quantityStr = '';
      if (total === Math.floor(total)) {
        quantityStr = total.toString();
      } else {
        quantityStr = total.toFixed(1).replace(/\.0$/, '');
      }
      
      // Build the grocery item string
      const item = `${quantityStr}${unit ? ` ${unit}` : ''} ${name}`;
      groceryList.push(item.trim());
    });

    return groceryList.sort();
  } catch (error) {
    console.error('Error generating mock grocery list:', error);
    throw new Error('Failed to generate mock grocery list: ' + (error as Error).message);
  }
}

/**
 * Checks if mock mode is enabled via environment variable
 */
export function isMockModeEnabled(): boolean {
  return process.env.USE_MOCK_AI === 'true';
}