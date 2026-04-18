import { API_BASE_URL, APP_SCHEME } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

// Native OAuth SDKs (chuẩn chỉnh cho luồng mobile)
// Sử dụng require động để tránh crash trên Web (requireNativeComponent is not a function)
let GoogleSignin: any = null;
let statusCodes: any = null;
let LoginManager: any = null;
let AccessToken: any = null;

if (Platform.OS !== "web") {
  try {
    const googleModule = require("@react-native-google-signin/google-signin");
    GoogleSignin = googleModule.GoogleSignin;
    statusCodes = googleModule.statusCodes;

    const fbModule = require("react-native-fbsdk-next");
    LoginManager = fbModule.LoginManager;
    AccessToken = fbModule.AccessToken;
  } catch (error) {
    console.warn("Native OAuth modules không load được:", error);
  }
}

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
  requestPasswordResetOtp: (payload: { email: string }) => Promise<void>;
  verifyPasswordResetOtp: (payload: {
    email: string;
    otp: string;
  }) => Promise<{ resetToken: string }>;
  resetPasswordWithToken: (payload: {
    resetToken: string;
    newPassword: string;
  }) => Promise<void>;
  changePassword: (payload: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  hydrateFromOAuthLogin: (payload: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    sessionId?: string;
    onboardingCompleted?: boolean;
  }) => Promise<void>;
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

export const STORAGE_KEYS = {
  TOKENS: "@edutech/tokens",
  USER: "@edutech/user",
  ONBOARDING_COMPLETED: "@edutech/onboardingCompleted",
  ONBOARDING_GRADE: "@edutech/onboardingGrade",
  ONBOARDING_GOALS: "@edutech/onboardingGoals",
  OAUTH_COMPLETION_TOKEN: "@edutech/oauthCompletionToken",
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readErrorMessage(res: Response): Promise<string> {
  // Backend sometimes returns JSON error envelope; sometimes plain text.
  try {
    const text = await res.text();
    if (!text) return "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const json: any = JSON.parse(text);
      return json?.message || json?.error || json?.data?.message || text;
    } catch {
      return text;
    }
  } catch {
    return "";
  }
}

async function apiLoginWithEmail(
  payload: LoginPayload,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/email/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      text || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
    );
  }

  // We trust backend schema from swagger, but keep it flexible
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const raw: any = await res.json();
  const data = raw?.data ?? raw;

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

async function apiRequestPasswordResetOtp(payload: {
  email: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/forgot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: payload.email }),
  });

  // Intentionally returns same response for unknown emails.
  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg || "Không thể gửi OTP. Vui lòng thử lại.");
  }
}

async function apiVerifyPasswordResetOtp(payload: {
  email: string;
  otp: string;
}): Promise<{ resetToken: string }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: payload.email, otp: payload.otp }),
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg || "OTP không hợp lệ hoặc đã hết hạn.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const raw: any = await res.json();
  const resetToken: string | undefined =
    raw?.resetToken ?? raw?.data?.resetToken;
  if (!resetToken) {
    throw new Error("Không nhận được reset token từ hệ thống.");
  }
  return { resetToken };
}

async function apiResetPasswordWithToken(payload: {
  resetToken: string;
  newPassword: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resetToken: payload.resetToken,
      newPassword: payload.newPassword,
    }),
  });

  if (!res.ok) {
    const msg = await readErrorMessage(res);
    throw new Error(msg || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
  }
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
    console.log("[AUTH] loginWithEmail called");
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log("[AUTH] Calling API login...");
      const res = await apiLoginWithEmail(payload);
      console.log("[AUTH] API login response received");
      console.log("[AUTH] User role from API:", res.user.role);

      // Only allow student role for this mobile flow
      // if (res.user.role !== "STUDENT") {
      //   console.error('[AUTH] User role is not STUDENT, rejecting login');
      //   throw new Error("Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).");
      // }

      console.log("[AUTH] User role is STUDENT, proceeding with login");

      const tokens: AuthTokens = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        sessionId: res.sessionId,
      };

      console.log("[AUTH] Saving tokens and user to AsyncStorage...");
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user)),
      ]);
      console.log("[AUTH] Tokens and user saved to AsyncStorage");

      // Fetch student profile to get the truth about onboardingCompleted
      let onboardingIsCompleted = false;
      try {
        console.log("[AUTH] Fetching student profile to check onboarding...");
        const profileRes = await fetch(`${API_BASE_URL}/api/v1/student-profiles/me`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
        if (profileRes.ok) {
          const profileRaw = await profileRes.json();
          const profileData = profileRaw?.data ?? profileRaw;
          onboardingIsCompleted = profileData?.onboardingCompleted === true;
          console.log("[AUTH] Fetched onboardingCompleted from API:", onboardingIsCompleted);
        }
      } catch (err) {
        console.error("[AUTH] Failed to fetch student profile", err);
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        onboardingIsCompleted ? "true" : "false"
      );

      setState((prev) => {
        const newState = {
          ...prev,
          user: res.user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
          onboardingCompleted: onboardingIsCompleted,
        };
        console.log("[AUTH] State updated:", {
          isAuthenticated: newState.isAuthenticated,
          onboardingCompleted: newState.onboardingCompleted,
          isLoading: newState.isLoading,
          hasUser: !!newState.user,
          hasTokens: !!newState.tokens,
        });
        console.log("[AUTH] Full state:", JSON.stringify(newState, null, 2));
        return newState;
      });

      console.log("[AUTH] loginWithEmail completed successfully");
    } catch (error) {
      console.error("[AUTH] Error in loginWithEmail:", error);
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

  const requestPasswordResetOtp = useCallback(
    async (payload: { email: string }) => {
      await apiRequestPasswordResetOtp({ email: payload.email.trim() });
    },
    [],
  );

  const verifyPasswordResetOtp = useCallback(
    async (payload: { email: string; otp: string }) => {
      return await apiVerifyPasswordResetOtp({
        email: payload.email.trim(),
        otp: payload.otp.trim(),
      });
    },
    [],
  );

  const resetPasswordWithToken = useCallback(
    async (payload: { resetToken: string; newPassword: string }) => {
      await apiResetPasswordWithToken({
        resetToken: payload.resetToken,
        newPassword: payload.newPassword,
      });
      // Step 4 (re-sync): backend revokes sessions; locally, ensure we clear any cached auth.
      await logout();
    },
    [logout],
  );

  const changePassword = useCallback(
    async (payload: { currentPassword: string; newPassword: string }) => {
      const accessToken = state.tokens?.accessToken;
      if (!accessToken) {
        throw new Error("Bạn cần đăng nhập để đổi mật khẩu.");
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: payload.currentPassword,
          newPassword: payload.newPassword,
        }),
      });

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(msg || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
      }

      // Backend revokes sessions; force local logout so user must re-login.
      await logout();
    },
    [logout, state.tokens?.accessToken],
  );

  const hydrateFromOAuthLogin = useCallback(
    async (payload: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
      sessionId?: string;
      onboardingCompleted?: boolean; // Optional: từ response nếu có
    }) => {
      const tokens: AuthTokens = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        sessionId: payload.sessionId,
      };

      // Nếu có onboardingCompleted từ payload (response), dùng nó
      // Nếu không, đọc từ AsyncStorage
      let onboardingCompleted: boolean;
      if (payload.onboardingCompleted !== undefined) {
        onboardingCompleted = payload.onboardingCompleted;
        // Lưu vào AsyncStorage
        await AsyncStorage.setItem(
          STORAGE_KEYS.ONBOARDING_COMPLETED,
          onboardingCompleted ? "true" : "false",
        );
        console.log(
          "[AUTH] hydrateFromOAuthLogin - onboardingCompleted from payload:",
          onboardingCompleted,
        );
      } else {
        const onboardingCompletedStr = await AsyncStorage.getItem(
          STORAGE_KEYS.ONBOARDING_COMPLETED,
        );
        onboardingCompleted = onboardingCompletedStr === "true";
        console.log(
          "[AUTH] hydrateFromOAuthLogin - onboardingCompleted from storage:",
          onboardingCompleted,
        );
      }

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(payload.user)),
      ]);

      setState((prev) => ({
        ...prev,
        user: payload.user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        onboardingCompleted,
      }));
    },
    [],
  );

  const setOnboardingGoals = useCallback((goals: LearningGoal[]) => {
    setState((prev) => ({ ...prev, onboardingGoals: goals }));
    AsyncStorage.setItem(
      STORAGE_KEYS.ONBOARDING_GOALS,
      JSON.stringify(goals),
    ).catch(() => undefined);
  }, []);

  const setOnboardingGrade = useCallback((grade: number | null) => {
    setState((prev) => ({ ...prev, onboardingGrade: grade }));
    if (grade == null) {
      AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_GRADE).catch(
        () => undefined,
      );
    } else {
      AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_GRADE, String(grade)).catch(
        () => undefined,
      );
    }
  }, []);

  const markOnboardingCompleted = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, "true");
    setState((prev) => ({ ...prev, onboardingCompleted: true }));
  }, []);

  const hydrateOAuthAccessToken = useCallback(
    async (payload: {
      accessToken: string;
      refreshToken?: string;
      sessionId?: string;
    }) => {
      const userRes = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${payload.accessToken}`,
        },
      });

      if (!userRes.ok) {
        throw new Error("Không thể lấy thông tin người dùng từ token OAuth.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rawUser: any = await userRes.json();
      const userData = rawUser?.data ?? rawUser;

      const tokens: AuthTokens = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken ?? "",
        sessionId: payload.sessionId,
      };

      const onboardingFromApi = userData?.studentProfile?.onboardingCompleted;
      const onboardingFromStorage = await AsyncStorage.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
      );
      const onboardingCompleted =
        typeof onboardingFromApi === "boolean"
          ? onboardingFromApi
          : onboardingFromStorage === "true";

      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        avatarUrl: userData.avatarUrl ?? null,
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
      ]);

      setState((prev) => ({
        ...prev,
        user,
        tokens,
        isAuthenticated: true,
        onboardingCompleted,
        isLoading: false,
      }));
    },
    [],
  );

  /**
   * Xử lý response từ 2 endpoint mobile-signin (Google + Facebook).
   * Response shapes:
   *   A) Returning user : { needsProfileCompletion: false, user, accessToken, refreshToken, sessionId }
   *   B) New user       : { needsProfileCompletion: true,  completionToken }
   *
   * Returns { kind: 'returning' | 'new' }
   */
  const processMobileSigninResponse = useCallback(
    async (data: any): Promise<{ kind: "returning" | "new" }> => {
      if (data.needsProfileCompletion === true && data.completionToken) {
        // Case B: new user — lưu completionToken, chưa đăng nhập
        console.log("[AUTH] mobile-signin: new user → saving completionToken");
        await AsyncStorage.setItem(
          STORAGE_KEYS.OAUTH_COMPLETION_TOKEN,
          data.completionToken,
        );
        await AsyncStorage.removeItem(STORAGE_KEYS.TOKENS);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER);
        setState((prev) => ({ ...prev, isLoading: false }));
        return { kind: "new" };
      }

      if (
        data.needsProfileCompletion === false &&
        data.accessToken &&
        data.user
      ) {
        // Case A: returning user — hydrate auth state
        console.log("[AUTH] mobile-signin: returning user → hydrating state");
        const tokens: AuthTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? "",
          sessionId: data.sessionId,
        };
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          avatarUrl: data.user.avatarUrl ?? null,
        };
        const onboardingFromStorage = await AsyncStorage.getItem(
          STORAGE_KEYS.ONBOARDING_COMPLETED,
        );
        const onboardingCompleted = onboardingFromStorage === "true";
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens)),
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
          // Xóa completionToken thừa nếu còn sót
          AsyncStorage.removeItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN),
        ]);
        setState((prev) => ({
          ...prev,
          user,
          tokens,
          isAuthenticated: true,
          onboardingCompleted,
          isLoading: false,
        }));
        return { kind: "returning" };
      }

      // Unexpected response format
      throw new Error("Phản hồi từ máy chủ không hợp lệ. Vui lòng thử lại.");
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // ── Step 1: Cấu hình Google Sign-In ────────────────────────────────────────
      const webClientId = Constants.expoConfig?.extra?.googleWebClientId;
      if (!webClientId) {
        throw new Error(
          "Chưa cấu hình Google Client ID. Vui lòng liên hệ quản trị viên.",
        );
      }
      GoogleSignin.configure({ webClientId, offlineAccess: false });

      // ── Step 2: Đăng xuất phiên cũ (tránh cache token cũ) ────────────────────
      await GoogleSignin.signOut().catch(() => undefined);

      // ── Step 3: Trigger popup đăng nhập Google (Native) ────────────────────────
      console.log("[AUTH] loginWithGoogle: calling GoogleSignin.signIn()");
      let userInfo: any;
      try {
        userInfo = await GoogleSignin.signIn();
      } catch (signInErr: any) {
        if (signInErr.code === statusCodes.SIGN_IN_CANCELLED) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw new Error("Đăng nhập Google bị hủy.");
        }
        if (signInErr.code === statusCodes.IN_PROGRESS) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw new Error("Đang xử lý đăng nhập Google. Vui lòng đợi.");
        }
        if (signInErr.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setState((prev) => ({ ...prev, isLoading: false }));
          throw new Error(
            "Google Play Services chưa sẵn sàng. Vui lòng cập nhật Google Play.",
          );
        }
        throw signInErr;
      }

      // ── Step 4: Lấy idToken từ kết quả sign-in ────────────────────────────────
      const idToken: string | null =
        userInfo?.data?.idToken ?? userInfo?.idToken ?? null;

      if (!idToken) {
        throw new Error("Không lấy được Google ID Token. Vui lòng thử lại.");
      }

      console.log(
        "[AUTH] loginWithGoogle: got idToken, calling backend mobile-signin...",
      );

      // ── Step 5: Gửi idToken cho Backend ─────────────────────────────────
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/oauth/google/mobile-signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            idToken,
            role: "STUDENT",
          }),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(
          msg ||
            "Đăng nhập Google thất bại. Token không hợp lệ hoặc đã hết hạn.",
        );
      }

      const raw: any = await res.json();
      const data = raw?.data ?? raw;

      // ── Step 6: Xử lý response (new user / returning user) ───────────────────
      const outcome = await processMobileSigninResponse(data);
      console.log("[AUTH] loginWithGoogle: outcome =", outcome.kind);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [processMobileSigninResponse]);

  const loginWithFacebook = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      // ── Step 1: Đăng xuất phiên Facebook cũ ─────────────────────────────────
      LoginManager.logOut();

      // ── Step 2: Trigger popup đăng nhập Facebook (Native) ────────────────────
      console.log(
        "[AUTH] loginWithFacebook: calling LoginManager.logInWithPermissions()",
      );
      const loginResult = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);

      if (loginResult.isCancelled) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Đăng nhập Facebook bị hủy.");
      }

      // ── Step 3: Lấy Access Token ─────────────────────────────────────────────
      const tokenData = await AccessToken.getCurrentAccessToken();
      if (!tokenData?.accessToken || !tokenData?.userID) {
        throw new Error(
          "Không lấy được Facebook Access Token. Vui lòng thử lại.",
        );
      }

      const { accessToken: fbToken, userID } = tokenData;
      console.log(
        "[AUTH] loginWithFacebook: got accessToken, calling backend mobile-signin...",
      );

      // ── Step 4: Gửi Access Token cho Backend ─────────────────────────────────
      const res = await fetch(
        `${API_BASE_URL}/api/v1/auth/oauth/facebook/mobile-signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            accessToken: fbToken,
            userId: userID,
            role: "STUDENT",
          }),
        },
      );

      if (!res.ok) {
        const msg = await readErrorMessage(res);
        throw new Error(
          msg ||
            "Đăng nhập Facebook thất bại. Token không hợp lệ hoặc đã hết hạn.",
        );
      }

      const raw: any = await res.json();
      const data = raw?.data ?? raw;

      // ── Step 5: Xử lý response (new user / returning user) ───────────────────
      const outcome = await processMobileSigninResponse(data);
      console.log("[AUTH] loginWithFacebook: outcome =", outcome.kind);
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [processMobileSigninResponse]);

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
        const res = await fetch(
          `${API_BASE_URL}/api/v1/auth/oauth/complete-profile`,
          {
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
          },
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || "Hoàn tất hồ sơ thất bại.");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const response: any = await res.json();

        // Backend trả về format: { success, data: { accessToken, user, ... }, message, statusCode }
        const data = response.data || response;

        // Student role should return tokens immediately
        if (data.accessToken && data.user) {
          const tokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            sessionId: data.sessionId,
          };

          // Only allow student role
          if (data.user.role !== "STUDENT") {
            throw new Error(
              "Ứng dụng hiện chỉ hỗ trợ tài khoản Học sinh (Student).",
            );
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
        } else if (data.pendingApproval === true) {
          // Teacher/Parent roles need approval
          throw new Error(
            "Tài khoản của bạn đang chờ phê duyệt từ quản trị viên.",
          );
        } else {
          throw new Error(
            "Không nhận được thông tin đăng nhập sau khi hoàn tất hồ sơ.",
          );
        }
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        throw error;
      }
    },
    [setOnboardingGrade, setOnboardingGoals],
  );

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      loginWithEmail,
      loginWithGoogle,
      loginWithFacebook,
      requestPasswordResetOtp,
      verifyPasswordResetOtp,
      resetPasswordWithToken,
      changePassword,
      hydrateFromOAuthLogin,
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
      requestPasswordResetOtp,
      verifyPasswordResetOtp,
      resetPasswordWithToken,
      changePassword,
      hydrateFromOAuthLogin,
      completeOAuthProfile,
      logout,
      setOnboardingGoals,
      setOnboardingGrade,
      markOnboardingCompleted,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Defensive fallback:
    // In some startup races (especially with Expo Router hydration),
    // a route can render before provider mount. Return a safe loading state
    // instead of hard-crashing the whole app.
    return {
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      onboardingCompleted: false,
      onboardingGoals: [],
      onboardingGrade: null,
      loginWithEmail: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      loginWithGoogle: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      loginWithFacebook: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      requestPasswordResetOtp: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      verifyPasswordResetOtp: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      resetPasswordWithToken: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      changePassword: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      hydrateFromOAuthLogin: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      completeOAuthProfile: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      logout: async () => {
        throw new Error("Auth provider not ready yet.");
      },
      setOnboardingGoals: () => undefined,
      setOnboardingGrade: () => undefined,
      markOnboardingCompleted: async () => {
        throw new Error("Auth provider not ready yet.");
      },
    };
  }
  return ctx;
}
