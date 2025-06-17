import { MealPlanRequest, GeneratedMeal, GeneratedMealPlan } from "./openai";

// Local meal database with nutritionally balanced recipes
const mealDatabase = {
  breakfast: [
    {
      name: "Greek Yogurt Bowl with Berries",
      description: "Protein-rich Greek yogurt topped with fresh berries and granola",
      ingredients: ["1 cup Greek yogurt", "1/2 cup mixed berries", "2 tbsp granola", "1 tsp honey"],
      instructions: ["Add yogurt to bowl", "Top with berries and granola", "Drizzle with honey"],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 280, protein: 20, carbs: 35, fat: 8 },
      cuisine: "mediterranean"
    },
    {
      name: "Avocado Toast with Egg",
      description: "Whole grain toast topped with avocado and a perfectly cooked egg",
      ingredients: ["2 slices whole grain bread", "1 ripe avocado", "2 eggs", "Salt and pepper", "Red pepper flakes"],
      instructions: ["Toast bread", "Mash avocado with salt and pepper", "Cook eggs sunny side up", "Assemble and garnish"],
      prepTime: 5,
      cookTime: 8,
      servings: 1,
      nutrition: { calories: 420, protein: 18, carbs: 32, fat: 24 },
      cuisine: "american"
    },
    {
      name: "Overnight Oats with Banana",
      description: "Creamy overnight oats with banana and chia seeds",
      ingredients: ["1/2 cup rolled oats", "1/2 cup almond milk", "1 banana", "1 tbsp chia seeds", "1 tsp maple syrup"],
      instructions: ["Mix oats, milk, and chia seeds", "Refrigerate overnight", "Top with sliced banana and syrup"],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 320, protein: 8, carbs: 58, fat: 9 },
      cuisine: "american"
    },
    {
      name: "Scrambled Eggs with Spinach",
      description: "Fluffy scrambled eggs with fresh spinach and cheese",
      ingredients: ["3 eggs", "2 cups fresh spinach", "2 tbsp shredded cheese", "1 tbsp butter", "Salt and pepper"],
      instructions: ["Sauté spinach until wilted", "Scramble eggs with butter", "Add cheese", "Serve with spinach"],
      prepTime: 3,
      cookTime: 7,
      servings: 1,
      nutrition: { calories: 310, protein: 22, carbs: 6, fat: 22 },
      cuisine: "american"
    },
    {
      name: "Protein Smoothie Bowl",
      description: "Thick smoothie bowl topped with nuts and seeds",
      ingredients: ["1 cup frozen mixed berries", "1 scoop protein powder", "1/2 banana", "1/4 cup almond milk", "2 tbsp granola", "1 tbsp almonds"],
      instructions: ["Blend frozen fruit with protein powder", "Add milk gradually for thick consistency", "Pour into bowl", "Top with granola and almonds"],
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 350, protein: 25, carbs: 42, fat: 10 },
      cuisine: "american"
    },
    {
      name: "Whole Grain Pancakes",
      description: "Light and fluffy whole grain pancakes with fresh fruit",
      ingredients: ["1/2 cup whole grain flour", "1 egg", "1/2 cup milk", "1 tsp baking powder", "1 tbsp maple syrup", "1/2 cup berries"],
      instructions: ["Mix dry ingredients", "Combine wet ingredients", "Cook pancakes in non-stick pan", "Serve with berries and syrup"],
      prepTime: 8,
      cookTime: 12,
      servings: 1,
      nutrition: { calories: 380, protein: 15, carbs: 65, fat: 8 }
    }
  ],
  lunch: [
    {
      name: "Mediterranean Quinoa Bowl",
      description: "Protein-packed quinoa with fresh vegetables and feta cheese",
      ingredients: ["1 cup cooked quinoa", "1/2 cup cherry tomatoes", "1/2 cucumber", "1/4 cup feta cheese", "2 tbsp olive oil", "Fresh herbs"],
      instructions: ["Cook quinoa according to package", "Dice vegetables", "Combine all ingredients", "Dress with olive oil and herbs"],
      prepTime: 10,
      cookTime: 15,
      servings: 1,
      nutrition: { calories: 380, protein: 16, carbs: 45, fat: 16 }
    },
    {
      name: "Grilled Chicken Salad",
      description: "Fresh mixed greens with grilled chicken and vinaigrette",
      ingredients: ["6 oz grilled chicken breast", "4 cups mixed greens", "1/2 cup cherry tomatoes", "1/4 cup red onion", "2 tbsp balsamic vinaigrette"],
      instructions: ["Grill chicken breast", "Prepare salad ingredients", "Slice chicken", "Toss with dressing"],
      prepTime: 10,
      cookTime: 12,
      servings: 1,
      nutrition: { calories: 320, protein: 42, carbs: 12, fat: 10 }
    },
    {
      name: "Veggie Wrap with Hummus",
      description: "Colorful vegetables wrapped in a whole wheat tortilla with hummus",
      ingredients: ["1 whole wheat tortilla", "3 tbsp hummus", "1/2 cup shredded carrots", "1/2 cup bell peppers", "1/4 cup cucumber", "2 tbsp sprouts"],
      instructions: ["Spread hummus on tortilla", "Add vegetables", "Roll tightly", "Cut in half"],
      prepTime: 8,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 290, protein: 12, carbs: 48, fat: 8 }
    },
    {
      name: "Turkey and Avocado Sandwich",
      description: "Lean turkey breast with fresh avocado on whole grain bread",
      ingredients: ["4 oz sliced turkey breast", "2 slices whole grain bread", "1/2 avocado", "2 leaves lettuce", "2 slices tomato", "1 tsp mustard"],
      instructions: ["Toast bread lightly", "Mash avocado", "Layer turkey, avocado, lettuce, tomato", "Add mustard and assemble"],
      prepTime: 5,
      cookTime: 2,
      servings: 1,
      nutrition: { calories: 340, protein: 28, carbs: 30, fat: 14 }
    },
    {
      name: "Asian Lettuce Wraps",
      description: "Crisp lettuce cups filled with seasoned ground turkey",
      ingredients: ["6 oz ground turkey", "6 butter lettuce leaves", "1/4 cup diced water chestnuts", "2 green onions", "2 tbsp soy sauce", "1 tsp sesame oil"],
      instructions: ["Cook ground turkey with seasonings", "Add water chestnuts and green onions", "Spoon mixture into lettuce cups", "Serve immediately"],
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      nutrition: { calories: 280, protein: 32, carbs: 8, fat: 12 }
    },
    {
      name: "Black Bean and Sweet Potato Bowl",
      description: "Roasted sweet potato with black beans and lime dressing",
      ingredients: ["1 medium roasted sweet potato", "1/2 cup black beans", "1/4 cup corn", "2 tbsp cilantro", "1 lime", "1 tbsp olive oil"],
      instructions: ["Roast sweet potato until tender", "Heat black beans", "Combine with corn and cilantro", "Dress with lime juice and olive oil"],
      prepTime: 5,
      cookTime: 25,
      servings: 1,
      nutrition: { calories: 360, protein: 14, carbs: 68, fat: 6 }
    }
  ],
  dinner: [
    {
      name: "Baked Salmon with Sweet Potato",
      description: "Herb-crusted salmon with roasted sweet potato and asparagus",
      ingredients: ["6 oz salmon fillet", "1 medium sweet potato", "1 cup asparagus", "2 tbsp olive oil", "Fresh herbs", "Lemon"],
      instructions: ["Preheat oven to 400°F", "Season salmon with herbs", "Roast sweet potato and asparagus", "Bake salmon 12-15 minutes"],
      prepTime: 10,
      cookTime: 25,
      servings: 1,
      nutrition: { calories: 450, protein: 35, carbs: 35, fat: 18 }
    },
    {
      name: "Turkey Meatballs with Zucchini Noodles",
      description: "Lean turkey meatballs served over spiralized zucchini with marinara",
      ingredients: ["6 oz ground turkey", "2 medium zucchini", "1/2 cup marinara sauce", "1/4 cup breadcrumbs", "1 egg", "Italian herbs"],
      instructions: ["Make meatballs with turkey, breadcrumbs, egg", "Bake meatballs 20 minutes", "Spiralize zucchini", "Sauté zucchini briefly", "Serve with sauce"],
      prepTime: 15,
      cookTime: 25,
      servings: 1,
      nutrition: { calories: 380, protein: 38, carbs: 22, fat: 14 }
    },
    {
      name: "Lentil Curry with Brown Rice",
      description: "Protein-rich lentil curry served over fluffy brown rice",
      ingredients: ["1 cup cooked lentils", "1/2 cup brown rice", "1/2 onion", "2 cloves garlic", "1 tbsp curry powder", "1 can coconut milk", "Spinach"],
      instructions: ["Cook brown rice", "Sauté onion and garlic", "Add lentils and spices", "Simmer with coconut milk", "Add spinach at end"],
      prepTime: 10,
      cookTime: 30,
      servings: 1,
      nutrition: { calories: 420, protein: 18, carbs: 55, fat: 12 }
    },
    {
      name: "Grilled Chicken with Quinoa",
      description: "Seasoned grilled chicken breast with fluffy quinoa and roasted vegetables",
      ingredients: ["6 oz chicken breast", "1/2 cup quinoa", "1 cup mixed vegetables", "2 tbsp olive oil", "Garlic", "Lemon juice"],
      instructions: ["Season and grill chicken breast", "Cook quinoa according to package", "Roast mixed vegetables", "Serve with lemon juice"],
      prepTime: 8,
      cookTime: 20,
      servings: 1,
      nutrition: { calories: 410, protein: 42, carbs: 28, fat: 12 }
    },
    {
      name: "Beef Stir-Fry with Broccoli",
      description: "Tender beef strips stir-fried with fresh broccoli and ginger sauce",
      ingredients: ["5 oz lean beef strips", "2 cups broccoli florets", "1 tbsp sesame oil", "2 tbsp soy sauce", "1 tsp fresh ginger", "1 clove garlic"],
      instructions: ["Heat oil in wok", "Stir-fry beef until browned", "Add broccoli and aromatics", "Toss with sauce", "Serve immediately"],
      prepTime: 12,
      cookTime: 8,
      servings: 1,
      nutrition: { calories: 340, protein: 32, carbs: 12, fat: 18 }
    },
    {
      name: "Stuffed Bell Peppers",
      description: "Bell peppers stuffed with lean ground beef, rice, and vegetables",
      ingredients: ["2 bell peppers", "4 oz ground beef (lean)", "1/3 cup cooked rice", "1/4 cup diced onion", "1/4 cup corn", "2 tbsp tomato sauce"],
      instructions: ["Hollow out bell peppers", "Cook beef with onions", "Mix beef, rice, corn, sauce", "Stuff peppers", "Bake 25 minutes"],
      prepTime: 15,
      cookTime: 25,
      servings: 1,
      nutrition: { calories: 390, protein: 28, carbs: 42, fat: 12 }
    }
  ],
  snack: [
    {
      name: "Apple Slices with Almond Butter",
      description: "Crisp apple slices paired with creamy almond butter",
      ingredients: ["1 medium apple", "2 tbsp almond butter"],
      instructions: ["Wash and slice apple", "Serve with almond butter for dipping"],
      prepTime: 3,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 220, protein: 8, carbs: 25, fat: 12 }
    },
    {
      name: "Trail Mix",
      description: "Energy-boosting mix of nuts, seeds, and dried fruit",
      ingredients: ["1/4 cup mixed nuts", "1 tbsp pumpkin seeds", "2 tbsp dried fruit"],
      instructions: ["Combine all ingredients", "Store in airtight container"],
      prepTime: 2,
      cookTime: 0,
      servings: 1,
      nutrition: { calories: 200, protein: 6, carbs: 16, fat: 14 }
    }
  ]
};

// Dietary filter functions
const filterByDiet = (meals: any[], dietType?: string) => {
  if (!dietType || dietType === 'balanced') return meals;
  
  switch (dietType.toLowerCase()) {
    case 'vegetarian':
      return meals.filter(meal => 
        !meal.ingredients.some((ing: string) => 
          ing.toLowerCase().includes('chicken') || 
          ing.toLowerCase().includes('turkey') || 
          ing.toLowerCase().includes('salmon') ||
          ing.toLowerCase().includes('meat')
        )
      );
    case 'vegan':
      return meals.filter(meal => 
        !meal.ingredients.some((ing: string) => 
          ing.toLowerCase().includes('chicken') || 
          ing.toLowerCase().includes('turkey') || 
          ing.toLowerCase().includes('salmon') ||
          ing.toLowerCase().includes('meat') ||
          ing.toLowerCase().includes('yogurt') ||
          ing.toLowerCase().includes('cheese') ||
          ing.toLowerCase().includes('egg') ||
          ing.toLowerCase().includes('milk')
        )
      );
    case 'low-carb':
      return meals.filter(meal => meal.nutrition.carbs < 20);
    case 'high-protein':
      return meals.filter(meal => meal.nutrition.protein > 15);
    default:
      return meals;
  }
};

const filterByAllergies = (meals: any[], allergies?: string[]) => {
  if (!allergies || allergies.length === 0) return meals;
  
  return meals.filter(meal => {
    return !allergies.some(allergy => 
      meal.ingredients.some((ing: string) => 
        ing.toLowerCase().includes(allergy.toLowerCase())
      )
    );
  });
};

const getRandomMeals = (meals: any[], count: number) => {
  const shuffled = [...meals].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Returns the local meal database
 */
function getMealDatabase() {
  return mealDatabase;
}

export async function generateLocalMealPlan(request: MealPlanRequest): Promise<GeneratedMealPlan> {
  const { dietType, duration, preferences } = request;
  
  // Filter meals based on dietary restrictions and allergies
  const filteredBreakfast = filterByAllergies(
    filterByDiet(mealDatabase.breakfast, dietType), 
    preferences?.allergies
  );
  const filteredLunch = filterByAllergies(
    filterByDiet(mealDatabase.lunch, dietType), 
    preferences?.allergies
  );
  const filteredDinner = filterByAllergies(
    filterByDiet(mealDatabase.dinner, dietType), 
    preferences?.allergies
  );
  const filteredSnacks = filterByAllergies(
    filterByDiet(mealDatabase.snack, dietType), 
    preferences?.allergies
  );

  const meals: GeneratedMeal[] = [];
  
  // Generate meals for the specified duration
  for (let day = 0; day < duration; day++) {
    // Add breakfast
    const breakfast = getRandomMeals(filteredBreakfast, 1)[0];
    if (breakfast) {
      meals.push({
        ...breakfast,
        type: "breakfast" as const,
        name: `Day ${day + 1}: ${breakfast.name}`
      });
    }

    // Add lunch
    const lunch = getRandomMeals(filteredLunch, 1)[0];
    if (lunch) {
      meals.push({
        ...lunch,
        type: "lunch" as const,
        name: `Day ${day + 1}: ${lunch.name}`
      });
    }

    // Add dinner
    const dinner = getRandomMeals(filteredDinner, 1)[0];
    if (dinner) {
      meals.push({
        ...dinner,
        type: "dinner" as const,
        name: `Day ${day + 1}: ${dinner.name}`
      });
    }

    // Add snacks if requested
    if (preferences?.cookingTime !== 'quick') {
      const snack = getRandomMeals(filteredSnacks, 1)[0];
      if (snack) {
        meals.push({
          ...snack,
          type: "snack" as const,
          name: `Day ${day + 1}: ${snack.name}`
        });
      }
    }
  }

  const planName = `${duration}-Day ${dietType || 'Balanced'} Meal Plan`;
  const description = `A nutritionally balanced ${duration}-day meal plan featuring fresh, wholesome ingredients and varied flavors.`;

  return {
    name: planName,
    description,
    meals
  };
}

export async function shuffleLocalMeal(currentMeal: GeneratedMeal, userPreferences?: any): Promise<GeneratedMeal> {
  const dietaryRestrictions = userPreferences?.dietaryRestrictions || [];
  const allergies = userPreferences?.allergies || [];
  const preferredCuisines = userPreferences?.preferredCuisines || [];
  
  // Get all meals of the same type
  const mealDatabase = getMealDatabase();
  let availableMeals: GeneratedMeal[] = [];
  
  switch (currentMeal.type) {
    case 'breakfast':
      availableMeals = mealDatabase.breakfast;
      break;
    case 'lunch':
      availableMeals = mealDatabase.lunch;
      break;
    case 'dinner':
      availableMeals = mealDatabase.dinner;
      break;
    case 'snack':
      availableMeals = mealDatabase.snack;
      break;
  }
  
  // First, try to find meals with similar calories (within 100 calories)
  let filteredMeals = availableMeals.filter(meal => {
    if (meal.name === currentMeal.name) return false;
    
    // Check dietary restrictions
    if (dietaryRestrictions.includes('vegetarian') && !isVegetarian(meal)) return false;
    if (dietaryRestrictions.includes('vegan') && !isVegan(meal)) return false;
    if (dietaryRestrictions.includes('gluten-free') && !isGlutenFree(meal)) return false;
    if (dietaryRestrictions.includes('dairy-free') && !isDairyFree(meal)) return false;
    
    // Check allergies
    if (allergies.some(allergy => hasAllergen(meal, allergy))) return false;
    
    // Check cuisine preference
    if (preferredCuisines.length > 0 && meal.cuisine) {
      if (!preferredCuisines.includes(meal.cuisine)) return false;
    }
    
    // Prefer similar calorie range (within 100 calories)
    const calorieDiff = Math.abs(meal.nutrition.calories - currentMeal.nutrition.calories);
    return calorieDiff <= 100;
  });
  
  // If no close calorie matches, expand the range to within 150 calories
  if (filteredMeals.length === 0) {
    filteredMeals = availableMeals.filter(meal => {
      if (meal.name === currentMeal.name) return false;
      
      // Check dietary restrictions
      if (dietaryRestrictions.includes('vegetarian') && !isVegetarian(meal)) return false;
      if (dietaryRestrictions.includes('vegan') && !isVegan(meal)) return false;
      if (dietaryRestrictions.includes('gluten-free') && !isGlutenFree(meal)) return false;
      if (dietaryRestrictions.includes('dairy-free') && !isDairyFree(meal)) return false;
      
      // Check allergies
      if (allergies.some(allergy => hasAllergen(meal, allergy))) return false;
      
      // Check cuisine preference
      if (preferredCuisines.length > 0 && meal.cuisine) {
        if (!preferredCuisines.includes(meal.cuisine)) return false;
      }
      
      // Expand calorie range to 150
      const calorieDiff = Math.abs(meal.nutrition.calories - currentMeal.nutrition.calories);
      return calorieDiff <= 150;
    });
  }
  
  // If still no matches, try without calorie restrictions but keep dietary preferences
  if (filteredMeals.length === 0) {
    filteredMeals = availableMeals.filter(meal => {
      if (meal.name === currentMeal.name) return false;
      
      // Check dietary restrictions
      if (dietaryRestrictions.includes('vegetarian') && !isVegetarian(meal)) return false;
      if (dietaryRestrictions.includes('vegan') && !isVegan(meal)) return false;
      if (dietaryRestrictions.includes('gluten-free') && !isGlutenFree(meal)) return false;
      if (dietaryRestrictions.includes('dairy-free') && !isDairyFree(meal)) return false;
      
      // Check allergies
      if (allergies.some(allergy => hasAllergen(meal, allergy))) return false;
      
      // Check cuisine preference
      if (preferredCuisines.length > 0 && meal.cuisine) {
        if (!preferredCuisines.includes(meal.cuisine)) return false;
      }
      
      return true;
    });
  }
  
  // Final fallback - just exclude the current meal
  if (filteredMeals.length === 0) {
    filteredMeals = availableMeals.filter(meal => meal.name !== currentMeal.name);
  }
  
  // If still no alternatives, create a genuine variation
  if (filteredMeals.length === 0) {
    const variations = [
      { suffix: "Mediterranean Style", calorieAdjust: 20 },
      { suffix: "Asian Fusion", calorieAdjust: -15 },
      { suffix: "Herb Crusted", calorieAdjust: 10 },
      { suffix: "Spiced", calorieAdjust: 5 },
      { suffix: "with Fresh Herbs", calorieAdjust: -10 }
    ];
    
    const variation = variations[Math.floor(Math.random() * variations.length)];
    
    return {
      ...currentMeal,
      name: `${currentMeal.name} - ${variation.suffix}`,
      description: `A delicious variation of ${currentMeal.name} with ${variation.suffix.toLowerCase()} preparation`,
      nutrition: {
        ...currentMeal.nutrition,
        calories: Math.max(200, currentMeal.nutrition.calories + variation.calorieAdjust)
      }
    };
  }
  
  // Select random alternative from filtered meals
  const randomIndex = Math.floor(Math.random() * filteredMeals.length);
  const selectedMeal = { ...filteredMeals[randomIndex] };
  
  // Extract day prefix from current meal name (e.g., "Day 2:" from "Day 2: Greek Yogurt Bowl")
  const dayMatch = currentMeal.name.match(/^(Day \d+:)\s*/);
  const dayPrefix = dayMatch ? dayMatch[1] + " " : "";
  
  // Adjust to match original meal characteristics and preserve day information
  selectedMeal.servings = currentMeal.servings;
  selectedMeal.type = currentMeal.type;
  selectedMeal.name = dayPrefix + selectedMeal.name;
  
  return selectedMeal;
}

export async function generateLocalGroceryList(meals: GeneratedMeal[]): Promise<string[]> {
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
    let item = '';
    if (total > 1 || total < 1) {
      item = `${quantityStr}${unit ? ` ${unit}` : ''} ${name}`;
    } else {
      item = `${quantityStr}${unit ? ` ${unit}` : ''} ${name}`;
    }
    
    groceryList.push(item.trim());
  });

  return groceryList.sort();
}