import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, generateToken, type AuthRequest } from "./middleware/auth";
import { requireSuperAdmin, requireAdmin } from "./middleware/admin-auth";
import { generateMealPlan, generateGroceryList, shuffleMeal } from "./services/openai";
import { SocialMediaShareService } from "./services/socialMediaShare";
import { googleAuthService } from "./services/googleAuth";
import { 
  insertUserSchema, 
  insertUserPreferencesSchema,
  mealPlanGenerationSchema,
  insertGroceryListSchema,
  insertUserFavoriteSchema,
  insertSystemLogSchema,
  insertAiConfigurationSchema,
  insertGroceryPartnerSchema,
  insertSystemMetricSchema,
  insertDeviceTokenSchema,
  insertUserNotificationSettingsSchema
} from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(userData);
      const token = generateToken(user.id);

      // Remove password from response
      const { password, ...userResponse } = user;
      
      res.status(201).json({
        message: "User created successfully",
        user: userResponse,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await storage.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      
      // Remove password from response
      const { password: _, ...userResponse } = user;
      
      res.json({
        message: "Login successful",
        user: userResponse,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google OAuth authentication routes
  app.post("/api/auth/google/signin", async (req, res) => {
    try {
      const { idToken, accessToken } = req.body;
      
      if (!idToken && !accessToken) {
        return res.status(400).json({ message: "Google token is required" });
      }

      // Verify the Google token and get user info
      let googleUser;
      try {
        googleUser = idToken 
          ? await googleAuthService.verifyIdToken(idToken)
          : await googleAuthService.verifyAccessToken(accessToken);
      } catch (error) {
        console.error("Google token verification failed:", error);
        return res.status(401).json({ message: "Invalid Google token" });
      }

      if (!googleUser.email) {
        return res.status(400).json({ message: "Email not provided by Google" });
      }

      // Check if user exists by Google ID
      let user = await storage.getUserByGoogleId(googleUser.googleId);
      
      if (!user) {
        // Check if user exists with same email but different auth provider
        const existingEmailUser = await storage.getUserByEmail(googleUser.email);
        
        if (existingEmailUser) {
          // Link Google account to existing email account
          user = await storage.linkGoogleAccount(existingEmailUser.id, googleUser.googleId);
        } else {
          // Create new user with Google auth
          const userData = {
            email: googleUser.email,
            username: googleUser.email.split('@')[0] + '_' + Date.now(), // Generate unique username
            googleId: googleUser.googleId,
            authProvider: 'google' as const,
            firstName: googleUser.name?.split(' ')[0] || '',
            lastName: googleUser.name?.split(' ').slice(1).join(' ') || '',
          };
          
          user = await storage.createGoogleUser(userData);
        }
      }

      // Update last login time
      await storage.updateLastLogin(user.id);

      const token = generateToken(user.id);
      
      // Remove sensitive data from response
      const { password, googleId, ...userResponse } = user;
      
      res.json({
        message: "Google sign-in successful",
        user: userResponse,
        token
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google OAuth callback for web (optional server-side flow)
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }

      // Exchange code for tokens
      const tokens = await googleAuthService.getTokens(
        code as string,
        `${req.protocol}://${req.get('host')}/api/auth/google/callback`
      );

      if (!tokens.access_token) {
        return res.status(400).json({ message: "Failed to get access token" });
      }

      // Get user info using access token
      const googleUser = await googleAuthService.verifyAccessToken(tokens.access_token);

      // Same user creation/login logic as above
      let user = await storage.getUserByGoogleId(googleUser.googleId);
      
      if (!user) {
        const existingEmailUser = await storage.getUserByEmail(googleUser.email!);
        
        if (existingEmailUser) {
          user = await storage.linkGoogleAccount(existingEmailUser.id, googleUser.googleId);
        } else {
          const userData = {
            email: googleUser.email!,
            username: googleUser.email!.split('@')[0] + '_' + Date.now(),
            googleId: googleUser.googleId,
            authProvider: 'google' as const,
            firstName: googleUser.name?.split(' ')[0] || '',
            lastName: googleUser.name?.split(' ').slice(1).join(' ') || '',
          };
          
          user = await storage.createGoogleUser(userData);
        }
      }

      await storage.updateLastLogin(user.id);
      const token = generateToken(user.id);

      // Redirect to frontend with token (for web flow)
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStats(req.user!.id);
      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User preferences routes
  app.get("/api/user/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(preferences);
    } catch (error) {
      console.error("Preferences fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const preferences = await storage.createUserPreferences(preferencesData);
      res.status(201).json(preferences);
    } catch (error) {
      console.error("Preferences creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/user/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.partial().parse(req.body);
      const preferences = await storage.updateUserPreferences(req.user!.id, preferencesData);
      
      if (!preferences) {
        return res.status(404).json({ message: "Preferences not found" });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Preferences update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Meal plan routes
  app.get("/api/mealplans", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mealPlans = await storage.getUserMealPlans(req.user!.id);
      res.json(mealPlans);
    } catch (error) {
      console.error("Meal plans fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/mealplans/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id);
      
      if (!mealPlan || mealPlan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      res.json(mealPlan);
    } catch (error) {
      console.error("Meal plan fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/mealplan", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requestData = mealPlanGenerationSchema.parse(req.body);
      
      // Load user preferences and merge with request data
      let enhancedRequestData = { ...requestData };
      try {
        const userPreferences = await storage.getUserPreferences(req.user!.id);
        if (userPreferences) {
          enhancedRequestData.preferences = {
            ...enhancedRequestData.preferences,
            dietaryRestrictions: userPreferences.dietaryRestrictions || enhancedRequestData.preferences?.dietaryRestrictions || [],
            allergies: userPreferences.allergies || enhancedRequestData.preferences?.allergies || [],
            preferredCuisines: userPreferences.preferredCuisines || enhancedRequestData.preferences?.preferredCuisines || [],
            cookingTime: userPreferences.cookingTime || enhancedRequestData.preferences?.cookingTime || 'medium',
            servingSize: userPreferences.servingSize || enhancedRequestData.preferences?.servingSize || 2,
          };
        }
      } catch (preferencesError) {
        console.log('No user preferences found, using request data only');
      }
      
      let generatedPlan;
      
      // Check if mock mode is enabled via environment variable
      if (process.env.USE_MOCK_AI === 'true') {
        console.log('Using mock meal plan data (USE_MOCK_AI=true)');
        const { generateMockMealPlan } = await import('./services/mock-data');
        generatedPlan = await generateMockMealPlan(enhancedRequestData);
      } else {
        // Use real AI generation with fallback to local generator
        try {
          // Try OpenAI first
          generatedPlan = await generateMealPlan(enhancedRequestData);
        } catch (openaiError: any) {
          console.log('OpenAI generation failed, using local generator:', openaiError.message);
          // Fallback to local generation
          const { generateLocalMealPlan } = await import('./services/local-meal-generator');
          generatedPlan = await generateLocalMealPlan(enhancedRequestData);
        }
      }
      
      // Save to database
      const mealPlan = await storage.createMealPlan({
        userId: req.user!.id,
        name: generatedPlan.name,
        description: generatedPlan.description,
        dietType: requestData.dietType || null,
        duration: requestData.duration,
        meals: generatedPlan.meals,
        isActive: true
      });
      
      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Meal plan generation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate meal plan. Please try again." });
    }
  });

  app.post("/api/mealplans/:id/shuffle-meal", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mealPlanId = parseInt(req.params.id);
      const { mealIndex, currentMeal, preferredCuisine } = req.body;
      
      if (typeof mealIndex !== 'number' || !currentMeal) {
        return res.status(400).json({ message: "Meal index and current meal data required" });
      }
      
      const mealPlan = await storage.getMealPlan(mealPlanId);
      if (!mealPlan || mealPlan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      // Get user preferences for dietary restrictions
      let userPreferences;
      try {
        userPreferences = await storage.getUserPreferences(req.user!.id);
      } catch (error) {
        console.log('No user preferences found, using defaults');
      }
      
      // Add preferred cuisine to user preferences if specified
      if (preferredCuisine) {
        userPreferences = {
          ...userPreferences,
          preferredCuisines: [preferredCuisine]
        };
      }
      
      // Generate alternative meal with similar calories and dietary requirements
      let alternativeMeal;
      
      if (process.env.USE_MOCK_AI === 'true') {
        console.log('Using mock meal shuffle data (USE_MOCK_AI=true)');
        const { shuffleMockMeal } = await import('./services/mock-data');
        alternativeMeal = await shuffleMockMeal(currentMeal, userPreferences);
      } else {
        try {
          // Try OpenAI meal shuffle
          alternativeMeal = await shuffleMeal(currentMeal, userPreferences);
        } catch (openaiError: any) {
          console.log('OpenAI shuffle failed, using local generator:', openaiError.message);
          const { shuffleLocalMeal } = await import('./services/local-meal-generator');
          alternativeMeal = await shuffleLocalMeal(currentMeal, userPreferences);
        }
      }
      
      // Update the meal plan with the new meal
      const meals = Array.isArray(mealPlan.meals) ? [...mealPlan.meals] : [];
      
      if (mealIndex >= 0 && mealIndex < meals.length) {
        meals[mealIndex] = alternativeMeal;
        
        const updatedMealPlan = await storage.updateMealPlan(mealPlanId, {
          meals: meals
        });
        
        res.json({ 
          success: true, 
          alternativeMeal,
          updatedMealPlan,
          mealIndex,
          totalMeals: meals.length
        });
      } else {
        res.status(400).json({ message: "Invalid meal index" });
      }
    } catch (error) {
      console.error("Meal shuffle error:", error);
      res.status(500).json({ message: "Failed to shuffle meal. Please try again." });
    }
  });

  app.delete("/api/mealplans/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id);
      
      if (!mealPlan || mealPlan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      const deleted = await storage.deleteMealPlan(id);
      if (deleted) {
        res.json({ message: "Meal plan deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete meal plan" });
      }
    } catch (error) {
      console.error("Meal plan deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Recipe routes
  app.get("/api/recipes", async (req, res) => {
    try {
      const { search } = req.query;
      let recipes;
      
      if (search && typeof search === 'string') {
        recipes = await storage.searchRecipes(search);
      } else {
        recipes = await storage.getAllRecipes();
      }
      
      res.json(recipes);
    } catch (error) {
      console.error("Recipes fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      res.json(recipe);
    } catch (error) {
      console.error("Recipe fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User favorites routes
  app.get("/api/user/favorites", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const favorites = await storage.getUserFavorites(req.user!.id);
      res.json(favorites);
    } catch (error) {
      console.error("Favorites fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/favorites", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const favoriteData = insertUserFavoriteSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Favorite creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/user/favorites/:recipeId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const removed = await storage.removeFavorite(req.user!.id, recipeId);
      
      if (removed) {
        res.json({ message: "Favorite removed successfully" });
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      console.error("Favorite removal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Grocery list routes
  app.get("/api/grocery-lists", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const groceryLists = await storage.getUserGroceryLists(req.user!.id);
      res.json(groceryLists);
    } catch (error) {
      console.error("Grocery lists fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/grocery-lists", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const groceryListData = insertGroceryListSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const groceryList = await storage.createGroceryList(groceryListData);
      res.status(201).json(groceryList);
    } catch (error) {
      console.error("Grocery list creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/grocery-lists/generate/:mealPlanId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      const mealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!mealPlan || mealPlan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      let groceryItems;
      
      // Check if mock mode is enabled via environment variable
      if (process.env.USE_MOCK_AI === 'true') {
        console.log('Using mock grocery list data (USE_MOCK_AI=true)');
        const { generateMockGroceryList } = await import('./services/mock-data');
        groceryItems = await generateMockGroceryList(mealPlan.meals as any[]);
      } else {
        // Use real AI generation with fallback to local generator
        try {
          // Try OpenAI first
          groceryItems = await generateGroceryList(mealPlan.meals as any[]);
        } catch (openaiError: any) {
          console.log('OpenAI grocery generation failed, using local generator:', openaiError.message);
          // Fallback to local generation
          const { generateLocalGroceryList } = await import('./services/local-meal-generator');
          groceryItems = await generateLocalGroceryList(mealPlan.meals as any[]);
        }
      }
      
      const groceryList = await storage.createGroceryList({
        userId: req.user!.id,
        name: `Grocery List for ${mealPlan.name}`,
        items: groceryItems,
        mealPlanId: mealPlanId,
        completed: false
      });
      
      res.status(201).json(groceryList);
    } catch (error) {
      console.error("Grocery list generation error:", error);
      res.status(500).json({ message: "Failed to generate grocery list. Please try again." });
    }
  });

  app.delete("/api/grocery-lists/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const groceryList = await storage.getGroceryList(id);
      
      if (!groceryList || groceryList.userId !== req.user!.id) {
        return res.status(404).json({ message: "Grocery list not found" });
      }
      
      const deleted = await storage.deleteGroceryList(id);
      if (deleted) {
        res.json({ message: "Grocery list deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete grocery list" });
      }
    } catch (error) {
      console.error("Grocery list deletion error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Pantry management endpoints
  app.get("/api/pantry", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const pantryItems = await storage.getUserPantryItems(req.user!.id);
      res.json(pantryItems);
    } catch (error) {
      console.error("Error fetching pantry items:", error);
      res.status(500).json({ message: "Failed to fetch pantry items" });
    }
  });

  app.post("/api/pantry", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const pantryItem = await storage.createPantryItem({
        ...req.body,
        userId: req.user!.id
      });
      res.status(201).json(pantryItem);
    } catch (error) {
      console.error("Error creating pantry item:", error);
      res.status(500).json({ message: "Failed to create pantry item" });
    }
  });

  app.put("/api/pantry/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const pantryItem = await storage.updatePantryItem(id, req.body);
      
      if (!pantryItem) {
        return res.status(404).json({ message: "Pantry item not found" });
      }
      
      res.json(pantryItem);
    } catch (error) {
      console.error("Error updating pantry item:", error);
      res.status(500).json({ message: "Failed to update pantry item" });
    }
  });

  app.delete("/api/pantry/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deletePantryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Pantry item not found" });
      }
      
      res.json({ message: "Pantry item deleted successfully" });
    } catch (error) {
      console.error("Error deleting pantry item:", error);
      res.status(500).json({ message: "Failed to delete pantry item" });
    }
  });

  // Smart grocery list generation endpoint
  app.post("/api/grocery-lists/smart/:mealPlanId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const mealPlanId = parseInt(req.params.mealPlanId);
      const mealPlan = await storage.getMealPlan(mealPlanId);
      
      if (!mealPlan || mealPlan.userId !== req.user!.id) {
        return res.status(404).json({ message: "Meal plan not found" });
      }

      // Extract ingredients from meal plan
      const meals = mealPlan.meals as any[];
      const allIngredients = meals.flatMap(meal => meal.ingredients || []);
      
      // Generate smart grocery list
      const smartList = await storage.generateSmartGroceryList(req.user!.id, allIngredients);
      
      res.json(smartList);
    } catch (error) {
      console.error("Error generating smart grocery list:", error);
      res.status(500).json({ message: "Failed to generate smart grocery list" });
    }
  });

  // Grocery order endpoints
  app.get("/api/grocery-orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const orders = await storage.getUserGroceryOrders(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching grocery orders:", error);
      res.status(500).json({ message: "Failed to fetch grocery orders" });
    }
  });

  app.post("/api/grocery-orders", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create grocery order
      const order = await storage.createGroceryOrder({
        userId: req.user!.id,
        orderNumber,
        items: req.body.items,
        status: "confirmed",
        deliveryAddress: req.body.deliveryAddress || "Default Address",
        estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating grocery order:", error);
      res.status(500).json({ message: "Failed to create grocery order" });
    }
  });

  // ======= ADMIN ROUTES =======
  // Analytics dashboard
  app.get("/api/admin/analytics", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching system analytics:", error);
      res.status(500).json({ message: "Failed to fetch system analytics" });
    }
  });

  // User management
  app.get("/api/admin/users", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { search, role, isActive } = req.query;
      const users = await storage.getAllUsers(
        search as string,
        role as string,
        isActive ? isActive === 'true' : undefined
      );
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/toggle-status", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedUser = await storage.toggleUserStatus(id);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ message: "Failed to toggle user status" });
    }
  });

  // System logs
  app.get("/api/admin/logs", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { level, source, limit } = req.query;
      const logs = await storage.getSystemLogs(
        level as string,
        source as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  app.post("/api/admin/logs", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const logData = insertSystemLogSchema.parse(req.body);
      const log = await storage.createSystemLog(logData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating system log:", error);
      res.status(500).json({ message: "Failed to create system log" });
    }
  });

  // AI configurations
  app.get("/api/admin/ai-configs", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const configs = await storage.getAiConfigurations();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching AI configurations:", error);
      res.status(500).json({ message: "Failed to fetch AI configurations" });
    }
  });

  app.get("/api/admin/ai-configs/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await storage.getAiConfiguration(id);
      
      if (!config) {
        return res.status(404).json({ message: "AI configuration not found" });
      }
      
      res.json(config);
    } catch (error) {
      console.error("Error fetching AI configuration:", error);
      res.status(500).json({ message: "Failed to fetch AI configuration" });
    }
  });

  app.post("/api/admin/ai-configs", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const configData = insertAiConfigurationSchema.parse(req.body);
      const config = await storage.createAiConfiguration(configData);
      res.status(201).json(config);
    } catch (error) {
      console.error("Error creating AI configuration:", error);
      res.status(500).json({ message: "Failed to create AI configuration" });
    }
  });

  app.put("/api/admin/ai-configs/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const configData = req.body;
      
      const updatedConfig = await storage.updateAiConfiguration(id, configData);
      if (!updatedConfig) {
        return res.status(404).json({ message: "AI configuration not found" });
      }
      
      res.json(updatedConfig);
    } catch (error) {
      console.error("Error updating AI configuration:", error);
      res.status(500).json({ message: "Failed to update AI configuration" });
    }
  });

  app.delete("/api/admin/ai-configs/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteAiConfiguration(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "AI configuration not found" });
      }
      
      res.json({ message: "AI configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting AI configuration:", error);
      res.status(500).json({ message: "Failed to delete AI configuration" });
    }
  });

  // Grocery partners
  app.get("/api/admin/grocery-partners", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const partners = await storage.getGroceryPartners();
      res.json(partners);
    } catch (error) {
      console.error("Error fetching grocery partners:", error);
      res.status(500).json({ message: "Failed to fetch grocery partners" });
    }
  });

  app.get("/api/admin/grocery-partners/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const partner = await storage.getGroceryPartner(id);
      
      if (!partner) {
        return res.status(404).json({ message: "Grocery partner not found" });
      }
      
      res.json(partner);
    } catch (error) {
      console.error("Error fetching grocery partner:", error);
      res.status(500).json({ message: "Failed to fetch grocery partner" });
    }
  });

  app.post("/api/admin/grocery-partners", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const partnerData = insertGroceryPartnerSchema.parse(req.body);
      const partner = await storage.createGroceryPartner(partnerData);
      res.status(201).json(partner);
    } catch (error) {
      console.error("Error creating grocery partner:", error);
      res.status(500).json({ message: "Failed to create grocery partner" });
    }
  });

  app.put("/api/admin/grocery-partners/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const partnerData = req.body;
      
      const updatedPartner = await storage.updateGroceryPartner(id, partnerData);
      if (!updatedPartner) {
        return res.status(404).json({ message: "Grocery partner not found" });
      }
      
      res.json(updatedPartner);
    } catch (error) {
      console.error("Error updating grocery partner:", error);
      res.status(500).json({ message: "Failed to update grocery partner" });
    }
  });

  app.delete("/api/admin/grocery-partners/:id", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGroceryPartner(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Grocery partner not found" });
      }
      
      res.json({ message: "Grocery partner deleted successfully" });
    } catch (error) {
      console.error("Error deleting grocery partner:", error);
      res.status(500).json({ message: "Failed to delete grocery partner" });
    }
  });

  // System metrics
  app.get("/api/admin/metrics", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { metricName, fromDate, toDate } = req.query;
      const metrics = await storage.getSystemMetrics(
        metricName as string,
        fromDate ? new Date(fromDate as string) : undefined,
        toDate ? new Date(toDate as string) : undefined
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching system metrics:", error);
      res.status(500).json({ message: "Failed to fetch system metrics" });
    }
  });

  app.post("/api/admin/metrics", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const metricData = insertSystemMetricSchema.parse(req.body);
      const metric = await storage.recordSystemMetric(metricData);
      res.status(201).json(metric);
    } catch (error) {
      console.error("Error recording system metric:", error);
      res.status(500).json({ message: "Failed to record system metric" });
    }
  });

  // Push notification routes
  app.post("/api/notifications/register-device", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deviceData = insertDeviceTokenSchema.parse({
        ...req.body,
        userId: req.userId
      });
      
      const deviceToken = await storage.createDeviceToken(deviceData);
      res.status(201).json(deviceToken);
    } catch (error) {
      console.error("Error registering device token:", error);
      res.status(500).json({ message: "Failed to register device token" });
    }
  });

  app.delete("/api/notifications/unregister-device/:token", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { token } = req.params;
      await storage.deactivateDeviceToken(token);
      res.json({ message: "Device token deactivated successfully" });
    } catch (error) {
      console.error("Error unregistering device token:", error);
      res.status(500).json({ message: "Failed to unregister device token" });
    }
  });

  app.get("/api/notifications/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getNotificationHistory(req.userId!, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching notification history:", error);
      res.status(500).json({ message: "Failed to fetch notification history" });
    }
  });

  app.get("/api/notifications/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const settings = await storage.getUserNotificationSettings(req.userId!);
      if (!settings) {
        // Create default settings if none exist
        const defaultSettings = await storage.createUserNotificationSettings({
          userId: req.userId!,
          mealRemindersEnabled: true,
          reminderTime: "09:00",
          timezone: "UTC"
        });
        return res.json(defaultSettings);
      }
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notifications/settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const settingsData = insertUserNotificationSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateUserNotificationSettings(req.userId!, settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Manual meal reminder trigger (for testing)
  app.post("/api/notifications/send-meal-reminders", authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
    try {
      const { notificationService } = await import('./services/notification');
      await notificationService.sendMealReminders();
      res.json({ message: "Meal reminders sent successfully" });
    } catch (error) {
      console.error("Error sending meal reminders:", error);
      res.status(500).json({ message: "Failed to send meal reminders" });
    }
  });

  // Social Media / Discover Routes - "Spotify for Meals"
  app.get("/api/discover/trending-meal-plans", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const trendingMealPlans = await storage.getTrendingMealPlans();
      res.json(trendingMealPlans);
    } catch (error) {
      console.error("Trending meal plans fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/discover/trending-recipes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const trendingRecipes = await storage.getTrendingRecipes();
      res.json(trendingRecipes);
    } catch (error) {
      console.error("Trending recipes fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/discover/friend-activity", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const friendActivity = await storage.getFriendActivity(userId);
      res.json(friendActivity);
    } catch (error) {
      console.error("Friend activity fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/discover/nearby-trending", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const nearbyTrending = await storage.getNearbyTrending(userId);
      res.json(nearbyTrending);
    } catch (error) {
      console.error("Nearby trending fetch error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Friend Discovery and Following Routes
  app.get("/api/users/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const users = await storage.searchUsers(query, req.user!.id);
      res.json(users);
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post("/api/users/:userId/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const followingId = parseInt(userId);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      if (followingId === req.user!.id) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }
      
      await storage.followUser(req.user!.id, followingId);
      res.json({ message: 'Successfully followed user' });
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:userId/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const followingId = parseInt(userId);
      
      if (isNaN(followingId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }
      
      await storage.unfollowUser(req.user!.id, followingId);
      res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
      console.error("Unfollow user error:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/following", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const following = await storage.getFollowing(req.user!.id);
      res.json(following);
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ message: "Failed to fetch following list" });
    }
  });

  app.get("/api/users/followers", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followers = await storage.getFollowers(req.user!.id);
      res.json(followers);
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ message: "Failed to fetch followers list" });
    }
  });

  // Social Media Sharing Routes
  app.post("/api/share/cooking-achievement", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { recipeId, cookingTime } = req.body;
      const userId = req.user!.id;
      
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const achievement = SocialMediaShareService.generateCookingAchievement(recipe, cookingTime);
      const content = SocialMediaShareService.generateShareContent(achievement);
      const shareUrls = SocialMediaShareService.generateShareUrls(content);
      
      res.json({
        achievement,
        content,
        shareUrls
      });
    } catch (error) {
      console.error("Error generating cooking achievement share:", error);
      res.status(500).json({ message: "Failed to generate share content" });
    }
  });

  app.post("/api/share/meal-plan-completion", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { mealPlanId } = req.body;
      const userId = req.user!.id;
      
      const mealPlan = await storage.getMealPlan(mealPlanId);
      if (!mealPlan || mealPlan.userId !== userId) {
        return res.status(404).json({ message: "Meal plan not found" });
      }
      
      const achievement = SocialMediaShareService.generateMealPlanAchievement(mealPlan);
      const content = SocialMediaShareService.generateShareContent(achievement);
      const shareUrls = SocialMediaShareService.generateShareUrls(content);
      
      res.json({
        achievement,
        content,
        shareUrls
      });
    } catch (error) {
      console.error("Error generating meal plan completion share:", error);
      res.status(500).json({ message: "Failed to generate share content" });
    }
  });

  app.post("/api/share/recipe-mastery", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { recipeId, completionCount } = req.body;
      const userId = req.user!.id;
      
      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const achievement = SocialMediaShareService.generateRecipeMasteryAchievement(recipe, completionCount);
      const content = SocialMediaShareService.generateShareContent(achievement);
      const shareUrls = SocialMediaShareService.generateShareUrls(content);
      
      res.json({
        achievement,
        content,
        shareUrls
      });
    } catch (error) {
      console.error("Error generating recipe mastery share:", error);
      res.status(500).json({ message: "Failed to generate share content" });
    }
  });

  app.post("/api/share/cooking-streak", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { streakDays } = req.body;
      
      const achievement = SocialMediaShareService.generateStreakAchievement(streakDays);
      const content = SocialMediaShareService.generateShareContent(achievement);
      const shareUrls = SocialMediaShareService.generateShareUrls(content);
      
      res.json({
        achievement,
        content,
        shareUrls
      });
    } catch (error) {
      console.error("Error generating cooking streak share:", error);
      res.status(500).json({ message: "Failed to generate share content" });
    }
  });

  app.post("/api/share/record", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { platform, achievementType, contentId } = req.body;
      const userId = req.user!.id;
      
      await SocialMediaShareService.recordShare(userId, platform, achievementType, contentId);
      
      res.json({ message: "Share recorded successfully" });
    } catch (error) {
      console.error("Error recording share:", error);
      res.status(500).json({ message: "Failed to record share" });
    }
  });

  app.post("/api/likes/recipe", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { recipeId } = req.body;
      await storage.likeRecipe(userId, recipeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Recipe like error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/likes/meal-plan", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { mealPlanId } = req.body;
      await storage.likeMealPlan(userId, mealPlanId);
      res.json({ success: true });
    } catch (error) {
      console.error("Meal plan like error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followerId = req.user!.id;
      const { followingId } = req.body;
      await storage.followUser(followerId, followingId);
      res.json({ success: true });
    } catch (error) {
      console.error("Follow user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/share", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { contentType, contentId, platform } = req.body;
      await storage.shareContent(userId, contentType, contentId, platform);
      res.json({ success: true });
    } catch (error) {
      console.error("Share content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/copy-meal-plan", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { mealPlanId } = req.body;
      const copiedPlan = await storage.copyMealPlanToUser(userId, mealPlanId);
      res.json(copiedPlan);
    } catch (error) {
      console.error("Copy meal plan error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cooking session routes
  app.get("/api/cooking-sessions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessions = await storage.getUserCookingSessions(req.userId!);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching cooking sessions:", error);
      res.status(500).json({ message: "Failed to fetch cooking sessions" });
    }
  });

  app.post("/api/cooking-sessions/start/:recipeId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const { cookingSessionManager } = await import('./services/cookingSession');
      
      const session = await cookingSessionManager.startCookingSession(req.user!.id, recipeId);
      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting cooking session:", error);
      res.status(500).json({ message: error.message || "Failed to start cooking session" });
    }
  });

  app.put("/api/cooking-sessions/:id/pause", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { cookingSessionManager } = await import('./services/cookingSession');
      
      const session = await cookingSessionManager.pauseCookingSession(sessionId);
      res.json(session);
    } catch (error) {
      console.error("Error pausing cooking session:", error);
      res.status(500).json({ message: "Failed to pause cooking session" });
    }
  });

  app.put("/api/cooking-sessions/:id/resume", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { cookingSessionManager } = await import('./services/cookingSession');
      
      const session = await cookingSessionManager.resumeCookingSession(sessionId);
      res.json(session);
    } catch (error) {
      console.error("Error resuming cooking session:", error);
      res.status(500).json({ message: "Failed to resume cooking session" });
    }
  });

  app.put("/api/cooking-sessions/:id/next-step", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { cookingSessionManager } = await import('./services/cookingSession');
      
      const session = await cookingSessionManager.nextStep(sessionId);
      res.json(session);
    } catch (error) {
      console.error("Error advancing to next step:", error);
      res.status(500).json({ message: "Failed to advance to next step" });
    }
  });

  app.delete("/api/cooking-sessions/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { cookingSessionManager } = await import('./services/cookingSession');
      
      await cookingSessionManager.cancelCookingSession(sessionId);
      res.json({ message: "Cooking session cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling cooking session:", error);
      res.status(500).json({ message: "Failed to cancel cooking session" });
    }
  });

  app.get("/api/recipes/:id/cooking-steps", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const recipeId = parseInt(req.params.id);
      const steps = await storage.getCookingStepsByRecipe(recipeId);
      res.json(steps);
    } catch (error) {
      console.error("Error fetching cooking steps:", error);
      res.status(500).json({ message: "Failed to fetch cooking steps" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
