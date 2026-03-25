import Constants from "expo-constants";
import { Platform } from "react-native";
import type * as NotificationsType from "expo-notifications";

export type NotificationDeepLinkData = {
  /**
   * Expo Router path, e.g. "/lesson/123", "/course/abc", "/review", "/(tabs)/profile"
   */
  href?: string;
  /**
   * Backwards-compatible alias.
   */
  url?: string;
};

async function getNotificationsModule(): Promise<typeof NotificationsType | null> {
  // Avoid importing expo-notifications during web SSR.
  if (Platform.OS === "web" || typeof window === "undefined") return null;
  return require("expo-notifications") as typeof NotificationsType;
}

export function extractDeepLinkFromNotification(
  data: unknown
): string | null {
  if (!data || typeof data !== "object") return null;
  const maybe = data as Record<string, unknown>;
  const href = typeof maybe.href === "string" ? maybe.href : undefined;
  const url = typeof maybe.url === "string" ? maybe.url : undefined;
  const target = href || url;
  if (!target) return null;
  // Always expect internal routes (no http).
  if (target.startsWith("http://") || target.startsWith("https://")) return null;
  if (!target.startsWith("/")) return `/${target}`;
  return target;
}

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== "android") return;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3B82F6",
  });
}

export async function requestPushPermissions(): Promise<{
  status: "granted" | "denied" | "undetermined";
}> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) return { status: "denied" };
  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status as "granted" | "denied" | "undetermined";
  if (status !== "granted") {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status as "granted" | "denied" | "undetermined";
  }
  return { status };
}

export async function getExpoPushTokenSafe(): Promise<string | null> {
  // Web doesn't support native push this way.
  if (Platform.OS === "web") return null;
  // SDK 53+: Expo Go não suporta remote push token.
  // Só funciona em development build / app nativo.
  if (Constants.appOwnership === "expo") return null;
  const Notifications = await getNotificationsModule();
  if (!Notifications) return null;

  const { status } = await requestPushPermissions();
  if (status !== "granted") return null;

  await ensureAndroidNotificationChannel();

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data ?? null;
  } catch {
    return null;
  }
}

export async function scheduleLocalReminder(payload: {
  title: string;
  body: string;
  secondsFromNow: number;
  data?: NotificationDeepLinkData;
}): Promise<string> {
  const Notifications = await getNotificationsModule();
  if (!Notifications) {
    throw new Error("Notifications are unavailable in this environment.");
  }
  await ensureAndroidNotificationChannel();
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      repeats: false,
      seconds: Math.max(1, Math.floor(payload.secondsFromNow)),
    },
  });
}

