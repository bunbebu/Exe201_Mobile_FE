import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface Lesson {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isCompleted: boolean;
  isLocked: boolean;
  chapterId?: string;
  chapterTitle?: string;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export default function CourseCurriculumScreen() {
  const params = useLocalSearchParams();
  const courseId = params.id as string | undefined;
  const courseTitle = (params.title as string) || 'Khoá học của bạn';

  const { tokens } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!courseId || !tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/sequential-learning/curriculum/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Không thể tải curriculum của khoá học.');
        }

        const raw: any = await res.json();
        const data = raw?.data ?? raw;

        const parsedChapters: Chapter[] = [];

        if (data?.chapters) {
          data.chapters.forEach((chapter: any) => {
            const chapterLessons: Lesson[] = [];

            if (Array.isArray(chapter.lessons)) {
              chapter.lessons.forEach((lesson: any) => {
                chapterLessons.push({
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description,
                  orderIndex: lesson.orderIndex,
                  isCompleted: lesson.isCompleted || false,
                  isLocked: lesson.isLocked || false,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                });
              });
            }

            parsedChapters.push({
              id: chapter.id,
              title: chapter.title,
              orderIndex: chapter.orderIndex ?? 0,
              lessons: chapterLessons.sort((a, b) => a.orderIndex - b.orderIndex),
            });
          });

          parsedChapters.sort((a, b) => a.orderIndex - b.orderIndex);
        }

        setChapters(parsedChapters);
      } catch (error: any) {
        console.error('[COURSE] fetchCurriculum error:', error);
        Alert.alert('Lỗi', error?.message ?? 'Không thể tải danh sách bài học của khoá học.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCurriculum();
  }, [courseId, tokens?.accessToken]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải lộ trình học...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {courseTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {chapters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Khoá học này chưa có bài học nào.</Text>
          </View>
        ) : (
          chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterContainer}>
              <Text style={styles.chapterTitle}>
                {chapter.orderIndex}. {chapter.title}
              </Text>

              {chapter.lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    {
                      opacity: lesson.isLocked ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (lesson.isLocked) {
                      Alert.alert('Khóa', 'Bạn cần hoàn thành bài học trước để mở khóa bài này.');
                    } else {
                      router.push({
                        pathname: '/lesson/[id]',
                        params: {
                          id: lesson.id,
                          title: lesson.title,
                          description: lesson.description,
                          courseId,
                          courseTitle,
                        },
                      } as any);
                    }
                  }}
                  disabled={lesson.isLocked}
                >
                  <View style={styles.lessonLeft}>
                    <Ionicons
                      name={lesson.isCompleted ? 'checkmark-circle' : lesson.isLocked ? 'lock-closed' : 'play-circle'}
                      size={22}
                      color={lesson.isCompleted ? '#10B981' : lesson.isLocked ? '#9CA3AF' : '#3B82F6'}
                    />
                    <View style={styles.lessonInfo}>
                      <Text style={styles.lessonTitle}>
                        {lesson.orderIndex}. {lesson.title}
                      </Text>
                      <Text style={styles.lessonDescription} numberOfLines={2}>
                        {lesson.description}
                      </Text>
                    </View>
                  </View>
                  {!lesson.isLocked && (
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  emptyContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  chapterContainer: {
    marginBottom: 20,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonInfo: {
    marginLeft: 12,
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
});

