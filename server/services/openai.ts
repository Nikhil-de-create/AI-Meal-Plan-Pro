import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export interface MealPlanRequest {
  dietType?: string;
  duration: number;
  preferences?: {
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferredCuisines?: string[];
    cookingTime?: "quick" | "medium" | "long";
    servingSize?: number;
  };
}

export interface GeneratedMeal {
  name: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface GeneratedMealPlan {
  name: string;
  description: string;
  meals: GeneratedMeal[];
}

export async function generateMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
  try {
    const { dietType, duration, preferences } = request;
    
    const prompt = `Create a detailed ${duration}-day meal plan with the following requirements:

${dietType ? `Diet Type: ${dietType}` : ''}
${preferences?.dietaryRestrictions ? `Dietary Restrictions: ${preferences.dietaryRestrictions.join(', ')}` : ''}
${preferences?.allergies ? `Allergies: ${preferences.allergies.join(', ')}` : ''}
${preferences?.preferredCuisines ? `Preferred Cuisines: ${preferences.preferredCuisines.join(', ')}` : ''}
${preferences?.cookingTime ? `Cooking Time Preference: ${preferences.cookingTime}` : ''}
${preferences?.servingSize ? `Serving Size: ${preferences.servingSize} people` : ''}

Please generate a comprehensive meal plan with breakfast, lunch, and dinner for each day. For each meal, include:
- Name of the dish
- Brief description
- Complete ingredients list
- Step-by-step cooking instructions
- Preparation time (minutes)
- Cooking time (minutes)
- Number of servings
- Estimated nutritional information (calories, protein, carbs, fat)

Format the response as JSON with this structure:
{
  "name": "meal plan name",
  "description": "brief description of the meal plan",
  "meals": [
    {
      "name": "dish name",
      "type": "breakfast|lunch|dinner|snack",
      "description": "brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": ["step 1", "step 2"],
      "prepTime": minutes,
      "cookTime": minutes,
      "servings": number,
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef. Create detailed, practical meal plans with accurate nutritional information and clear cooking instructions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result as GeneratedMealPlan;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Failed to generate meal plan. Please try again.");
  }
}

export async function shuffleMeal(currentMeal: GeneratedMeal, userPreferences?: any): Promise<GeneratedMeal> {
  try {
    const dietaryRestrictions = userPreferences?.dietaryRestrictions || [];
    const allergies = userPreferences?.allergies || [];
    const preferredCuisines = userPreferences?.preferredCuisines || [];
    
    const prompt = `Generate an alternative meal to replace this current meal:

Current Meal: ${JSON.stringify(currentMeal)}

Requirements for the replacement meal:
1. Must be the same meal type (${currentMeal.type})
2. Target similar calories (within 50 calories of ${currentMeal.nutrition.calories})
3. Similar prep/cook time (prep: ${currentMeal.prepTime}min, cook: ${currentMeal.cookTime}min)
4. Same serving size (${currentMeal.servings} servings)
5. Respect dietary restrictions: ${dietaryRestrictions.join(', ') || 'none'}
6. Avoid allergies: ${allergies.join(', ') || 'none'}
7. Preferred cuisines: ${preferredCuisines.join(', ') || 'any'}
8. Must be a completely different recipe from the current meal

Return a JSON object with this exact structure:
{
  "name": "Recipe Name",
  "type": "${currentMeal.type}",
  "description": "Brief description",
  "ingredients": ["ingredient1", "ingredient2"],
  "instructions": ["step1", "step2"],
  "prepTime": number,
  "cookTime": number,
  "servings": ${currentMeal.servings},
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional nutritionist and chef. Generate alternative meals that closely match nutritional requirements and dietary preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result as GeneratedMeal;
  } catch (error) {
    console.error("OpenAI Meal Shuffle Error:", error);
    throw new Error("Failed to generate alternative meal. Please try again.");
  }
}

export async function generateGroceryList(meals: GeneratedMeal[]): Promise<string[]> {
  try {
    const mealsJson = JSON.stringify(meals.map(meal => ({
      name: meal.name,
      ingredients: meal.ingredients
    })));

    const prompt = `Based on these meals, create a consolidated grocery shopping list:

${mealsJson}

Please:
1. Combine duplicate ingredients
2. Group similar items together (produce, dairy, meat, etc.)
3. Provide reasonable quantities for shopping
4. Format as a simple list

Return the grocery list as a JSON array of strings, where each string is a grocery item with quantity.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates efficient grocery shopping lists."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.items || [];
  } catch (error) {
    console.error("OpenAI Grocery List Error:", error);
    throw new Error("Failed to generate grocery list. Please try again.");
  }
}
