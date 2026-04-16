import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/use-colors";
import { API_BASE_URL } from "@/config/api";

interface ApiImage {
  url?: string;
}

interface CourseItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: ApiImage | null;
}

export default function SubjectCoursesScreen() {
  const colors = useColors();
  const { tokens } = useAuth();
  const params = useLocalSearchParams();
  const subjectId = params.id as string | undefined;
  const subjectName = (params.name as string) || "Môn học";

  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCoursesBySubject = async () => {
      if (!subjectId) {
        setIsLoading(false);
        setErrorMessage("Thiếu subjectId");
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const filters = encodeURIComponent(
          JSON.stringify({
            status: "Published",
            subjectId,
          }),
        );
        const url = `${API_BASE_URL}/api/v1/courses?page=1&limit=10&filters=${filters}`;

        const authHeaders: any = {};
        if (tokens?.accessToken) {
          authHeaders["Authorization"] = `Bearer ${tokens.accessToken}`;
        }

        const res = await fetch(url, { headers: authHeaders });

        if (!res.ok) {
          throw new Error("Không thể tải danh sách khóa học theo môn học");
        }

        const json = await res.json();
        const items: CourseItem[] = json?.data?.items ?? [];

        if (!isMounted) return;
        setCourses(items);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Đã có lỗi xảy ra",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchCoursesBySubject();
    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {subjectName}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={[styles.stateText, { color: colors.mutedText }]}>
            Đang tải khóa học...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {courses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: colors.cardBg }]}
              onPress={() =>
                router.push({
                  pathname: "/course/[id]",
                  params: {
                    id: course.id,
                    title: course.title,
                  },
                } as any)
              }
            >
              <View
                style={[
                  styles.courseImage,
                  { backgroundColor: colors.inputBg },
                ]}
              >
                {course.thumbnailUrl?.url ? (
                  <Image
                    source={{ uri: course.thumbnailUrl.url }}
                    style={styles.courseThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="play-circle" size={32} color="#3B82F6" />
                )}
              </View>
              <View style={styles.courseInfo}>
                <Text
                  style={[styles.courseTitle, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {course.title}
                </Text>
                <Text
                  style={[
                    styles.courseDescription,
                    { color: colors.secondaryText },
                  ]}
                  numberOfLines={2}
                >
                  {course.description || "Khóa học trong danh mục này"}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {courses.length === 0 ? (
            <Text style={[styles.stateText, { color: colors.mutedText }]}>
              Chưa có khóa học nào trong môn này.
            </Text>
          ) : null}
          {errorMessage ? (
            <Text style={[styles.stateText, { color: "#EF4444" }]}>
              {errorMessage}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  courseCard: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  courseImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  courseThumb: {
    width: "100%",
    height: "100%",
  },
  courseInfo: {
    flex: 1,
    justifyContent: "center",
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
  },
});
