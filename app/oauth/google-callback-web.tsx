import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { STORAGE_KEYS } from "@/context/AuthContext"; // if not exported, duplicate keys locally

export default function GoogleCallbackWeb() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      try {
        const url = new URL(window.location.href);
        const completionToken = url.searchParams.get("completionToken");
        const accessToken = url.searchParams.get("accessToken");
        const refreshToken = url.searchParams.get("refreshToken") ?? "";
        const sessionId = url.searchParams.get("sessionId") ?? undefined;

        if (completionToken && !accessToken) {
          // First-time OAuth: need to complete profile
          await AsyncStorage.setItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN, completionToken);
          router.replace("/(auth)/complete-oauth");
          return;
        }

        if (!completionToken && !accessToken) {
          throw new Error("Không tìm thấy thông tin đăng nhập từ Google.");
        }

        // If backend also encodes user info in query params, you can parse and save here.
        // For now, just store tokens; user will be fetched via standard login flow if needed.
        if (accessToken) {
          // Save minimal tokens; AuthContext will read them on app load
          await AsyncStorage.setItem(
            STORAGE_KEYS.TOKENS,
            JSON.stringify({ accessToken, refreshToken, sessionId })
          );
          // Let AuthContext initialize from storage and redirect via login screen effect
          router.replace("/(auth)/login");
        }
      } catch (e: any) {
        setError(e?.message ?? "Không thể hoàn tất đăng nhập Google.");
      }
    };

    void handle();
  }, [router]);

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
          Đăng nhập Google thất bại
        </Text>
        <Text style={{ fontSize: 14, color: "#4B5563", textAlign: "center" }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text
        style={{
          marginTop: 12,
          fontSize: 14,
          color: "#4B5563",
          textAlign: "center",
        }}
      >
        Đang hoàn tất đăng nhập Google...
      </Text>
    </View>
  );
}


