import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";

export default function AuthIndex() {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();

  if (isLoading) {
    // Simple splash while checking auth
    return null;
  }

  if (isAuthenticated && onboardingCompleted) {
    return <Redirect href="/dashboard" />;
  }

  if (isAuthenticated && !onboardingCompleted) {
    // User đã login nhưng chưa xong onboarding => quay lại luồng cá nhân hóa
    return <Redirect href="/(auth)/personalize" />;
  }

  return <Redirect href="/(auth)/onboarding1" />;
}
