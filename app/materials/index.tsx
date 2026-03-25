import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "@/hooks/use-colors";

type MaterialItem = {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
  fileSize?: number;
  downloadCount?: number;
  createdAt?: string;
};

function normalizeMaterial(raw: any, index: number): MaterialItem {
  return {
    id:
      String(
        raw?.id ??
          raw?._id ??
          raw?.materialId ??
          raw?.slug ??
          `material-${index}`
      ),
    title: String(raw?.title ?? raw?.name ?? raw?.materialName ?? "Tài liệu"),
    lessonId: raw?.lessonId,
    description: raw?.description ?? raw?.summary ?? raw?.content ?? "",
    type: raw?.type ?? raw?.format ?? raw?.mimeType,
    url:
      raw?.file?.url ??
      raw?.url ??
      raw?.fileUrl ??
      raw?.link ??
      raw?.resourceUrl,
    fileSize: raw?.file?.fileSize ?? raw?.fileSize,
    downloadCount: raw?.downloadCount,
    createdAt: raw?.createdAt ?? raw?.updatedAt,
  };
}

export default function MaterialsScreen() {
  const colors = useColors();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMaterials = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch(
          "https://rest-api-edu-tech-with-nestjs-mongo.vercel.app/api/v1/materials"
        );

        if (!res.ok) {
          throw new Error("Không thể tải danh sách tài liệu");
        }

        const json: any = await res.json();
        const rawItems = Array.isArray(json)
          ? json
          : Array.isArray(json?.data?.items)
            ? json.data.items
            : Array.isArray(json?.data)
              ? json.data
              : Array.isArray(json?.items)
                ? json.items
                : [];

        const normalized = rawItems.map((item: any, idx: number) =>
          normalizeMaterial(item, idx)
        );

        if (!isMounted) return;
        setMaterials(normalized);
      } catch (error: any) {
        if (!isMounted) return;
        setErrorMessage(error?.message ?? "Đã có lỗi xảy ra");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadMaterials();

    return () => {
      isMounted = false;
    };
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.headerBg,
        },
        backButton: {
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          flex: 1,
          textAlign: "center",
          fontSize: 18,
          fontWeight: "700",
          color: colors.text,
          marginRight: 40,
        },
        listContent: {
          padding: 16,
          gap: 12,
        },
        card: {
          borderRadius: 14,
          padding: 14,
          backgroundColor: colors.cardBg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: {
          fontSize: 16,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 6,
        },
        description: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.secondaryText,
          marginBottom: 10,
        },
        footer: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        chip: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: colors.inputBg,
        },
        chipText: {
          fontSize: 12,
          color: colors.mutedText,
          fontWeight: "600",
        },
        openRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        openText: {
          fontSize: 13,
          color: colors.tint,
          fontWeight: "600",
        },
        stateContainer: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        },
        stateText: {
          marginTop: 10,
          fontSize: 14,
          color: colors.secondaryText,
          textAlign: "center",
        },
        openButton: {
          marginTop: 10,
          borderRadius: 10,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: colors.tint,
        },
        openButtonText: {
          color: "#fff",
          fontSize: 14,
          fontWeight: "700",
        },
      }),
    [colors]
  );

  const openMaterial = async (item: MaterialItem) => {
    if (!item.url) {
      Alert.alert("Thông báo", "Tài liệu này chưa có liên kết.");
      return;
    }

    const supported = await Linking.canOpenURL(item.url);
    if (!supported) {
      Alert.alert("Lỗi", "Không thể mở liên kết tài liệu.");
      return;
    }
    await Linking.openURL(item.url);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thư viện tài liệu</Text>
      </View>

      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <Text style={styles.stateText}>Đang tải tài liệu...</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={styles.stateText}>{errorMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>Chưa có tài liệu nào.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => void openMaterial(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              {!!item.description && (
                <Text style={styles.description} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
              <View style={styles.footer}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {item.type ? String(item.type).toUpperCase() : "MATERIAL"}
                  </Text>
                </View>
                <View style={styles.openRow}>
                  <Text style={styles.openText}>
                    {item.fileSize
                      ? `${Math.max(1, Math.round(item.fileSize / 1024))} KB`
                      : "Mở tài liệu"}
                  </Text>
                  <Ionicons name="open-outline" size={14} color={colors.tint} />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.openButton, { opacity: item.url ? 1 : 0.6 }]}
                onPress={() => void openMaterial(item)}
                disabled={!item.url}
              >
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.openButtonText}>Mở tài liệu</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

