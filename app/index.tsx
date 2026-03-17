import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const { isAuthenticated, onboardingCompleted, isLoading } = useAuth();
  const [showLoading, setShowLoading] = useState(true);

  // Loading 1s khi vào trang
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading || showLoading) {
    // Loading container 1s
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isAuthenticated && onboardingCompleted) {
    // User đã login và hoàn tất onboarding => redirect đến dashboard hoặc tabs
    return <Redirect href="/(tabs)" />;
  }

  if (isAuthenticated && !onboardingCompleted) {
    // User đã login nhưng chưa xong onboarding => quay lại luồng cá nhân hóa
    return <Redirect href="/(auth)/personalize" />;
  }

  // Chưa authenticated => redirect đến onboarding
  return <Redirect href="/(auth)/onboarding1" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});
