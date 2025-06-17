import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

/**
 * Google OAuth Service
 * Handles Google Sign-In authentication and user verification
 */
export class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.warn('Google OAuth credentials not configured. Google Sign-In will be disabled until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.');
      // Create a dummy client to prevent errors
      this.client = new OAuth2Client('dummy', 'dummy');
      return;
    }

    this.client = new OAuth2Client(clientId, clientSecret);
  }

  /**
   * Verify Google ID token and extract user information
   * @param idToken - Google ID token from client
   * @returns User information from Google
   */
  async verifyIdToken(idToken: string) {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Verify Google access token and get user profile
   * @param accessToken - Google access token from client
   * @returns User profile information
   */
  async verifyAccessToken(accessToken: string) {
    try {
      // Set credentials for the OAuth2 client
      this.client.setCredentials({ access_token: accessToken });

      // Get user profile using Google People API
      const oauth2 = google.oauth2({ version: 'v2', auth: this.client });
      const { data } = await oauth2.userinfo.get();

      return {
        googleId: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        emailVerified: data.verified_email,
      };
    } catch (error) {
      console.error('Google access token verification failed:', error);
      throw new Error('Invalid Google access token');
    }
  }

  /**
   * Generate OAuth URL for server-side authentication flow
   * @param redirectUri - Redirect URI after authentication
   * @returns Authorization URL
   */
  generateAuthUrl(redirectUri: string) {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      redirect_uri: redirectUri,
    });
  }

  /**
   * Exchange authorization code for tokens
   * @param code - Authorization code from Google
   * @param redirectUri - Redirect URI used in auth flow
   * @returns Token information
   */
  async getTokens(code: string, redirectUri: string) {
    try {
      const { tokens } = await this.client.getToken({
        code,
        redirect_uri: redirectUri,
      });

      return tokens;
    } catch (error) {
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();