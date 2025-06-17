import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

/**
 * Google Authentication Service for React Native
 * Handles Google Sign-In flow using Expo's auth session
 */

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export interface GoogleAuthResponse {
  type: 'success' | 'cancel' | 'dismiss' | 'locked';
  user?: GoogleUser;
  accessToken?: string;
  idToken?: string;
  error?: string;
}

export class GoogleAuthService {
  private request: AuthSession.AuthRequest | null = null;
  private response: AuthSession.AuthSessionResult | null = null;
  private promptAsync: ((options?: AuthSession.AuthRequestPromptOptions) => Promise<AuthSession.AuthSessionResult>) | null = null;

  constructor() {
    this.initializeGoogleAuth();
  }

  /**
   * Initialize Google OAuth configuration
   */
  private initializeGoogleAuth() {
    // Get Google OAuth configuration from environment or Constants
    const googleConfig = {
      androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      iosClientId: Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      webClientId: Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    };

    // Configure the auth request
    const [request, response, promptAsync] = Google.useAuthRequest({
      androidClientId: googleConfig.androidClientId,
      iosClientId: googleConfig.iosClientId,
      webClientId: googleConfig.webClientId,
      scopes: ['profile', 'email'],
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
      },
    });

    this.request = request;
    this.response = response;
    this.promptAsync = promptAsync;
  }

  /**
   * Start Google Sign-In flow
   * @returns Promise with authentication result
   */
  async signIn(): Promise<GoogleAuthResponse> {
    try {
      if (!this.promptAsync) {
        return {
          type: 'cancel',
          error: 'Google authentication not properly initialized'
        };
      }

      // Start the authentication flow
      const result = await this.promptAsync();

      if (result.type === 'success') {
        // Get user info using the access token
        const userInfo = await this.getUserInfo(result.authentication?.accessToken);
        
        if (userInfo) {
          return {
            type: 'success',
            user: userInfo,
            accessToken: result.authentication?.accessToken,
            idToken: result.authentication?.idToken,
          };
        } else {
          return {
            type: 'cancel',
            error: 'Failed to get user information from Google'
          };
        }
      } else if (result.type === 'cancel') {
        return {
          type: 'cancel',
          error: 'User cancelled Google sign-in'
        };
      } else {
        return {
          type: 'cancel',
          error: 'Google sign-in failed'
        };
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      return {
        type: 'cancel',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get user information from Google using access token
   * @param accessToken - Google access token
   * @returns User information or null
   */
  private async getUserInfo(accessToken?: string): Promise<GoogleUser | null> {
    if (!accessToken) {
      return null;
    }

    try {
      const response = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        return {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
        };
      } else {
        console.error('Failed to fetch user info:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Check if Google authentication is available
   * @returns boolean indicating if Google auth is configured
   */
  isAvailable(): boolean {
    return this.request !== null && this.promptAsync !== null;
  }

  /**
   * Get the current auth request for debugging
   * @returns Current auth request or null
   */
  getAuthRequest(): AuthSession.AuthRequest | null {
    return this.request;
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();