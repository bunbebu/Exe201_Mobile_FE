import { API_BASE_URL } from "@/config/api";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function GoogleOAuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        console.log('[CALLBACK] Google OAuth callback page loaded');
        const search = window.location.search || "";
        const backendUrl = `${API_BASE_URL}/api/v1/auth/oauth/google/callback${search}`;
        console.log('[CALLBACK] Calling backend:', backendUrl);

        const res = await fetch(backendUrl, {
          method: "GET",
          credentials: "include",
        });

        const text = await res.text();
        console.log('[CALLBACK] Backend response status:', res.status);

        if (!res.ok) {
          console.error('[CALLBACK] Backend error:', text);
          setError(text || "Đăng nhập Google thất bại.");
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        let data: unknown;
        try {
          data = JSON.parse(text);
          console.log('[CALLBACK] Parsed data:', data);
        } catch {
          console.error('[CALLBACK] Failed to parse JSON:', text);
          setError("Phản hồi từ máy chủ không phải JSON hợp lệ.");
          setTimeout(() => {
            window.close();
          }, 2000);
          return;
        }

        // Gửi message về parent window
        if (window.opener) {
          console.log('[CALLBACK] Sending postMessage to opener, origin:', window.location.origin);
          window.opener.postMessage(
            { source: "google-oauth-callback", payload: data },
            window.location.origin
          );
          console.log('[CALLBACK] postMessage sent successfully');
        } else {
          console.error('[CALLBACK] window.opener is null!');
        }

        // Đóng popup sau khi gửi message (tăng delay để đảm bảo message được gửi)
        setTimeout(() => {
          console.log('[CALLBACK] Closing popup window');
          window.close();
        }, 500);
      } catch (e: any) {
        console.error('[CALLBACK] Error in callback:', e);
        const message =
          e?.message || "Có lỗi xảy ra khi xử lý callback đăng nhập Google.";
        setError(message);
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    };

    void run();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.text}>
        {error ? "Đang xử lý callback Google (có lỗi)..." : "Đang xử lý callback Google..."}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#ffffff",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
  },
});

