import { apiRequest } from "./queryClient";

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

export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await apiRequest("POST", "/api/auth/login", data);
  const result = await response.json();
  
  if (result.token) {
    localStorage.setItem("authToken", result.token);
  }
  
  return result;
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiRequest("POST", "/api/auth/register", data);
  const result = await response.json();
  
  if (result.token) {
    localStorage.setItem("authToken", result.token);
  }
  
  return result;
};

export const logout = () => {
  localStorage.removeItem("authToken");
  window.location.href = "/auth";
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
