import OpenAI from 'openai';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { 
  DeviceToken, 
  NotificationHistory, 
  UserNotificationSettings,
  InsertNotificationHistory,
  User,
  MealPlan
} from '@shared/schema';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const expo = new Expo();

export interface NotificationService {
  generateMealReminder(user: User, mealPlan: MealPlan): Promise<string>;
  sendPushNotification(deviceTokens: DeviceToken[], title: string, body: string, data?: any): Promise<void>;
  processNotificationResults(tickets: ExpoPushTicket[], deviceTokens: DeviceToken[]): Promise<void>;
  sendMealReminders(): Promise<void>;
}

export class ExpoNotificationService implements NotificationService {
  
  /**
   * Generate personalized, catchy meal reminder using OpenAI
   */
  async generateMealReminder(user: User, mealPlan: MealPlan): Promise<string> {
    try {
      const meals = Array.isArray(mealPlan.meals) ? mealPlan.meals : [];
      const todaysMeal = meals.length > 0 ? meals[0] : null;
      
      const prompt = `Create a fun, catchy push notification message for ${user.firstName || 'the user'} about their meal plan today. 
      
Meal plan: ${mealPlan.name}
Today's meal: ${todaysMeal ? JSON.stringify(todaysMeal) : 'No specific meal planned'}

Guidelines:
- Keep it under 60 characters for mobile notifications
- Make it exciting and personalized
- Use food emojis sparely (max 1-2)
- Focus on the appeal of the food
- Examples: "Grilled salmon awaits! 🐟", "Taco Tuesday is calling!", "Your pasta perfection is ready!"

Return only the notification message, nothing else.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a food enthusiast creating exciting meal reminders." },
          { role: "user", content: prompt }
        ],
        max_tokens: 50,
        temperature: 0.8,
      });

      return response.choices[0]?.message?.content?.trim() || "Your delicious meal is ready! 🍽️";
    } catch (error) {
      console.error('Failed to generate meal reminder:', error);
      return "Time to enjoy your planned meal! 🍽️";
    }
  }

  /**
   * Send push notifications to multiple devices
   */
  async sendPushNotification(
    deviceTokens: DeviceToken[], 
    title: string, 
    body: string, 
    data: any = {}
  ): Promise<void> {
    const messages: ExpoPushMessage[] = [];

    // Filter valid tokens and create messages
    for (const deviceToken of deviceTokens) {
      if (!Expo.isExpoPushToken(deviceToken.token)) {
        console.error(`Invalid Expo push token: ${deviceToken.token}`);
        continue;
      }

      messages.push({
        to: deviceToken.token,
        sound: 'default',
        title,
        body,
        data: {
          ...data,
          userId: deviceToken.userId,
          timestamp: new Date().toISOString(),
        },
        priority: 'normal',
        badge: 1,
      });
    }

    if (messages.length === 0) {
      console.log('No valid device tokens to send notifications to');
      return;
    }

    try {
      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets: ExpoPushTicket[] = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Process results and handle errors
      await this.processNotificationResults(tickets, deviceTokens);

    } catch (error) {
      console.error('Failed to send push notifications:', error);
      throw error;
    }
  }

  /**
   * Process notification results and log success/failures
   */
  async processNotificationResults(
    tickets: ExpoPushTicket[], 
    deviceTokens: DeviceToken[]
  ): Promise<void> {
    const { storage } = await import('../storage');
    
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      const deviceToken = deviceTokens[i];

      if (!deviceToken) continue;

      const notificationData: InsertNotificationHistory = {
        userId: deviceToken.userId,
        title: "Meal Reminder",
        body: "Your meal is ready!",
        deviceToken: deviceToken.token,
        status: 'sent',
        data: {},
      };

      if (ticket.status === 'error') {
        notificationData.status = 'failed';
        notificationData.errorMessage = ticket.message;
        
        // Handle invalid tokens
        if (ticket.details?.error === 'DeviceNotRegistered') {
          await storage.deactivateDeviceToken(deviceToken.token);
        }
        
        console.error(`Notification failed for token ${deviceToken.token}:`, ticket.message);
      }

      await storage.createNotificationHistory(notificationData);
    }
  }

  /**
   * Send meal reminders to all active users with today's meal plans
   */
  async sendMealReminders(): Promise<void> {
    try {
      const { storage } = await import('../storage');
      
      // Get all users with active meal plans and notification settings
      const usersWithMealPlans = await storage.getUsersWithActiveMealPlans();
      
      if (usersWithMealPlans.length === 0) {
        console.log('No users with active meal plans found');
        return;
      }

      console.log(`Processing meal reminders for ${usersWithMealPlans.length} users`);

      for (const userData of usersWithMealPlans) {
        try {
          // Check if user has notifications enabled
          const notificationSettings = await storage.getUserNotificationSettings(userData.user.id);
          if (!notificationSettings?.mealRemindersEnabled) {
            continue;
          }

          // Get user's device tokens
          const deviceTokens = await storage.getActiveDeviceTokens(userData.user.id);
          if (deviceTokens.length === 0) {
            continue;
          }

          // Generate personalized meal reminder
          const reminderMessage = await this.generateMealReminder(userData.user, userData.mealPlan);
          
          // Send notification
          await this.sendPushNotification(
            deviceTokens,
            "Meal Time! 🍽️",
            reminderMessage,
            {
              type: 'meal_reminder',
              mealPlanId: userData.mealPlan.id,
            }
          );

          console.log(`Sent meal reminder to user ${userData.user.id}: ${reminderMessage}`);

        } catch (error) {
          console.error(`Failed to send meal reminder to user ${userData.user.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Failed to send meal reminders:', error);
      throw error;
    }
  }

  /**
   * Send cooking step notification to user
   */
  async sendCookingStepNotification(userId: number, stepData: {
    title: string;
    body: string;
    stepIndex: number;
    type: 'start' | 'complete';
    sessionData: {
      stepDescription: string;
      instructions: string;
      isTimerRequired: boolean;
      duration: string;
    };
  }): Promise<void> {
    try {
      const { storage } = await import('../storage');
      const deviceTokens = await storage.getActiveDeviceTokens(userId);
      
      if (deviceTokens.length === 0) {
        console.log(`No active device tokens for user ${userId} - skipping cooking notification`);
        return;
      }

      await this.sendPushNotifications(
        deviceTokens,
        stepData.title,
        stepData.body,
        {
          type: 'cooking_step',
          stepIndex: stepData.stepIndex,
          stepType: stepData.type,
          sessionData: stepData.sessionData,
          channelId: 'cooking-reminders',
          priority: 'high'
        }
      );

      console.log(`Cooking step notification sent to user ${userId}: ${stepData.title}`);
    } catch (error) {
      console.error('Error sending cooking step notification:', error);
      throw error;
    }
  }
}

export const notificationService = new ExpoNotificationService();