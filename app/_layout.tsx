import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

function InnerLayout() {
  const { theme } = useAppTheme();

  return (
    <AuthProvider>
      <ThemeProvider value={theme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
