import { API_BASE_URL, APP_SCHEME } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthUserRole = "STUDENT" | "TEACHER" | "PARENT" | "ADMIN" | string;

export interface AuthUser {
  id: string;
  email: string;
  role: AuthUserRole;
  avatarUrl?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

type LearningGoal =
  | "lay-lai-goc"
  | "hoc-nang-cao"
  | "on-thi-thpt"
  | "luyen-thi-10";

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean;
  // Onboarding data (client-only, sent to backend in onboarding API)
  onboardingGoals: LearningGoal[];
  onboardingGrade: number | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
  user: {
    id: string;
    email: string;
    role: AuthUserRole;
    avatarUrl?: string | null;
  };
}

interface OAuthCompleteProfileResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: string;
    email: string;
    role: AuthUserRole;
    avatarUrl?: string | null;
  };
  completionToken?: string;
  pendingApproval?: boolean;
}

interface AuthContextValue extends AuthState {
  loginWithEmail: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  completeOAuthProfile: (payload: {
    completionToken: string;
    role: "STUDENT";
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    gradeLevel?: number;
    goals?: LearningGoal[];
  }) => Promise<void>;
  logout: () => Promise<void>;
  setOnboardingGoals: (goals: LearningGoal[]) => void;
  setOnboardingGrade: (grade: number | null) => void;
  markOnboardingCompleted: () => Promise<void>;
}

const STORAGE_KEYS = {
  TOKENS: "@edutech/tokens",
  USER: "@edutech/user",
  ONBOARDING_COMPLETED: "@edutech/onboardingCompleted",
  ONBOARDING_GRADE: "@edutech/onboardingGrade",
  ONBOARDING_GOALS: "@edutech/onboardingGoals",
  OAUTH_COMPLETION_TOKEN: "@edutech/oauthCompletionToken",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Complete WebBrowser session for OAuth
WebBrowser.maybeCompleteAuthSession();

async function apiLoginWithEmail(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/email/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
  }

  // We trust backend schema from swagger, but keep it flexible
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const data: any = await res.json();

  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    sessionId: data.sessionId,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      role: data.user?.role,
      avatarUrl: data.user?.avatarUrl ?? null,
    },
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    onboardingCompleted: false,
    onboardingGoals: [],
    onboardingGrade: null,
  });

  // Load persisted auth state
  useEffect(() => {
    (async () => {
      try {
        const [tokensStr, userStr, onboardingCompletedStr, gradeStr, goalsStr] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.TOKENS),
            AsyncStorage.getItem(STORAGE_KEYS.USER),
            AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
            AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_GRADE),
            AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_GOALS),
          ]);

        const tokens = tokensStr ? (JSON.parse(tokensStr) as AuthTokens) : null;
        const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
        const onboardingCompleted = onboardingCompletedStr === "true";
        const onboardingGrade = gradeStr ? Number(gradeStr) : null;
        const onboardingGoals = goalsStr
          ? (JSON.parse(goalsStr) as LearningGoal[])
          : [];

        setState((prev) => ({
          ...prev,
          user,
          tokens,
          isAuthenticated: !!tokens && !!user,
          onboardingCompleted,
          onboardingGrade,
          onboardingGoals,
          isLoading: false,
        }));
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const loginWithEmail = useCallback(async (payload: LoginPayload) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await apiLoginWithEmail(payload);

      // Only allow student role for this mobile flow
      if (res.user.role !== "STUDENT") {
        throw new Error("Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).");
      }

      const tokens: AuthTokens = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        sessionId: res.sessionId,
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user)),
      ]);

      setState((prev) => ({
        ...prev,
        user: res.user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.TOKENS),
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_GRADE),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_GOALS),
      ]);
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        onboardingCompleted: false,
        onboardingGoals: [],
        onboardingGrade: null,
      });
    }
  }, []);

  const setOnboardingGoals = useCallback((goals: LearningGoal[]) => {
    setState((prev) => ({ ...prev, onboardingGoals: goals }));
    AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_GOALS, JSON.stringify(goals)).catch(
      () => undefined
    );
  }, []);

  const setOnboardingGrade = useCallback((grade: number | null) => {
    setState((prev) => ({ ...prev, onboardingGrade: grade }));
    if (grade == null) {
      AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_GRADE).catch(() => undefined);
    } else {
      AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_GRADE, String(grade)).catch(
        () => undefined
      );
    }
  }, []);

  const markOnboardingCompleted = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
    setState((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Get OAuth URL from backend
      const redirectUri = Linking.createURL("oauth-callback", { scheme: APP_SCHEME });
      const oauthUrl = `${API_BASE_URL}/api/v1/auth/oauth/google/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);

      if (result.type === "success" && result.url) {
        // Parse callback URL
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        const completionToken = url.searchParams.get("completionToken");

        if (token) {
          // User already has account - token might be accessToken or a temporary token
          // Try to use it as accessToken first, or call backend to exchange
          // For now, we'll try to fetch user info with this token
          try {
            const userRes = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (userRes.ok) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const userData: any = await userRes.json();
              
              // Only allow student role
              if (userData.role !== "STUDENT") {
                throw new Error("Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).");
              }

              const tokens: AuthTokens = {
                accessToken: token,
                refreshToken: "", // Backend should provide this, but for now we'll leave it empty
                sessionId: undefined,
              };

              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
                AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
                  id: userData.id,
                  email: userData.email,
                  role: userData.role,
                  avatarUrl: userData.avatarUrl ?? null,
                })),
              ]);

              setState((prev) => ({
                ...prev,
                user: {
                  id: userData.id,
                  email: userData.email,
                  role: userData.role,
                  avatarUrl: userData.avatarUrl ?? null,
                },
                tokens,
                isAuthenticated: true,
                isLoading: false,
              }));
              return;
            } else {
              throw new Error("Không thể lấy thông tin người dùng từ token.");
            }
          } catch (err) {
            // If token exchange fails, treat it as completionToken needed
            // This might happen if backend uses a different flow
            if (completionToken) {
              await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN, completionToken);
              setState((prev) => ({ ...prev, isLoading: false }));
              return;
            }
            throw err;
          }
        } else if (completionToken) {
          // First time login, need to complete profile
          await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN, completionToken);
          setState((prev) => ({ ...prev, isLoading: false }));
          // Navigate to complete profile screen will be handled by the component
          return;
        } else {
          throw new Error("Không nhận được token từ OAuth callback.");
        }
      } else if (result.type === "cancel") {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Đăng nhập bị hủy.");
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const loginWithFacebook = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // Get OAuth URL from backend
      const redirectUri = Linking.createURL("oauth-callback", { scheme: APP_SCHEME });
      const oauthUrl = `${API_BASE_URL}/api/v1/auth/oauth/facebook/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectUri);

      if (result.type === "success" && result.url) {
        // Parse callback URL
        const url = new URL(result.url);
        const token = url.searchParams.get("token");
        const completionToken = url.searchParams.get("completionToken");

        if (token) {
          // User already has account - token might be accessToken or a temporary token
          // Try to use it as accessToken first, or call backend to exchange
          try {
            const userRes = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (userRes.ok) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const userData: any = await userRes.json();
              
              // Only allow student role
              if (userData.role !== "STUDENT") {
                throw new Error("Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).");
              }

              const tokens: AuthTokens = {
                accessToken: token,
                refreshToken: "", // Backend should provide this, but for now we'll leave it empty
                sessionId: undefined,
              };

              await Promise.all([
                AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
                AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({
                  id: userData.id,
                  email: userData.email,
                  role: userData.role,
                  avatarUrl: userData.avatarUrl ?? null,
                })),
              ]);

              setState((prev) => ({
                ...prev,
                user: {
                  id: userData.id,
                  email: userData.email,
                  role: userData.role,
                  avatarUrl: userData.avatarUrl ?? null,
                },
                tokens,
                isAuthenticated: true,
                isLoading: false,
              }));
              return;
            } else {
              throw new Error("Không thể lấy thông tin người dùng từ token.");
            }
          } catch (err) {
            // If token exchange fails, treat it as completionToken needed
            if (completionToken) {
              await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN, completionToken);
              setState((prev) => ({ ...prev, isLoading: false }));
              return;
            }
            throw err;
          }
        } else if (completionToken) {
          // First time login, need to complete profile
          await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN, completionToken);
          setState((prev) => ({ ...prev, isLoading: false }));
          // Navigate to complete profile screen will be handled by the component
          return;
        } else {
          throw new Error("Không nhận được token từ OAuth callback.");
        }
      } else if (result.type === "cancel") {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Đăng nhập bị hủy.");
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const completeOAuthProfile = useCallback(
    async (payload: {
      completionToken: string;
      role: "STUDENT";
      firstName: string;
      lastName: string;
      phoneNumber?: string;
      gradeLevel?: number;
      goals?: LearningGoal[];
    }) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/complete-profile`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completionToken: payload.completionToken,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber,
            // For student, we might need to send gradeLevel and goals
            // Check backend API schema to confirm
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Hoàn tất hồ sơ thất bại.");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const data: any = await res.json();

        // Student role should return tokens immediately
        if (data.accessToken && data.user) {
          const tokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            sessionId: data.sessionId,
          };

          // Only allow student role
          if (data.user.role !== "STUDENT") {
            throw new Error("Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).");
          }

          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
            AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user)),
            AsyncStorage.removeItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN),
          ]);

          setState((prev) => ({
            ...prev,
            user: data.user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          }));

          // If gradeLevel and goals are provided, save them for onboarding
          if (payload.gradeLevel) {
            await setOnboardingGrade(payload.gradeLevel);
          }
          if (payload.goals && payload.goals.length > 0) {
            await Promise.all([
              setOnboardingGoals(payload.goals),
              // If we have grade and goals, we can mark onboarding as completed
              // But let's wait for the user to complete the onboarding flow
            ]);
          }
        } else if (data.pendingApproval) {
          // Teacher/Parent roles need approval
          throw new Error("Tài khoản của bạn đang chờ phê duyệt từ quản trị viên.");
        } else {
          throw new Error("Không nhận được thông tin đăng nhập sau khi hoàn tất hồ sơ.");
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setOnboardingGrade, setOnboardingGoals]
  );

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      loginWithEmail,
      loginWithGoogle,
      loginWithFacebook,
      completeOAuthProfile,
      logout,
      setOnboardingGoals,
      setOnboardingGrade,
      markOnboardingCompleted,
    }),
    [
      state,
      loginWithEmail,
      loginWithGoogle,
      loginWithFacebook,
      completeOAuthProfile,
      logout,
      setOnboardingGoals,
      setOnboardingGrade,
      markOnboardingCompleted,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

