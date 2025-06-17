import * as SecureStore from 'expo-secure-store';
import { apiService } from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.auth.login(data.email, data.password);
    const result = response.data;
    
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    
    return result;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.auth.register(data);
    const result = response.data;
    
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    
    return result;
  },

  async googleSignIn(idToken: string): Promise<AuthResponse> {
    const response = await apiService.auth.googleSignIn(idToken);
    const result = response.data;
    
    if (result.token) {
      await SecureStore.setItemAsync('authToken', result.token);
    }
    
    return result;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
  },

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('authToken');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiService.auth.getProfile();
      return response.data;
    } catch (error) {
      return null;
    }
  },
};

export default authService;