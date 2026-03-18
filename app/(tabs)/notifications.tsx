import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/use-colors";
import { getExpoPushTokenSafe, scheduleLocalReminder } from "@/lib/notifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === "web";

const STORAGE_KEYS = {
  PUSH_ENABLED: "@edutech/pushEnabled",
};

type InboxContext = {
  applicationIdentifier: string;
  subscriberId: string;
  socketUrl: string;
  subscriberHash: string | null;
};

function Pill({
  icon,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "blue" | "amber" | "green" | "purple";
}) {
  const colors = useColors();
  const map = {
    blue: { fg: "#3B82F6", bg: colors.qaBlueBg },
    amber: { fg: "#F59E0B", bg: colors.qaYellowBg },
    green: { fg: "#10B981", bg: colors.qaGreenBg },
    purple: { fg: "#8B5CF6", bg: colors.qaPurpleBg },
  } as const;
  const t = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Ionicons name={icon} size={14} color={t.fg} />
      <Text style={[styles.pillText, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const colors = useColors();
  const { tokens } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [ctx, setCtx] = useState<InboxContext | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);

  const canUsePush = !isWeb;

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_ENABLED);
      setPushEnabled(stored === "true");
    })().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!tokens?.accessToken) {
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/notifications/me/inbox-context`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Não foi possível carregar notificações.");
        }
        const raw: any = await res.json();
        const data = raw?.data ?? raw;
        setCtx({
          applicationIdentifier: data.applicationIdentifier ?? "",
          subscriberId: data.subscriberId ?? "",
          socketUrl: data.socketUrl ?? "",
          subscriberHash: data.subscriberHash ?? null,
        });
      } catch (e: any) {
        console.error("Inbox context error:", e);
        setCtx(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tokens?.accessToken]);

  const headline = useMemo(() => {
    if (!ctx) return "Fique por dentro";
    return "Seu Inbox está pronto";
  }, [ctx]);

  const subtitle = useMemo(() => {
    if (!ctx) return "Ative lembretes e volte para manter seu streak.";
    return "Toque em um push e caia direto na ação certa.";
  }, [ctx]);

  const togglePush = async (next: boolean) => {
    setPushEnabled(next);
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_ENABLED, next ? "true" : "false");

    if (!next) {
      setPushToken(null);
      return;
    }

    if (!canUsePush) {
      Alert.alert("Não suportado", "Push notifications não estão disponíveis no Web.");
      setPushEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_ENABLED, "false");
      return;
    }

    const token = await getExpoPushTokenSafe();
    if (!token) {
      Alert.alert("Permissão necessária", "Ative as permissões de notificação para receber lembretes.");
      setPushEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_ENABLED, "false");
      return;
    }
    setPushToken(token);
    // Observação: o swagger atual não mostra endpoint para registrar o token no backend.
  };

  const sendDemo = async () => {
    try {
      if (!pushEnabled) {
        Alert.alert("Ative primeiro", "Ative Push para testar o lembrete.");
        return;
      }

      await scheduleLocalReminder({
        title: "Ei, não quebra o streak!",
        body: "Você está com 5 dias seguidos. Faça 1 lição agora e mantém a sequência.",
        secondsFromNow: 3,
        data: { href: "/review" },
      });

      Alert.alert("Agendado", "Em ~3s você vai receber um push. Toque nele para abrir direto o Ôn tập.");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Erro", e?.message ?? "Não foi possível agendar a notificação.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notificações</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.hero, { backgroundColor: colors.cardBg }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: colors.qaPurpleBg }]}>
              <Ionicons name="notifications" size={22} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>{headline}</Text>
              <Text style={[styles.heroSubtitle, { color: colors.secondaryText }]}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.pillsRow}>
            <Pill icon="flame" label="Streak" tone="amber" />
            <Pill icon="clipboard-outline" label="Bài tập mới" tone="blue" />
            <Pill icon="alarm-outline" label="Nhắc lịch" tone="green" />
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                Carregando contexto...
              </Text>
            </View>
          ) : ctx ? (
            <View style={[styles.ctxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ctxTitle, { color: colors.text }]}>Inbox Context (Novu)</Text>
              <Text style={[styles.ctxLine, { color: colors.secondaryText }]}>
                subscriberId: <Text style={[styles.ctxMono, { color: colors.text }]}>{ctx.subscriberId}</Text>
              </Text>
              <Text style={[styles.ctxLine, { color: colors.secondaryText }]}>
                socketUrl: <Text style={[styles.ctxMono, { color: colors.text }]}>{ctx.socketUrl}</Text>
              </Text>
              <Text style={[styles.ctxHint, { color: colors.mutedText }]}>
                Esse endpoint confirma que o backend já está pronto para inbox/in-app notifications.
              </Text>
            </View>
          ) : (
            <View style={[styles.ctxCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ctxTitle, { color: colors.text }]}>Inbox</Text>
              <Text style={[styles.ctxHint, { color: colors.secondaryText }]}>
                Não foi possível carregar o contexto agora. Você ainda pode ativar push e testar deep link.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Push & lembretes</Text>

          <View style={[styles.card, { backgroundColor: colors.cardBg }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Ativar Push</Text>
                <Text style={[styles.rowSubtitle, { color: colors.secondaryText }]}>
                  Receba lembretes e abra direto na tela certa (deep link).
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(v) => void togglePush(v)}
                trackColor={{ false: "#E5E7EB", true: "#3B82F6" }}
                thumbColor="#fff"
              />
            </View>

            {!!pushToken && (
              <View style={[styles.tokenBox, { borderColor: colors.border }]}>
                <Text style={[styles.tokenLabel, { color: colors.mutedText }]}>Expo Push Token</Text>
                <Text style={[styles.tokenValue, { color: colors.text }]} numberOfLines={2}>
                  {pushToken}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { opacity: pushEnabled ? 1 : 0.6 }]}
              onPress={() => void sendDemo()}
              disabled={!pushEnabled}
            >
              <Ionicons name="paper-plane-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Testar lembrete (deep link)</Text>
            </TouchableOpacity>

            <Text style={[styles.footnote, { color: colors.mutedText }]}>
              Toque no push: o app vai abrir direto em `"/review"` (sem passar pela Home).
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: isWeb ? 900 : "100%",
    alignSelf: isWeb ? "center" : "stretch",
    width: isWeb ? "100%" : SCREEN_WIDTH,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: isTablet ? 32 : isWeb ? Math.min(SCREEN_WIDTH * 0.05, 40) : 20,
    paddingVertical: isTablet ? 18 : 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  hero: {
    margin: isTablet ? 32 : isWeb ? 24 : 20,
    borderRadius: 20,
    padding: isTablet ? 20 : 16,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: "800",
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: isTablet ? 14 : 13,
    lineHeight: isTablet ? 20 : 18,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  ctxCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  ctxTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  ctxLine: {
    fontSize: 12,
    lineHeight: 18,
  },
  ctxMono: {
    fontWeight: "700",
  },
  ctxHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: isTablet ? 32 : isWeb ? 24 : 20,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    padding: isTablet ? 18 : 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  tokenBox: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  tokenValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: 14,
    backgroundColor: "#3B82F6",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  footnote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
  },
});

