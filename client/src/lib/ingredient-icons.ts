// Ingredient icon mapping using emoji for visual appeal
export const ingredientIcons: Record<string, string> = {
  // Fruits
  "apple": "🍎",
  "apples": "🍎",
  "banana": "🍌",
  "bananas": "🍌",
  "lemon": "🍋",
  "lemons": "🍋",
  "lime": "🍋",
  "limes": "🍋",
  "orange": "🍊",
  "oranges": "🍊",
  "strawberry": "🍓",
  "strawberries": "🍓",
  "blueberry": "🫐",
  "blueberries": "🫐",
  "grapes": "🍇",
  "grape": "🍇",
  "peach": "🍑",
  "peaches": "🍑",
  "cherry": "🍒",
  "cherries": "🍒",
  "pineapple": "🍍",
  "coconut": "🥥",
  "avocado": "🥑",
  "avocados": "🥑",
  "mango": "🥭",
  "mangoes": "🥭",

  // Vegetables
  "tomato": "🍅",
  "tomatoes": "🍅",
  "carrot": "🥕",
  "carrots": "🥕",
  "broccoli": "🥦",
  "cucumber": "🥒",
  "cucumbers": "🥒",
  "bell pepper": "🫑",
  "bell peppers": "🫑",
  "chili pepper": "🌶️",
  "chili peppers": "🌶️",
  "corn": "🌽",
  "potato": "🥔",
  "potatoes": "🥔",
  "sweet potato": "🍠",
  "sweet potatoes": "🍠",
  "onion": "🧅",
  "onions": "🧅",
  "garlic": "🧄",
  "lettuce": "🥬",
  "spinach": "🥬",
  "cabbage": "🥬",
  "mushroom": "🍄",
  "mushrooms": "🍄",
  "eggplant": "🍆",
  "zucchini": "🥒",

  // Proteins
  "chicken": "🐔",
  "beef": "🥩",
  "pork": "🥓",
  "fish": "🐟",
  "salmon": "🐟",
  "tuna": "🐟",
  "shrimp": "🦐",
  "egg": "🥚",
  "eggs": "🥚",
  "tofu": "🟫",
  "beans": "🫘",
  "chickpeas": "🫘",
  "lentils": "🫘",

  // Dairy
  "milk": "🥛",
  "cheese": "🧀",
  "butter": "🧈",
  "yogurt": "🥛",
  "cream": "🥛",

  // Grains & Carbs
  "bread": "🍞",
  "rice": "🍚",
  "pasta": "🍝",
  "noodles": "🍜",
  "wheat": "🌾",
  "oats": "🥣",
  "quinoa": "🌾",

  // Herbs & Spices
  "basil": "🌿",
  "parsley": "🌿",
  "cilantro": "🌿",
  "mint": "🌿",
  "rosemary": "🌿",
  "thyme": "🌿",
  "oregano": "🌿",
  "salt": "🧂",
  "black pepper": "⚫",
  "paprika": "🌶️",
  "cumin": "🌿",
  "ginger": "🫚",
  "turmeric": "🌿",

  // Nuts & Seeds
  "almond": "🥜",
  "almonds": "🥜",
  "walnut": "🥜",
  "walnuts": "🥜",
  "peanut": "🥜",
  "peanuts": "🥜",
  "sesame": "🌰",
  "sunflower seeds": "🌻",

  // Oils & Condiments
  "olive oil": "🫒",
  "oil": "🫒",
  "vinegar": "🍶",
  "soy sauce": "🍶",
  "honey": "🍯",
  "maple syrup": "🍁",

  // Default fallback
  "default": "🥘"
};

// Function to get icon for an ingredient
export function getIngredientIcon(ingredient: string): string {
  if (!ingredient) return ingredientIcons.default;
  
  const normalizedIngredient = ingredient.toLowerCase().trim();
  
  // Check for exact matches first
  if (ingredientIcons[normalizedIngredient]) {
    return ingredientIcons[normalizedIngredient];
  }
  
  // Check for partial matches (ingredient name contains a key)
  for (const [key, icon] of Object.entries(ingredientIcons)) {
    if (normalizedIngredient.includes(key)) {
      return icon;
    }
  }
  
  return ingredientIcons.default;
}

// Function to extract ingredient name from complex ingredient strings
export function extractIngredientName(ingredient: any): string {
  if (typeof ingredient === 'string') {
    // Remove measurements and common prefixes
    return ingredient
      .replace(/^\d+[\s]*(?:cups?|tbsp|tsp|oz|lbs?|pounds?|grams?|kg|ml|l|liters?)\s+/i, '')
      .replace(/^(?:fresh|dried|ground|chopped|diced|sliced|minced)\s+/i, '')
      .replace(/,.*$/, '') // Remove everything after first comma
      .trim();
  }
  
  if (typeof ingredient === 'object' && ingredient !== null) {
    return ingredient.name || ingredient.item || ingredient.ingredient || 'ingredient';
  }
  
  return 'ingredient';
}