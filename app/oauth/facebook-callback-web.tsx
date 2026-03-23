import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { STORAGE_KEYS } from "@/context/AuthContext";

export default function FacebookCallbackWeb() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = async () => {
      try {
        const url = new URL(window.location.href);
        const completionToken = url.searchParams.get("completionToken");
        const accessToken =
          url.searchParams.get("accessToken") ?? url.searchParams.get("token");
        const refreshToken = url.searchParams.get("refreshToken") ?? "";
        const sessionId = url.searchParams.get("sessionId") ?? undefined;

        if (completionToken && !accessToken) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.OAUTH_COMPLETION_TOKEN,
            completionToken
          );
          router.replace("/(auth)/complete-oauth");
          return;
        }

        if (!completionToken && !accessToken) {
          throw new Error("Không tìm thấy thông tin đăng nhập từ Facebook.");
        }

        if (accessToken) {
          await AsyncStorage.setItem(
            STORAGE_KEYS.TOKENS,
            JSON.stringify({ accessToken, refreshToken, sessionId })
          );
          router.replace("/(auth)/login");
        }
      } catch (e: any) {
        setError(e?.message ?? "Không thể hoàn tất đăng nhập Facebook.");
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
          Đăng nhập Facebook thất bại
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
        Đang hoàn tất đăng nhập Facebook...
      </Text>
    </View>
  );
}

