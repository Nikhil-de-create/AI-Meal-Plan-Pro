import { 
  users, 
  userPreferences, 
  mealPlans, 
  recipes, 
  groceryLists, 
  userFavorites,
  pantryItems,
  groceryOrders,
  systemLogs,
  aiConfigurations,
  groceryPartners,
  systemMetrics,
  deviceTokens,
  notificationHistory,
  userNotificationSettings,
  cookingSteps,
  cookingSessions,
  recipeLikes,
  mealPlanLikes,
  userFollows,
  userActivity,
  socialShares,
  trendingContent,
  type User, 
  type InsertUser, 
  type UserPreferences,
  type InsertUserPreferences,
  type MealPlan,
  type InsertMealPlan,
  type Recipe,
  type InsertRecipe,
  type GroceryList,
  type InsertGroceryList,
  type UserFavorite,
  type InsertUserFavorite,
  type PantryItem,
  type InsertPantryItem,
  type GroceryOrder,
  type InsertGroceryOrder,
  type SystemLog,
  type InsertSystemLog,
  type AiConfiguration,
  type InsertAiConfiguration,
  type GroceryPartner,
  type InsertGroceryPartner,
  type SystemMetric,
  type InsertSystemMetric,
  type DeviceToken,
  type InsertDeviceToken,
  type NotificationHistory,
  type InsertNotificationHistory,
  type UserNotificationSettings,
  type InsertUserNotificationSettings,
  type CookingStep,
  type InsertCookingStep,
  type RecipeLike,
  type InsertRecipeLike,
  type MealPlanLike,
  type InsertMealPlanLike,
  type UserFollow,
  type InsertUserFollow,
  type UserActivity,
  type InsertUserActivity,
  type SocialShare,
  type InsertSocialShare,
  type TrendingContent,
  type InsertTrendingContent,
  type UserProfile,
  type InsertUserProfile,
  type CookingSession,
  type InsertCookingSession
} from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, like, and, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { cache } from "./cache";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createGoogleUser(user: Omit<InsertUser, 'password'>): Promise<User>;
  linkGoogleAccount(userId: number, googleId: string): Promise<User>;
  updateLastLogin(userId: number): Promise<void>;
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  
  // User preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Meal plan methods
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  getUserMealPlans(userId: number): Promise<MealPlan[]>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined>;
  deleteMealPlan(id: number): Promise<boolean>;
  
  // Recipe methods
  getRecipe(id: number): Promise<Recipe | undefined>;
  getAllRecipes(): Promise<Recipe[]>;
  searchRecipes(query: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  
  // Grocery list methods
  getGroceryList(id: number): Promise<GroceryList | undefined>;
  getUserGroceryLists(userId: number): Promise<GroceryList[]>;
  createGroceryList(groceryList: InsertGroceryList): Promise<GroceryList>;
  updateGroceryList(id: number, groceryList: Partial<InsertGroceryList>): Promise<GroceryList | undefined>;
  deleteGroceryList(id: number): Promise<boolean>;
  
  // User favorites methods
  getUserFavorites(userId: number): Promise<Recipe[]>;
  addFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeFavorite(userId: number, recipeId: number): Promise<boolean>;
  
  // Stats methods
  getUserStats(userId: number): Promise<{
    activePlans: number;
    favoriteRecipes: number;
    groceryLists: number;
  }>;
  
  // Pantry methods
  getPantryItem(id: number): Promise<PantryItem | undefined>;
  getUserPantryItems(userId: number): Promise<PantryItem[]>;
  createPantryItem(pantryItem: InsertPantryItem): Promise<PantryItem>;
  updatePantryItem(id: number, pantryItem: Partial<InsertPantryItem>): Promise<PantryItem | undefined>;
  deletePantryItem(id: number): Promise<boolean>;
  
  // Grocery order methods
  getGroceryOrder(id: number): Promise<GroceryOrder | undefined>;
  getUserGroceryOrders(userId: number): Promise<GroceryOrder[]>;
  createGroceryOrder(order: InsertGroceryOrder): Promise<GroceryOrder>;
  updateGroceryOrder(id: number, order: Partial<InsertGroceryOrder>): Promise<GroceryOrder | undefined>;
  
  // Smart grocery list generation that considers pantry inventory
  generateSmartGroceryList(userId: number, requiredIngredients: string[]): Promise<{
    itemsToOrder: Array<{ name: string; quantity: string; category: string }>;
    pantryItems: Array<{ name: string; quantity: number; unit: string }>;
  }>;

  // Admin methods
  // User management
  getAllUsers(search?: string, role?: string, isActive?: boolean): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  toggleUserStatus(id: number): Promise<User | undefined>;
  
  // System logs
  getSystemLogs(level?: string, source?: string, limit?: number): Promise<SystemLog[]>;
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  
  // AI configurations
  getAiConfigurations(): Promise<AiConfiguration[]>;
  getAiConfiguration(id: number): Promise<AiConfiguration | undefined>;
  createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration>;
  updateAiConfiguration(id: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined>;
  deleteAiConfiguration(id: number): Promise<boolean>;
  
  // Grocery partners
  getGroceryPartners(): Promise<GroceryPartner[]>;
  getGroceryPartner(id: number): Promise<GroceryPartner | undefined>;
  createGroceryPartner(partner: InsertGroceryPartner): Promise<GroceryPartner>;
  updateGroceryPartner(id: number, partner: Partial<InsertGroceryPartner>): Promise<GroceryPartner | undefined>;
  deleteGroceryPartner(id: number): Promise<boolean>;
  
  // System metrics
  recordSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;
  getSystemMetrics(metricName?: string, fromDate?: Date, toDate?: Date): Promise<SystemMetric[]>;
  
  // Push notification methods
  getDeviceToken(token: string): Promise<DeviceToken | undefined>;
  getActiveDeviceTokens(userId: number): Promise<DeviceToken[]>;
  createDeviceToken(deviceToken: InsertDeviceToken): Promise<DeviceToken>;
  updateDeviceToken(token: string, updates: Partial<InsertDeviceToken>): Promise<DeviceToken | undefined>;
  deactivateDeviceToken(token: string): Promise<void>;
  deleteDeviceToken(token: string): Promise<boolean>;
  
  // Notification history methods
  getNotificationHistory(userId: number, limit?: number): Promise<NotificationHistory[]>;
  createNotificationHistory(notification: InsertNotificationHistory): Promise<NotificationHistory>;
  updateNotificationStatus(id: number, status: string): Promise<void>;
  
  // User notification settings
  getUserNotificationSettings(userId: number): Promise<UserNotificationSettings | undefined>;
  createUserNotificationSettings(settings: InsertUserNotificationSettings): Promise<UserNotificationSettings>;
  updateUserNotificationSettings(userId: number, settings: Partial<InsertUserNotificationSettings>): Promise<UserNotificationSettings | undefined>;
  
  // Meal plan notification helpers
  getUsersWithActiveMealPlans(): Promise<Array<{ user: User; mealPlan: MealPlan }>>;

  // Analytics
  getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalMealPlans: number;
    totalOrders: number;
    recentErrors: number;
  }>;

  // Social Media / Discover Methods - "Spotify for Meals"
  getTrendingMealPlans(): Promise<any[]>;
  getTrendingRecipes(): Promise<any[]>;
  getFriendActivity(userId: number): Promise<any[]>;
  getNearbyTrending(userId: number): Promise<any[]>;
  
  // Social interactions
  likeRecipe(userId: number, recipeId: number): Promise<void>;
  likeMealPlan(userId: number, mealPlanId: number): Promise<void>;
  followUser(followerId: number, followingId: number): Promise<void>;
  shareContent(userId: number, contentType: string, contentId: number, platform: string): Promise<void>;
  copyMealPlanToUser(userId: number, mealPlanId: number): Promise<MealPlan>;
}

// Use existing database connection to avoid circular references

export class DatabaseStorage implements IStorage {

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password!, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0];
  }

  async createGoogleUser(userData: Omit<InsertUser, 'password'>): Promise<User> {
    const result = await db.insert(users).values({
      ...userData,
      authProvider: 'google',
    }).returning();
    return result[0];
  }

  async linkGoogleAccount(userId: number, googleId: string): Promise<User> {
    const result = await db.update(users)
      .set({ 
        googleId: googleId,
        authProvider: 'google',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    return result[0];
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const result = await db.insert(userPreferences).values(preferences).returning();
    return result[0];
  }

  async updateUserPreferences(userId: number, preferences: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const result = await db.update(userPreferences)
      .set(preferences)
      .where(eq(userPreferences.userId, userId))
      .returning();
    return result[0];
  }

  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    // Query using only existing database columns
    const result = await db.execute(sql`
      SELECT id, user_id, name, description, meals, created_at, 
             is_active, duration, diet_type
      FROM meal_plans 
      WHERE id = ${id}
      LIMIT 1
    `);
    if (result.rows.length === 0) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id as number,
      userId: row.user_id as number,
      name: row.name as string,
      description: row.description as string | null,
      meals: row.meals,
      createdAt: new Date(row.created_at as string),
      isActive: row.is_active as boolean | null,
      duration: row.duration as number | null,
      dietType: row.diet_type as string | null,
      startDate: null,
      endDate: null
    };
  }

  async getUserMealPlans(userId: number): Promise<MealPlan[]> {
    // Query using actual database column names
    const result = await db.execute(sql`
      SELECT id, user_id as "userId", name, description, meals, created_at as "createdAt", 
             is_active as "isActive", duration, diet_type as "dietType",
             null as "startDate", null as "endDate"
      FROM meal_plans 
      WHERE user_id = ${userId}
    `);
    return result.rows.map(row => ({
      id: row.id as number,
      userId: row.userId as number,
      name: row.name as string,
      description: row.description as string | null,
      meals: row.meals,
      createdAt: new Date(row.createdAt as string),
      isActive: row.isActive as boolean | null,
      duration: row.duration as number | null,
      dietType: row.dietType as string | null,
      startDate: null,
      endDate: null
    }));
  }

  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const result = await db.insert(mealPlans).values(mealPlan).returning();
    return result[0];
  }

  async updateMealPlan(id: number, mealPlan: Partial<InsertMealPlan>): Promise<MealPlan | undefined> {
    // Update only the meals column and return the updated record
    if (mealPlan.meals) {
      const result = await db.execute(sql`
        UPDATE meal_plans 
        SET meals = ${JSON.stringify(mealPlan.meals)}
        WHERE id = ${id}
        RETURNING id, user_id, name, description, meals, created_at, 
                  is_active, duration, diet_type
      `);
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id as number,
        userId: row.user_id as number,
        name: row.name as string,
        description: row.description as string | null,
        meals: row.meals,
        createdAt: new Date(row.created_at as string),
        isActive: row.is_active as boolean | null,
        duration: row.duration as number | null,
        dietType: row.diet_type as string | null,
        startDate: null,
        endDate: null
      };
    }
    
    return undefined;
  }

  async deleteMealPlan(id: number): Promise<boolean> {
    try {
      const result = await db.execute(sql`
        DELETE FROM meal_plans WHERE id = ${id}
        RETURNING id
      `);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Meal plan deletion error:', error);
      throw error;
    }
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const result = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1);
    return result[0];
  }

  async getAllRecipes(): Promise<Recipe[]> {
    // Query using actual database column names
    const result = await db.execute(sql`
      SELECT id, name, description, cuisine, tags, ingredients, instructions, 
             prep_time as "prepTime", cook_time as "cookTime", servings, 
             difficulty, nutrition, created_at as "createdAt",
             null as "userId"
      FROM recipes
    `);
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      cuisine: row.cuisine as string | null,
      tags: row.tags as string[] | null,
      ingredients: row.ingredients,
      instructions: row.instructions,
      prepTime: row.prepTime as number | null,
      cookTime: row.cookTime as number | null,
      servings: row.servings as number | null,
      difficulty: row.difficulty as string | null,
      nutrition: row.nutrition,
      createdAt: new Date(row.createdAt as string),
      userId: null
    }));
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    // Query using actual database column names  
    const result = await db.execute(sql`
      SELECT id, name, description, cuisine, tags, ingredients, instructions, 
             prep_time as "prepTime", cook_time as "cookTime", servings, 
             difficulty, nutrition, created_at as "createdAt",
             null as "userId"
      FROM recipes
      WHERE name ILIKE ${`%${query}%`}
    `);
    return result.rows.map(row => ({
      id: row.id as number,
      name: row.name as string,
      description: row.description as string | null,
      cuisine: row.cuisine as string | null,
      tags: row.tags as string[] | null,
      ingredients: row.ingredients,
      instructions: row.instructions,
      prepTime: row.prepTime as number | null,
      cookTime: row.cookTime as number | null,
      servings: row.servings as number | null,
      difficulty: row.difficulty as string | null,
      nutrition: row.nutrition,
      createdAt: new Date(row.createdAt as string),
      userId: null
    }));
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const result = await db.insert(recipes).values(recipe).returning();
    return result[0];
  }

  async getGroceryList(id: number): Promise<GroceryList | undefined> {
    const result = await db.select().from(groceryLists).where(eq(groceryLists.id, id)).limit(1);
    return result[0];
  }

  async getUserGroceryLists(userId: number): Promise<GroceryList[]> {
    return await db.select().from(groceryLists).where(eq(groceryLists.userId, userId));
  }

  async createGroceryList(groceryList: InsertGroceryList): Promise<GroceryList> {
    const result = await db.insert(groceryLists).values(groceryList).returning();
    return result[0];
  }

  async updateGroceryList(id: number, groceryList: Partial<InsertGroceryList>): Promise<GroceryList | undefined> {
    const result = await db.update(groceryLists)
      .set(groceryList)
      .where(eq(groceryLists.id, id))
      .returning();
    return result[0];
  }

  async deleteGroceryList(id: number): Promise<boolean> {
    const result = await db.delete(groceryLists).where(eq(groceryLists.id, id)).returning();
    return result.length > 0;
  }

  async getUserFavorites(userId: number): Promise<Recipe[]> {
    try {
      const result = await db.execute(sql`
        SELECT DISTINCT r.id, r.name, r.description, r.cuisine, r.tags, r.ingredients, r.instructions, 
               r.prep_time as "prepTime", r.cook_time as "cookTime", r.servings, 
               r.difficulty, r.nutrition, r.created_at as "createdAt",
               null as "userId"
        FROM user_favorites uf
        INNER JOIN recipes r ON uf.recipe_id = r.id
        WHERE uf.user_id = ${userId}
        ORDER BY r.created_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id as number,
        name: row.name as string,
        description: row.description as string | null,
        cuisine: row.cuisine as string | null,
        tags: row.tags as string[] | null,
        ingredients: row.ingredients,
        instructions: row.instructions,
        prepTime: row.prepTime as number | null,
        cookTime: row.cookTime as number | null,
        servings: row.servings as number | null,
        difficulty: row.difficulty as string | null,
        nutrition: row.nutrition,
        createdAt: new Date(row.createdAt as string),
        userId: null
      }));
    } catch (error) {
      console.error('Favorites fetch error:', error);
      throw error;
    }
  }

  async addFavorite(favorite: InsertUserFavorite): Promise<UserFavorite> {
    // Check if favorite already exists to prevent duplicates
    const existing = await db.select()
      .from(userFavorites)
      .where(and(
        eq(userFavorites.userId, favorite.userId),
        eq(userFavorites.recipeId, favorite.recipeId)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0]; // Return existing favorite instead of creating duplicate
    }
    
    const result = await db.insert(userFavorites).values(favorite).returning();
    return result[0];
  }

  async removeFavorite(userId: number, recipeId: number): Promise<boolean> {
    const result = await db.delete(userFavorites)
      .where(and(eq(userFavorites.userId, userId), eq(userFavorites.recipeId, recipeId)))
      .returning();
    return result.length > 0;
  }

  async getUserStats(userId: number): Promise<{
    activePlans: number;
    favoriteRecipes: number;
    groceryLists: number;
  }> {
    // Fixed query to only select basic columns without missing social columns
    const activePlans = await db.select({ id: mealPlans.id }).from(mealPlans).where(eq(mealPlans.userId, userId));
    const favoriteRecipes = await db.select({ id: userFavorites.id }).from(userFavorites).where(eq(userFavorites.userId, userId));
    const groceryListsCount = await db.select({ id: groceryLists.id }).from(groceryLists).where(eq(groceryLists.userId, userId));
    
    return {
      activePlans: activePlans.length,
      favoriteRecipes: favoriteRecipes.length,
      groceryLists: groceryListsCount.length,
    };
  }

  // Pantry methods implementation
  async getPantryItem(id: number): Promise<PantryItem | undefined> {
    const result = await db.select().from(pantryItems).where(eq(pantryItems.id, id)).limit(1);
    return result[0];
  }

  async getUserPantryItems(userId: number): Promise<PantryItem[]> {
    return await db.select().from(pantryItems).where(eq(pantryItems.userId, userId));
  }

  async createPantryItem(pantryItem: InsertPantryItem): Promise<PantryItem> {
    const result = await db.insert(pantryItems).values(pantryItem).returning();
    return result[0];
  }

  async updatePantryItem(id: number, pantryItem: Partial<InsertPantryItem>): Promise<PantryItem | undefined> {
    const result = await db.update(pantryItems)
      .set({ ...pantryItem, updatedAt: new Date() })
      .where(eq(pantryItems.id, id))
      .returning();
    return result[0];
  }

  async deletePantryItem(id: number): Promise<boolean> {
    const result = await db.delete(pantryItems).where(eq(pantryItems.id, id));
    return result.rowCount > 0;
  }

  // Grocery order methods implementation
  async getGroceryOrder(id: number): Promise<GroceryOrder | undefined> {
    const result = await db.select().from(groceryOrders).where(eq(groceryOrders.id, id)).limit(1);
    return result[0];
  }

  async getUserGroceryOrders(userId: number): Promise<GroceryOrder[]> {
    return await db.select().from(groceryOrders).where(eq(groceryOrders.userId, userId));
  }

  async createGroceryOrder(order: InsertGroceryOrder): Promise<GroceryOrder> {
    const result = await db.insert(groceryOrders).values(order).returning();
    return result[0];
  }

  async updateGroceryOrder(id: number, order: Partial<InsertGroceryOrder>): Promise<GroceryOrder | undefined> {
    const result = await db.update(groceryOrders)
      .set(order)
      .where(eq(groceryOrders.id, id))
      .returning();
    return result[0];
  }

  // Smart grocery list generation that considers pantry inventory
  async generateSmartGroceryList(userId: number, requiredIngredients: string[]): Promise<{
    itemsToOrder: Array<{ name: string; quantity: string; category: string }>;
    pantryItems: Array<{ name: string; quantity: number; unit: string }>;
  }> {
    // Get user's pantry items
    const pantryInventory = await this.getUserPantryItems(userId);
    
    // Categorize ingredients
    const categories: { [key: string]: string } = {
      'chicken': 'proteins',
      'beef': 'proteins',
      'fish': 'proteins',
      'eggs': 'proteins',
      'milk': 'dairy',
      'cheese': 'dairy',
      'yogurt': 'dairy',
      'butter': 'dairy',
      'rice': 'grains',
      'pasta': 'grains',
      'bread': 'grains',
      'flour': 'pantry',
      'sugar': 'pantry',
      'salt': 'pantry',
      'pepper': 'pantry',
      'oil': 'pantry',
      'onion': 'vegetables',
      'garlic': 'vegetables',
      'tomato': 'vegetables',
      'potato': 'vegetables',
      'carrot': 'vegetables',
      'broccoli': 'vegetables',
      'spinach': 'vegetables',
      'apple': 'fruits',
      'banana': 'fruits',
      'orange': 'fruits'
    };

    const itemsToOrder: Array<{ name: string; quantity: string; category: string }> = [];
    const availablePantryItems: Array<{ name: string; quantity: number; unit: string }> = [];

    // Check each required ingredient against pantry inventory
    for (const ingredient of requiredIngredients) {
      const ingredientLower = ingredient.toLowerCase();
      const pantryItem = pantryInventory.find(item => 
        item.itemName.toLowerCase().includes(ingredientLower) || 
        ingredientLower.includes(item.itemName.toLowerCase())
      );

      if (pantryItem && pantryItem.quantity > 0) {
        // Item is available in pantry
        availablePantryItems.push({
          name: pantryItem.itemName,
          quantity: pantryItem.quantity,
          unit: pantryItem.unit
        });
      } else {
        // Item needs to be ordered
        const category = categories[ingredientLower] || 'other';
        itemsToOrder.push({
          name: ingredient,
          quantity: '1',
          category
        });
      }
    }

    return {
      itemsToOrder,
      pantryItems: availablePantryItems
    };
  }

  // Admin methods implementation
  async getAllUsers(search?: string, role?: string, isActive?: boolean): Promise<User[]> {
    const cacheKey = `admin:users:${search || ''}:${role || ''}:${isActive?.toString() || ''}`;
    const cached = cache.get<User[]>(cacheKey);
    if (cached) return cached;

    let query = db.select().from(users);
    const conditions = [];
    
    if (search) {
      conditions.push(
        like(users.email, `%${search}%`),
        like(users.username, `%${search}%`),
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`)
      );
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }
    if (isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(users.createdAt);
    cache.set(cacheKey, result, 20000); // Cache for 20 seconds
    return result;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async toggleUserStatus(id: number): Promise<User | undefined> {
    const currentUser = await this.getUser(id);
    if (!currentUser) return undefined;
    
    const result = await db.update(users)
      .set({ isActive: !currentUser.isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getSystemLogs(level?: string, source?: string, limit = 100): Promise<SystemLog[]> {
    const cacheKey = `admin:logs:${level || ''}:${source || ''}:${limit}`;
    const cached = cache.get<SystemLog[]>(cacheKey);
    if (cached) return cached;

    let query = db.select().from(systemLogs);
    const conditions = [];
    
    if (level) {
      conditions.push(eq(systemLogs.level, level));
    }
    if (source) {
      conditions.push(eq(systemLogs.source, source));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query.orderBy(systemLogs.createdAt).limit(limit);
    cache.set(cacheKey, result, 10000); // Cache for 10 seconds (logs change frequently)
    return result;
  }

  async createSystemLog(log: InsertSystemLog): Promise<SystemLog> {
    const result = await db.insert(systemLogs).values(log).returning();
    return result[0];
  }

  async getAiConfigurations(): Promise<AiConfiguration[]> {
    const cacheKey = 'admin:ai-configs';
    const cached = cache.get<AiConfiguration[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(aiConfigurations).orderBy(aiConfigurations.name);
    cache.set(cacheKey, result, 30000); // Cache for 30 seconds
    return result;
  }

  async getAiConfiguration(id: number): Promise<AiConfiguration | undefined> {
    const result = await db.select().from(aiConfigurations).where(eq(aiConfigurations.id, id)).limit(1);
    return result[0];
  }

  async createAiConfiguration(config: InsertAiConfiguration): Promise<AiConfiguration> {
    const result = await db.insert(aiConfigurations).values(config).returning();
    return result[0];
  }

  async updateAiConfiguration(id: number, config: Partial<InsertAiConfiguration>): Promise<AiConfiguration | undefined> {
    const result = await db.update(aiConfigurations)
      .set({ ...config, updatedAt: new Date() })
      .where(eq(aiConfigurations.id, id))
      .returning();
    return result[0];
  }

  async deleteAiConfiguration(id: number): Promise<boolean> {
    const result = await db.delete(aiConfigurations).where(eq(aiConfigurations.id, id));
    return result.rowCount > 0;
  }

  async getGroceryPartners(): Promise<GroceryPartner[]> {
    const cacheKey = 'admin:grocery-partners';
    const cached = cache.get<GroceryPartner[]>(cacheKey);
    if (cached) return cached;

    const result = await db.select().from(groceryPartners).orderBy(groceryPartners.name);
    cache.set(cacheKey, result, 30000); // Cache for 30 seconds
    return result;
  }

  async getGroceryPartner(id: number): Promise<GroceryPartner | undefined> {
    const result = await db.select().from(groceryPartners).where(eq(groceryPartners.id, id)).limit(1);
    return result[0];
  }

  async createGroceryPartner(partner: InsertGroceryPartner): Promise<GroceryPartner> {
    const result = await db.insert(groceryPartners).values(partner).returning();
    return result[0];
  }

  async updateGroceryPartner(id: number, partner: Partial<InsertGroceryPartner>): Promise<GroceryPartner | undefined> {
    const result = await db.update(groceryPartners)
      .set({ ...partner, updatedAt: new Date() })
      .where(eq(groceryPartners.id, id))
      .returning();
    return result[0];
  }

  async deleteGroceryPartner(id: number): Promise<boolean> {
    const result = await db.delete(groceryPartners).where(eq(groceryPartners.id, id));
    return result.rowCount > 0;
  }

  async recordSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric> {
    const result = await db.insert(systemMetrics).values(metric).returning();
    return result[0];
  }

  async getSystemMetrics(metricName?: string, fromDate?: Date, toDate?: Date): Promise<SystemMetric[]> {
    let query = db.select().from(systemMetrics);
    const conditions = [];
    
    if (metricName) {
      conditions.push(eq(systemMetrics.metricName, metricName));
    }
    if (fromDate) {
      conditions.push(like(systemMetrics.recordedAt, `${fromDate.toISOString().split('T')[0]}%`));
    }
    if (toDate) {
      conditions.push(like(systemMetrics.recordedAt, `%${toDate.toISOString().split('T')[0]}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(systemMetrics.recordedAt);
  }

  async getSystemAnalytics(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalMealPlans: number;
    totalOrders: number;
    recentErrors: number;
  }> {
    const cacheKey = 'admin:analytics';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    // Run optimized parallel queries instead of sequential
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Optimized count-only queries for instant response
    try {
      const [usersCount, activeUsersCount, mealPlansCount, ordersCount, errorsCount] = await Promise.all([
        db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users),
        db.select({ count: sql<number>`cast(count(*) as integer)` }).from(users).where(eq(users.isActive, true)),
        db.select({ count: sql<number>`cast(count(*) as integer)` }).from(mealPlans),
        db.select({ count: sql<number>`cast(count(*) as integer)` }).from(groceryOrders),
        db.select({ count: sql<number>`cast(count(*) as integer)` }).from(systemLogs)
          .where(and(
            eq(systemLogs.level, 'error'),
            gte(systemLogs.createdAt, yesterday)
          ))
      ]);

      const result = {
        totalUsers: usersCount[0]?.count || 0,
        activeUsers: activeUsersCount[0]?.count || 0,
        totalMealPlans: mealPlansCount[0]?.count || 0,
        totalOrders: ordersCount[0]?.count || 0,
        recentErrors: errorsCount[0]?.count || 0
      };

      cache.set(cacheKey, result, 15000); // Cache for 15 seconds
      return result;
    } catch (error) {
      console.error('Analytics query failed:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalMealPlans: 0,
        totalOrders: 0,
        recentErrors: 0
      };
    }
  }

  // Push notification methods
  async getDeviceToken(token: string): Promise<DeviceToken | undefined> {
    const [deviceToken] = await db.select().from(deviceTokens).where(eq(deviceTokens.token, token));
    return deviceToken || undefined;
  }

  async getActiveDeviceTokens(userId: number): Promise<DeviceToken[]> {
    return await db.select().from(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));
  }

  async createDeviceToken(deviceToken: InsertDeviceToken): Promise<DeviceToken> {
    // First, check if token already exists and update it
    const existing = await this.getDeviceToken(deviceToken.token);
    if (existing) {
      const updated = await this.updateDeviceToken(deviceToken.token, {
        userId: deviceToken.userId,
        platform: deviceToken.platform,
        isActive: true
      });
      return updated!;
    }

    const [created] = await db.insert(deviceTokens).values(deviceToken).returning();
    return created;
  }

  async updateDeviceToken(token: string, updates: Partial<InsertDeviceToken>): Promise<DeviceToken | undefined> {
    const [updated] = await db.update(deviceTokens)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(deviceTokens.token, token))
      .returning();
    return updated || undefined;
  }

  async deactivateDeviceToken(token: string): Promise<void> {
    await db.update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.token, token));
  }

  async deleteDeviceToken(token: string): Promise<boolean> {
    const result = await db.delete(deviceTokens).where(eq(deviceTokens.token, token));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Notification history methods
  async getNotificationHistory(userId: number, limit = 50): Promise<NotificationHistory[]> {
    return await db.select().from(notificationHistory)
      .where(eq(notificationHistory.userId, userId))
      .orderBy(sql`${notificationHistory.sentAt} DESC`)
      .limit(limit);
  }

  async createNotificationHistory(notification: InsertNotificationHistory): Promise<NotificationHistory> {
    const [created] = await db.insert(notificationHistory).values(notification).returning();
    return created;
  }

  async updateNotificationStatus(id: number, status: string): Promise<void> {
    await db.update(notificationHistory)
      .set({ status })
      .where(eq(notificationHistory.id, id));
  }

  // User notification settings
  async getUserNotificationSettings(userId: number): Promise<UserNotificationSettings | undefined> {
    const [settings] = await db.select().from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, userId));
    return settings || undefined;
  }

  async createUserNotificationSettings(settings: InsertUserNotificationSettings): Promise<UserNotificationSettings> {
    const [created] = await db.insert(userNotificationSettings).values(settings).returning();
    return created;
  }

  async updateUserNotificationSettings(userId: number, settings: Partial<InsertUserNotificationSettings>): Promise<UserNotificationSettings | undefined> {
    const [updated] = await db.update(userNotificationSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(userNotificationSettings.userId, userId))
      .returning();
    return updated || undefined;
  }

  // Meal plan notification helpers
  async getUsersWithActiveMealPlans(): Promise<Array<{ user: User; mealPlan: MealPlan }>> {
    const result = await db.select({
      user: users,
      mealPlan: mealPlans
    })
    .from(users)
    .innerJoin(mealPlans, and(
      eq(mealPlans.userId, users.id),
      eq(mealPlans.isActive, true)
    ))
    .where(eq(users.isActive, true));

    return result;
  }

  // Cooking sessions and steps
  async getCookingStepsByRecipe(recipeId: number): Promise<CookingStep[]> {
    return await db.select().from(cookingSteps)
      .where(eq(cookingSteps.recipeId, recipeId))
      .orderBy(cookingSteps.stepNumber);
  }

  async createCookingSteps(steps: InsertCookingStep[]): Promise<CookingStep[]> {
    return await db.insert(cookingSteps).values(steps).returning();
  }

  async createCookingSession(session: InsertCookingSession): Promise<CookingSession> {
    const [created] = await db.insert(cookingSessions).values(session).returning();
    return created;
  }

  async getCookingSession(sessionId: number): Promise<CookingSession | undefined> {
    const [session] = await db.select().from(cookingSessions)
      .where(eq(cookingSessions.id, sessionId));
    return session || undefined;
  }

  async updateCookingSession(sessionId: number, updates: Partial<InsertCookingSession>): Promise<CookingSession | null> {
    const [updated] = await db.update(cookingSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cookingSessions.id, sessionId))
      .returning();
    return updated || null;
  }

  async getUserCookingSessions(userId: number): Promise<CookingSession[]> {
    return await db.select().from(cookingSessions)
      .where(eq(cookingSessions.userId, userId))
      .orderBy(sql`${cookingSessions.createdAt} DESC`);
  }

  async getActiveCookingSessions(): Promise<CookingSession[]> {
    return await db.select().from(cookingSessions)
      .where(eq(cookingSessions.status, 'active'));
  }

  async deleteCookingSession(sessionId: number): Promise<boolean> {
    const result = await db.delete(cookingSessions)
      .where(eq(cookingSessions.id, sessionId));
    return (result.rowCount || 0) > 0;
  }

  // Social Media / Discover Methods - "Spotify for Meals"
  async getTrendingMealPlans(): Promise<any[]> {
    // Return actual meal plans from database with social engagement mock data
    try {
      const result = await db.execute(sql`
        SELECT mp.id, mp.name, mp.description, mp.diet_type, mp.duration, mp.meals, u.username 
        FROM meal_plans mp
        JOIN users u ON mp.user_id = u.id
        WHERE mp.id IN (2, 3, 13, 14, 15, 16, 17)
        ORDER BY mp.id
      `);

    const socialData = [
        {
          likesCount: 456,
          sharesCount: 67,
          tags: ["balanced", "healthy", "quick", "nutritious"],
          imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
          author: {
            username: "nutrition_pro",
            displayName: "Nutrition Pro",
            avatarUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100"
          },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 623,
          sharesCount: 89,
          tags: ["vegan", "plant-based", "healthy", "sustainable"],
          imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
          author: {
            username: "plant_lover",
            displayName: "Plant Lover",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
          },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 1247,
          sharesCount: 183,
          tags: ["mediterranean", "healthy", "seafood", "olive-oil"],
          imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
          author: {
            username: "chef_maria",
            displayName: "Chef Maria",
            avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b812c9ec?w=100"
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 934,
          sharesCount: 156,
          tags: ["asian", "fusion", "spicy", "innovative"],
          imageUrl: "https://images.unsplash.com/photo-1559847844-d721426d6d2d?w=400",
          author: {
            username: "chef_kevin",
            displayName: "Chef Kevin Wong",
            avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
          },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 782,
          sharesCount: 124,
          tags: ["comfort-food", "hearty", "family", "classic"],
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
          author: {
            username: "homecook_sarah",
            displayName: "Sarah's Kitchen",
            avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 567,
          sharesCount: 78,
          tags: ["vegan", "plant-based", "energizing", "nutrient-dense"],
          imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
          author: {
            username: "healthy_hannah",
            displayName: "Hannah Green",
            avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b812c9ec?w=100"
          },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          likesCount: 423,
          sharesCount: 91,
          tags: ["quick", "easy", "weeknight", "30-minute"],
          imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
          author: {
            username: "quick_cook",
            displayName: "Quick Cook",
            avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100"
          },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return result.rows.map((plan: any, index: number) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        cuisine: plan.diet_type,
        duration: plan.duration,
        meals: plan.meals,
        ...socialData[index]
      }));
    } catch (error) {
      console.error('Error fetching trending meal plans:', error);
      return [];
    }
  }

  async getTrendingRecipes(): Promise<any[]> {
    // Get actual recipes from database and enhance with trending metadata
    const recipes = await this.getAllRecipes();
    
    // Map to actual recipe IDs to fix the mismatch issue
    const trendingEnhancements = [
      {
        recipeId: 9, // Chicken Tikka Masala
        likesCount: 2341,
        author: {
          username: "spice_master",
          displayName: "Priya Patel",
          avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100"
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        recipeId: 7, // Beef Tacos
        likesCount: 1876,
        author: {
          username: "taco_lover",
          displayName: "Maria Rodriguez",
          avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100"
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        recipeId: 5, // Chocolate Chip Cookies
        likesCount: 3456,
        author: {
          username: "dessert_queen",
          displayName: "Chef Amelie",
          avatarUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100"
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Return actual recipe data with trending enhancements
    const result = trendingEnhancements.map(trending => {
      const recipe = recipes.find(r => r.id === trending.recipeId);
      if (!recipe) return null;
      
      return {
        ...recipe,
        likesCount: trending.likesCount,
        author: trending.author,
        createdAt: trending.createdAt,
        difficulty: recipe.difficulty || "medium",
        cuisine: this.determineCuisine(recipe.tags || [])
      };
    }).filter(Boolean);
    
    console.log('Trending recipes returning:', result.map(r => ({ id: r.id, name: r.name })));
    return result;
  }

  private determineCuisine(tags: string[]): string {
    if (tags.includes("indian")) return "Indian";
    if (tags.includes("mexican")) return "Mexican";
    if (tags.includes("dessert")) return "American";
    if (tags.includes("thai")) return "Thai";
    if (tags.includes("italian")) return "Italian";
    return "International";
  }

  async getFriendActivity(userId: number): Promise<any[]> {
    // Generate mock friend activity data
    return [
      {
        id: 1,
        user: {
          username: "mike_foodie",
          displayName: "Mike Johnson",
          avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
        },
        activityType: "liked",
        targetType: "recipe",
        targetId: 5,
        targetName: "Spicy Thai Basil Chicken",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        user: {
          username: "jenny_cooks",
          displayName: "Jennifer Adams",
          avatarUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100"
        },
        activityType: "shared",
        targetType: "meal_plan",
        targetId: 3,
        targetName: "Keto Week Challenge",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        user: {
          username: "chef_carlos",
          displayName: "Carlos Rodriguez",
          avatarUrl: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=100"
        },
        activityType: "created",
        targetType: "recipe",
        targetId: 12,
        targetName: "Authentic Paella Valenciana",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        user: {
          username: "healthy_hannah",
          displayName: "Hannah Green",
          avatarUrl: "https://images.unsplash.com/photo-1494790108755-2616b812c9ec?w=100"
        },
        activityType: "completed",
        targetType: "meal_plan",
        targetId: 7,
        targetName: "Plant-Based Power Week",
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  async getNearbyTrending(userId: number): Promise<any[]> {
    // Generate mock location-based trending content
    return [
      {
        id: 1,
        type: "recipe",
        name: "New York Style Pizza",
        description: "Authentic thin-crust pizza with the perfect char",
        location: "New York, NY",
        distance: "2.3 miles",
        trendingScore: 95,
        tags: ["pizza", "new-york", "authentic"],
        author: {
          username: "brooklyn_baker",
          displayName: "Tony's Pizzeria",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
        }
      },
      {
        id: 2,
        type: "meal_plan",
        name: "Local Farmer's Market Week",
        description: "Fresh, seasonal ingredients from nearby farms",
        location: "Local Area",
        distance: "1.1 miles",
        trendingScore: 87,
        tags: ["local", "seasonal", "farm-fresh"],
        author: {
          username: "farm_fresh_jenny",
          displayName: "Jenny's Farm Kitchen",
          avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
        }
      }
    ];
  }

  async likeRecipe(userId: number, recipeId: number): Promise<void> {
    try {
      await db.insert(recipeLikes).values({
        userId,
        recipeId
      }).onConflictDoNothing();

      // Track user activity
      await db.insert(userActivity).values({
        userId,
        activityType: 'liked',
        targetType: 'recipe',
        targetId: recipeId
      });
    } catch (error) {
      console.error('Error liking recipe:', error);
    }
  }

  async likeMealPlan(userId: number, mealPlanId: number): Promise<void> {
    try {
      await db.insert(mealPlanLikes).values({
        userId,
        mealPlanId
      }).onConflictDoNothing();

      // Track user activity
      await db.insert(userActivity).values({
        userId,
        activityType: 'liked',
        targetType: 'meal_plan',
        targetId: mealPlanId
      });
    } catch (error) {
      console.error('Error liking meal plan:', error);
    }
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    try {
      await db.insert(userFollows).values({
        followerId,
        followingId
      }).onConflictDoNothing();

      // Track user activity
      await db.insert(userActivity).values({
        userId: followerId,
        activityType: 'followed',
        targetType: 'user',
        targetId: followingId
      });
    } catch (error) {
      console.error('Error following user:', error);
    }
  }

  async shareContent(userId: number, contentType: string, contentId: number, platform: string): Promise<void> {
    try {
      await db.insert(socialShares).values({
        userId,
        contentType,
        contentId,
        platform,
        shareUrl: `https://app.example.com/${contentType}/${contentId}`
      });

      // Track user activity
      await db.insert(userActivity).values({
        userId,
        activityType: 'shared',
        targetType: contentType,
        targetId: contentId
      });
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  async copyMealPlanToUser(userId: number, mealPlanId: number): Promise<MealPlan> {
    try {
      // Get the original meal plan using raw SQL to avoid column name issues
      const originalPlan = await db.execute(sql`
        SELECT * FROM meal_plans WHERE id = ${mealPlanId}
      `);

      if (!originalPlan.rows[0]) {
        throw new Error('Meal plan not found');
      }

      const plan = originalPlan.rows[0] as any;

      // Convert meals to JSON string for proper JSONB insertion
      const mealsJson = typeof plan.meals === 'string' ? plan.meals : JSON.stringify(plan.meals);

      // Create a copy using raw SQL with proper JSONB handling - set as active by default
      const copiedPlan = await db.execute(sql`
        INSERT INTO meal_plans (user_id, name, description, diet_type, duration, meals, is_active)
        VALUES (${userId}, ${plan.name + ' (Copy)'}, ${plan.description}, ${plan.diet_type}, ${plan.duration}, ${mealsJson}, true)
        RETURNING *
      `);

      // Track user activity - this table may not exist, so wrap in try-catch
      try {
        await db.insert(userActivity).values({
          userId,
          activityType: 'copied',
          targetType: 'meal-plan',
          targetId: mealPlanId
        });
      } catch (activityError) {
        console.log('User activity tracking not available:', activityError);
      }

      return copiedPlan.rows[0] as MealPlan;
    } catch (error) {
      console.error('Error copying meal plan:', error);
      throw error;
    }
  }

  // Friend discovery and following methods
  async getFriendActivity(userId: number): Promise<any[]> {
    try {
      // Get activity from users that the current user follows
      const result = await db.execute(sql`
        SELECT 
          ROW_NUMBER() OVER (ORDER BY mp.created_at DESC) as id,
          u.username,
          u.email,
          'created' as activity_type,
          'meal_plan' as target_type,
          mp.id as target_id,
          mp.name as target_name,
          mp.created_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.following_id
        JOIN meal_plans mp ON mp.user_id = u.id
        WHERE uf.follower_id = ${userId}
        ORDER BY mp.created_at DESC
        LIMIT 20
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        user: {
          username: row.username,
          displayName: row.username,
          avatarUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100`
        },
        activityType: row.activity_type,
        targetType: row.target_type,
        targetId: row.target_id,
        targetName: row.target_name,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error fetching friend activity:', error);
      return [];
    }
  }

  async searchUsers(query: string, currentUserId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.username,
          u.email,
          CASE 
            WHEN uf.id IS NOT NULL THEN true
            ELSE false
          END as is_following
        FROM users u
        LEFT JOIN user_follows uf ON uf.following_id = u.id AND uf.follower_id = ${currentUserId}
        WHERE u.id != ${currentUserId}
        AND (LOWER(u.username) LIKE LOWER(${'%' + query + '%'}) 
             OR LOWER(u.email) LIKE LOWER(${'%' + query + '%'}))
        ORDER BY u.username
        LIMIT 20
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        isFollowing: row.is_following
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async followUser(followerId: number, followingId: number): Promise<void> {
    try {
      await db.execute(sql`
        INSERT INTO user_follows (follower_id, following_id)
        VALUES (${followerId}, ${followingId})
        ON CONFLICT (follower_id, following_id) DO NOTHING
      `);
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    try {
      await db.execute(sql`
        DELETE FROM user_follows
        WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `);
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async getFollowing(userId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.username,
          u.email,
          uf.created_at as followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.following_id
        WHERE uf.follower_id = ${userId}
        ORDER BY uf.created_at DESC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        followedAt: row.followed_at
      }));
    } catch (error) {
      console.error('Error getting following list:', error);
      return [];
    }
  }

  async getFollowers(userId: number): Promise<any[]> {
    try {
      const result = await db.execute(sql`
        SELECT 
          u.id,
          u.username,
          u.email,
          uf.created_at as followed_at
        FROM user_follows uf
        JOIN users u ON u.id = uf.follower_id
        WHERE uf.following_id = ${userId}
        ORDER BY uf.created_at DESC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        followedAt: row.followed_at
      }));
    } catch (error) {
      console.error('Error getting followers list:', error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
