import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
      // Could emit an event here to redirect to login
    }
    return Promise.reject(error);
  }
);

// API Service functions
export const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/auth/login', { email, password }),
    
    register: (userData: {
      email: string;
      username: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => apiClient.post('/api/auth/register', userData),
    
    getProfile: () => apiClient.get('/api/user/profile'),
    
    getStats: () => apiClient.get('/api/user/stats'),
    
    getPreferences: () => apiClient.get('/api/user/preferences'),
    
    createPreferences: (preferences: any) =>
      apiClient.post('/api/user/preferences', preferences),
    
    updatePreferences: (preferences: any) =>
      apiClient.put('/api/user/preferences', preferences),
    
    // Google OAuth endpoints
    googleSignIn: (idToken: string) =>
      apiClient.post('/api/auth/google', { idToken }),
    
    googleLink: (idToken: string) =>
      apiClient.post('/api/auth/google/link', { idToken }),
  },

  // Preferences endpoints (deprecated - use auth.getPreferences instead)
  preferences: {
    get: () => apiClient.get('/api/user/preferences'),
    
    create: (preferences: any) =>
      apiClient.post('/api/user/preferences', preferences),
    
    update: (preferences: any) =>
      apiClient.put('/api/user/preferences', preferences),
  },

  // Meal plans endpoints
  mealPlans: {
    getAll: () => apiClient.get('/api/mealplans'),
    
    getById: (id: number) => apiClient.get(`/api/mealplans/${id}`),
    
    create: async (mealPlanData: {
      dietType?: string;
      duration: number;
      preferences?: {
        dietaryRestrictions?: string[];
        allergies?: string[];
        preferredCuisines?: string[];
        cookingTime?: 'quick' | 'medium' | 'long';
        servingSize?: number;
        mealGoals?: string;
      };
    }) => {
      try {
        const response = await apiClient.post('/api/mealplan', mealPlanData);
        
        // Validate response structure for both mock and real API data
        if (!response.data || !response.data.meals || !Array.isArray(response.data.meals)) {
          throw new Error('Invalid meal plan response format');
        }
        
        // Ensure each meal has required properties
        response.data.meals.forEach((meal: any, index: number) => {
          if (!meal.name || !meal.type || !meal.ingredients || !Array.isArray(meal.ingredients)) {
            throw new Error(`Invalid meal data at index ${index}`);
          }
        });
        
        return response;
      } catch (error: any) {
        // Enhanced error handling for better user experience
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.response?.status === 429) {
          throw new Error('Too many requests. Please try again in a moment.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else if (error.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Failed to generate meal plan. Please check your connection and try again.');
        }
      }
    },
    
    delete: (id: number) => apiClient.delete(`/api/mealplans/${id}`),
  },

  // Recipes endpoints
  recipes: {
    getAll: (search?: string) => {
      const params = search ? { search } : {};
      return apiClient.get('/api/recipes', { params });
    },
    
    getById: (id: number) => apiClient.get(`/api/recipes/${id}`),
  },

  // Favorites endpoints
  favorites: {
    get: () => apiClient.get('/api/user/favorites'),
    
    add: (recipeId: number) =>
      apiClient.post('/api/user/favorites', { recipeId }),
    
    remove: (recipeId: number) =>
      apiClient.delete(`/api/user/favorites/${recipeId}`),
  },

  // Grocery lists endpoints
  groceryLists: {
    getAll: () => apiClient.get('/api/grocery-lists'),
    
    create: (groceryListData: any) =>
      apiClient.post('/api/grocery-lists', groceryListData),
    
    generateFromMealPlan: (mealPlanId: number) =>
      apiClient.post(`/api/grocery-lists/generate/${mealPlanId}`),
    
    delete: (id: number) => apiClient.delete(`/api/grocery-lists/${id}`),
  },

  // Health check
  health: () => apiClient.get('/api/health'),
};

export default apiService;