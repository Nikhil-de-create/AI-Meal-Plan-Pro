import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"), // Made optional for Google OAuth users
  googleId: text("google_id").unique(), // Google user identifier
  authProvider: text("auth_provider").default("email").notNull(), // 'email' or 'google'
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("user").notNull(), // "user", "admin", "super_admin"
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  dietaryRestrictions: text("dietary_restrictions").array(),
  allergies: text("allergies").array(),
  preferredCuisines: text("preferred_cuisines").array(),
  cookingTime: text("cooking_time"), // "quick", "medium", "long"
  skillLevel: text("skill_level"), // "beginner", "intermediate", "advanced"
  servingSize: integer("serving_size").default(2),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  dietType: text("diet_type"),
  duration: integer("duration").notNull(), // days
  meals: jsonb("meals"), // Array of meal objects
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false).notNull(), // Allow sharing
  likesCount: integer("likes_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  cuisine: text("cuisine"), // cuisine category for discovery
  imageUrl: text("image_url"), // meal plan cover image
  tags: text("tags").array(), // searchable tags
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Allow user-generated recipes
  name: text("name").notNull(),
  description: text("description"),
  ingredients: jsonb("ingredients").notNull(), // Array of ingredient objects
  instructions: jsonb("instructions").notNull(), // Array of instruction steps
  prepTime: integer("prep_time"), // minutes
  cookTime: integer("cook_time"), // minutes
  servings: integer("servings").default(4),
  difficulty: text("difficulty"), // "easy", "medium", "hard"
  cuisine: text("cuisine"),
  tags: text("tags").array(),
  nutrition: jsonb("nutrition"), // Nutritional information
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groceryLists = pgTable("grocery_lists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  items: jsonb("items").notNull(), // Array of grocery items
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completed: boolean("completed").default(false),
});

export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pantryItems = pgTable("pantry_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  itemName: text("item_name").notNull(),
  quantity: real("quantity").notNull(),
  unit: text("unit").notNull(), // "cups", "lbs", "pieces", "tbsp", etc.
  category: text("category"), // "vegetables", "proteins", "dairy", etc.
  expirationDate: date("expiration_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groceryOrders = pgTable("grocery_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  orderNumber: text("order_number").notNull().unique(),
  items: jsonb("items").notNull(), // Array of ordered items with quantities
  totalAmount: real("total_amount"),
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "delivered", "cancelled"
  deliveryAddress: text("delivery_address"),
  estimatedDelivery: timestamp("estimated_delivery"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin-specific tables
export const systemLogs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // "info", "warn", "error", "debug"
  message: text("message").notNull(),
  metadata: jsonb("metadata"), // Additional context data
  userId: integer("user_id").references(() => users.id),
  source: text("source").notNull(), // "auth", "api", "ai", "system"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiConfigurations = pgTable("ai_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  promptTemplate: text("prompt_template").notNull(),
  maxTokens: integer("max_tokens").default(1000).notNull(),
  temperature: real("temperature").default(0.7).notNull(),
  topP: real("top_p").default(1.0).notNull(),
  frequencyPenalty: real("frequency_penalty").default(0.0).notNull(),
  presencePenalty: real("presence_penalty").default(0.0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const groceryPartners = pgTable("grocery_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  apiEndpoint: text("api_endpoint").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret"),
  webhookUrl: text("webhook_url"),
  supportedRegions: text("supported_regions").array(),
  isActive: boolean("is_active").default(true).notNull(),
  configuration: jsonb("configuration"), // Partner-specific config
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  metricName: text("metric_name").notNull(),
  metricValue: real("metric_value").notNull(),
  metricType: text("metric_type").notNull(), // "counter", "gauge", "histogram"
  tags: jsonb("tags"), // Additional metric tags
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

// Push notification system tables
export const deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull(), // "ios", "android", "web"
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationHistory = pgTable("notification_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: jsonb("data"), // Additional notification payload
  status: text("status").notNull(), // "sent", "failed", "delivered", "clicked"
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deviceToken: text("device_token"),
  errorMessage: text("error_message"),
});

export const userNotificationSettings = pgTable("user_notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  mealRemindersEnabled: boolean("meal_reminders_enabled").default(true).notNull(),
  reminderTime: text("reminder_time").default("09:00").notNull(), // HH:MM format
  timezone: text("timezone").default("UTC").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Primary type definitions

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  updatedAt: true,
});

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
});

export const insertGroceryListSchema = createInsertSchema(groceryLists).omit({
  id: true,
  createdAt: true,
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites).omit({
  id: true,
  createdAt: true,
});

export const insertPantryItemSchema = createInsertSchema(pantryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroceryOrderSchema = createInsertSchema(groceryOrders).omit({
  id: true,
  createdAt: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiConfigurationSchema = createInsertSchema(aiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroceryPartnerSchema = createInsertSchema(groceryPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  recordedAt: true,
});

// Remove duplicate types - will be defined later

// Meal plan generation request schema
export const mealPlanGenerationSchema = z.object({
  dietType: z.string().optional(),
  duration: z.number().min(1).max(30),
  preferences: z.object({
    dietaryRestrictions: z.array(z.string()).optional(),
    allergies: z.array(z.string()).optional(),
    preferredCuisines: z.array(z.string()).optional(),
    cookingTime: z.enum(["quick", "medium", "long"]).optional(),
    servingSize: z.number().min(1).max(8).optional(),
  }).optional(),
});

// Main type definitions - consolidated from duplicate exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type GroceryList = typeof groceryLists.$inferSelect;
export type InsertGroceryList = z.infer<typeof insertGroceryListSchema>;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;
export type PantryItem = typeof pantryItems.$inferSelect;
export type InsertPantryItem = z.infer<typeof insertPantryItemSchema>;
export type GroceryOrder = typeof groceryOrders.$inferSelect;
export type InsertGroceryOrder = z.infer<typeof insertGroceryOrderSchema>;

// Admin types
export type SystemLog = typeof systemLogs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type AiConfiguration = typeof aiConfigurations.$inferSelect;
export type InsertAiConfiguration = z.infer<typeof insertAiConfigurationSchema>;
export type GroceryPartner = typeof groceryPartners.$inferSelect;
export type InsertGroceryPartner = z.infer<typeof insertGroceryPartnerSchema>;
export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type UserNotificationSettings = typeof userNotificationSettings.$inferSelect;

// Insert schemas for notification tables
export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationHistorySchema = createInsertSchema(notificationHistory).omit({
  id: true,
  sentAt: true,
});

export const insertUserNotificationSettingsSchema = createInsertSchema(userNotificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Cooking steps and sessions
export const cookingSteps = pgTable("cooking_steps", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  stepNumber: integer("step_number").notNull(),
  description: text("description").notNull(),
  durationMinutes: integer("duration_minutes"),
  durationSeconds: integer("duration_seconds"),
  isTimerRequired: boolean("is_timer_required").default(false).notNull(),
  instructions: text("instructions").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cookingSessions = pgTable("cooking_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  status: text("status").notNull(), // 'active', 'paused', 'completed', 'cancelled'
  currentStepIndex: integer("current_step_index").default(0).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
  totalPausedDuration: integer("total_paused_duration").default(0).notNull(), // in seconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Social Media Features - "Spotify for Meals"
export const recipeLikes = pgTable("recipe_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlanLikes = pgTable("meal_plan_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followingId: integer("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // 'created_recipe', 'liked_recipe', 'created_meal_plan', 'shared_recipe'
  targetType: text("target_type").notNull(), // 'recipe', 'meal_plan'
  targetId: integer("target_id").notNull(),
  data: jsonb("data"), // Additional activity data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contentType: text("content_type").notNull(), // 'recipe', 'meal_plan'
  contentId: integer("content_id").notNull(),
  platform: text("platform").notNull(), // 'instagram', 'twitter', 'facebook', 'tiktok'
  shareUrl: text("share_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const trendingContent = pgTable("trending_content", {
  id: serial("id").primaryKey(),
  contentType: text("content_type").notNull(), // 'recipe', 'meal_plan'
  contentId: integer("content_id").notNull(),
  region: text("region"), // geographic region for "trending near you"
  trendingScore: real("trending_score").notNull(), // calculated based on likes, shares, recent activity
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // trending content expires
});

// User profile enhancements for social features
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  location: text("location"), // for location-based trending
  cookingStyle: text("cooking_style"), // "home_cook", "professional", "beginner", "expert"
  specialties: text("specialties").array(), // cooking specialties/cuisines
  isPublic: boolean("is_public").default(true).notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  recipesCount: integer("recipes_count").default(0).notNull(),
  mealPlansCount: integer("meal_plans_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for cooking steps and sessions
export const cookingStepsRelations = relations(cookingSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [cookingSteps.recipeId],
    references: [recipes.id],
  }),
}));

export const cookingSessionsRelations = relations(cookingSessions, ({ one }) => ({
  user: one(users, {
    fields: [cookingSessions.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [cookingSessions.recipeId],
    references: [recipes.id],
  }),
}));

// Social Media Relations
export const recipeLikesRelations = relations(recipeLikes, ({ one }) => ({
  user: one(users, {
    fields: [recipeLikes.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [recipeLikes.recipeId],
    references: [recipes.id],
  }),
}));

export const mealPlanLikesRelations = relations(mealPlanLikes, ({ one }) => ({
  user: one(users, {
    fields: [mealPlanLikes.userId],
    references: [users.id],
  }),
  mealPlan: one(mealPlans, {
    fields: [mealPlanLikes.mealPlanId],
    references: [mealPlans.id],
  }),
}));

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
  }),
}));

export const userActivityRelations = relations(userActivity, ({ one }) => ({
  user: one(users, {
    fields: [userActivity.userId],
    references: [users.id],
  }),
}));

export const socialSharesRelations = relations(socialShares, ({ one }) => ({
  user: one(users, {
    fields: [socialShares.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
export type InsertNotificationHistory = z.infer<typeof insertNotificationHistorySchema>;
export type InsertUserNotificationSettings = z.infer<typeof insertUserNotificationSettingsSchema>;

// Cooking types
export type CookingStep = typeof cookingSteps.$inferSelect;
export type CookingSession = typeof cookingSessions.$inferSelect;

export const insertCookingStepSchema = createInsertSchema(cookingSteps).omit({
  id: true,
  createdAt: true,
});

export const insertCookingSessionSchema = createInsertSchema(cookingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCookingStep = z.infer<typeof insertCookingStepSchema>;
export type InsertCookingSession = z.infer<typeof insertCookingSessionSchema>;

// Social Media Types
export type RecipeLike = typeof recipeLikes.$inferSelect;
export type MealPlanLike = typeof mealPlanLikes.$inferSelect;
export type UserFollow = typeof userFollows.$inferSelect;
export type UserActivity = typeof userActivity.$inferSelect;
export type SocialShare = typeof socialShares.$inferSelect;
export type TrendingContent = typeof trendingContent.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;

// Social Media Insert Schemas
export const insertRecipeLikeSchema = createInsertSchema(recipeLikes).omit({
  id: true,
  createdAt: true,
});

export const insertMealPlanLikeSchema = createInsertSchema(mealPlanLikes).omit({
  id: true,
  createdAt: true,
});

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).omit({
  id: true,
  createdAt: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  createdAt: true,
});

export const insertTrendingContentSchema = createInsertSchema(trendingContent).omit({
  id: true,
  calculatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Social Media Insert Types
export type InsertRecipeLike = z.infer<typeof insertRecipeLikeSchema>;
export type InsertMealPlanLike = z.infer<typeof insertMealPlanLikeSchema>;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
export type InsertTrendingContent = z.infer<typeof insertTrendingContentSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

export type MealPlanGenerationRequest = z.infer<typeof mealPlanGenerationSchema>;
