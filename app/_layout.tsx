import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import * as Notifications from "expo-notifications";
import React, { useEffect } from "react";

import { AuthProvider } from "@/context/AuthContext";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { extractDeepLinkFromNotification } from "@/lib/notifications";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function InnerLayout() {
  const { theme } = useAppTheme();

  useEffect(() => {
    // Foreground presentation (can be refined per design later)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const href = extractDeepLinkFromNotification(data);
      if (href) {
        router.push(href as any);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="course/[id]"
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
