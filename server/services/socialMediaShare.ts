import { storage } from '../storage';

export interface ShareableAchievement {
  type: 'meal_completed' | 'meal_plan_finished' | 'recipe_mastered' | 'cooking_streak';
  title: string;
  description: string;
  imageUrl?: string;
  stats?: {
    cookingTime?: number;
    difficulty?: string;
    calories?: number;
    servings?: number;
  };
}

export class SocialMediaShareService {
  // Generate shareable content for different achievement types
  static generateShareContent(achievement: ShareableAchievement): {
    text: string;
    hashtags: string[];
    imageCaption: string;
  } {
    const baseHashtags = ['#MealPlanning', '#HealthyEating', '#Cooking', '#FoodieLife'];
    
    switch (achievement.type) {
      case 'meal_completed':
        return {
          text: `Just finished cooking ${achievement.title}! ${achievement.description} 🍽️✨`,
          hashtags: [...baseHashtags, '#CookingSuccess', '#HomeCooking'],
          imageCaption: `${achievement.title} - Completed with love! ${achievement.stats?.cookingTime ? `Cooking time: ${achievement.stats.cookingTime} mins` : ''}`
        };
      
      case 'meal_plan_finished':
        return {
          text: `Completed my ${achievement.title}! ${achievement.description} 🎉 Feeling accomplished and well-nourished!`,
          hashtags: [...baseHashtags, '#MealPlanSuccess', '#HealthyLifestyle', '#NutritionGoals'],
          imageCaption: `Successfully completed: ${achievement.title}`
        };
      
      case 'recipe_mastered':
        return {
          text: `Mastered a new recipe: ${achievement.title}! ${achievement.description} 👨‍🍳👩‍🍳`,
          hashtags: [...baseHashtags, '#RecipeMastery', '#CookingSkills', '#NewRecipe'],
          imageCaption: `Recipe mastered: ${achievement.title} ${achievement.stats?.difficulty ? `- ${achievement.stats.difficulty} level` : ''}`
        };
      
      case 'cooking_streak':
        return {
          text: `${achievement.title}! ${achievement.description} 🔥 Consistency is key to healthy living!`,
          hashtags: [...baseHashtags, '#CookingStreak', '#HealthyHabits', '#Consistency'],
          imageCaption: `${achievement.title} - Keep the momentum going!`
        };
      
      default:
        return {
          text: `${achievement.title}! ${achievement.description}`,
          hashtags: baseHashtags,
          imageCaption: achievement.title
        };
    }
  }

  // Generate social media URLs for sharing
  static generateShareUrls(content: { text: string; hashtags: string[]; imageCaption: string }, imageUrl?: string) {
    const encodedText = encodeURIComponent(content.text);
    const encodedHashtags = encodeURIComponent(content.hashtags.join(' '));
    const fullText = encodeURIComponent(`${content.text} ${content.hashtags.join(' ')}`);
    
    return {
      instagram: {
        // Instagram doesn't support direct URL sharing, provide copy-paste content
        copyText: `${content.imageCaption}\n\n${content.text}\n\n${content.hashtags.join(' ')}`,
        instructions: 'Copy this text and paste it when posting to Instagram'
      },
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(process.env.FRONTEND_URL || 'https://mealplanner.app')}&quote=${fullText}`,
      twitter: `https://twitter.com/intent/tweet?text=${fullText}&url=${encodeURIComponent(process.env.FRONTEND_URL || 'https://mealplanner.app')}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(process.env.FRONTEND_URL || 'https://mealplanner.app')}&summary=${encodedText}`,
      whatsapp: `https://wa.me/?text=${fullText}`
    };
  }

  // Track social media shares for analytics
  static async recordShare(userId: number, platform: string, achievementType: string, contentId: number): Promise<void> {
    try {
      await storage.shareContent(userId, achievementType, contentId, platform);
    } catch (error) {
      console.error('Failed to record social share:', error);
    }
  }

  // Generate achievement based on cooking session completion
  static generateCookingAchievement(recipe: any, cookingTime: number): ShareableAchievement {
    return {
      type: 'meal_completed',
      title: recipe.name,
      description: `Cooked this delicious ${recipe.cuisine || ''} dish following step-by-step guidance!`,
      stats: {
        cookingTime,
        difficulty: recipe.difficulty,
        calories: recipe.nutrition?.calories,
        servings: recipe.servings
      }
    };
  }

  // Generate achievement for meal plan completion
  static generateMealPlanAchievement(mealPlan: any): ShareableAchievement {
    const days = Math.ceil((new Date().getTime() - new Date(mealPlan.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      type: 'meal_plan_finished',
      title: mealPlan.name,
      description: `Completed my ${days}-day meal plan journey! Every meal was planned with care and nutrition in mind.`
    };
  }

  // Generate achievement for recipe mastery (completing recipe multiple times)
  static generateRecipeMasteryAchievement(recipe: any, completionCount: number): ShareableAchievement {
    return {
      type: 'recipe_mastered',
      title: recipe.name,
      description: `Successfully cooked this recipe ${completionCount} times! It's officially in my repertoire.`,
      stats: {
        difficulty: recipe.difficulty,
        calories: recipe.nutrition?.calories,
        servings: recipe.servings
      }
    };
  }

  // Generate achievement for cooking streaks
  static generateStreakAchievement(streakDays: number): ShareableAchievement {
    return {
      type: 'cooking_streak',
      title: `${streakDays}-Day Cooking Streak`,
      description: `Been cooking home meals for ${streakDays} consecutive days!`
    };
  }
}