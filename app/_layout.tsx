import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React, { useEffect } from "react";
import { Platform } from "react-native";

import { AuthProvider } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { extractDeepLinkFromNotification } from "@/lib/notifications";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function InnerLayout() {
  const { theme } = useAppTheme();

  useEffect(() => {
    // Do not initialize expo-notifications in web/SSR.
    if (Platform.OS === "web") return;

    let isMounted = true;
    let sub: { remove: () => void } | null = null;

    void (async () => {
      const Notifications = require("expo-notifications") as typeof import("expo-notifications");
      if (!isMounted) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const href = extractDeepLinkFromNotification(data);
        if (href) {
          router.push(href as any);
        }
      });
    })();

    return () => {
      isMounted = false;
      sub?.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="paywall"
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen name="exams/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="course/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="subject/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="tips/memory"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="materials/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="lesson/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="lesson/[id]/quiz"
            options={{ headerShown: false }}
          />
        <Stack.Screen
          name="exams/[id]/start"
          options={{ headerShown: false }}
        />
          <Stack.Screen name="review" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <InnerLayout />
    </AppThemeProvider>
  );
}
