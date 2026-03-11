import Constants from "expo-constants";

/**
 * Get API base URL from environment variables
 * Falls back to localhost if not set
 */
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:8888";

/**
 * App scheme for deep linking (must match app.config.js scheme)
 */
export const APP_SCHEME = "mobileapp";
