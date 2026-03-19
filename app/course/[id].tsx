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
import { useColors } from '@/hooks/use-colors';

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

interface ExamMeta {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  totalQuestions: number;
  timeLimitSeconds: number;
  passingScore?: number;
}

export default function CourseCurriculumScreen() {
  const params = useLocalSearchParams();
  const courseId = params.id as string | undefined;
  const courseTitle = (params.title as string) || 'Khoá học của bạn';

  const { tokens } = useAuth();
  const colors = useColors();

  const [isLoading, setIsLoading] = useState(true);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState(true);
  const [exams, setExams] = useState<ExamMeta[]>([]);

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

  useEffect(() => {
    const fetchExams = async () => {
      if (!courseId || !tokens?.accessToken) {
        setIsExamsLoading(false);
        return;
      }

      setIsExamsLoading(true);
      try {
        // GET /api/v1/exams không hỗ trợ filter courseId (theo swagger bạn cung cấp),
        // nên FE sẽ lọc theo courseId.
        const pageSize = 10;
        let page = 1;
        const all: ExamMeta[] = [];

        for (let i = 0; i < 10; i++) {
          const res = await fetch(
            `${API_BASE_URL}/api/v1/exams?page=${page}&limit=${pageSize}`,
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            }
          );

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || 'Không thể tải danh sách đề thi thử.');
          }

          const raw: any = await res.json();
          // Backend geralmente retorna: { success: true, data: { items: [...] } }
          // então aqui precisamos extrair `items` (não `data` inteiro).
          const list: ExamMeta[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data?.items)
              ? raw.data.items
              : Array.isArray(raw?.data)
                ? raw.data
                : [];

          if (list.length === 0) {
            // Sem itens pra acumular; ainda assim permite seguir lógica de paginação via `list.length`.
            // (Opcional, mas evita estados confusos caso o backend mude shape)
          }
          all.push(...list);

          if (list.length < pageSize) break;
          page += 1;
        }

        setExams(all.filter((e) => e.courseId === courseId));
      } catch (error: any) {
        console.error('[COURSE] fetchExams error:', error);
        setExams([]);
      } finally {
        setIsExamsLoading(false);
      }
    };

    void fetchExams();
  }, [courseId, tokens?.accessToken]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải lộ trình học...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {courseTitle}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {chapters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>Khoá học này chưa có bài học nào.</Text>
          </View>
        ) : (
          chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterContainer}>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>
                {chapter.orderIndex}. {chapter.title}
              </Text>

              {chapter.lessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonCard,
                    { backgroundColor: colors.cardBg },
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
                      color={lesson.isCompleted ? '#10B981' : lesson.isLocked ? colors.mutedText : colors.tint}
                    />
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, { color: colors.text }]}>
                        {lesson.orderIndex}. {lesson.title}
                      </Text>
                      <Text style={[styles.lessonDescription, { color: colors.secondaryText }]} numberOfLines={2}>
                        {lesson.description}
                      </Text>
                    </View>
                  </View>
                  {!lesson.isLocked && (
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

        {/* Exam list (filtered by courseId on FE) */}
        <View style={styles.examSection}>
          <View style={styles.examHeader}>
            <Text style={[styles.examTitle, { color: colors.text }]}>Thi thử</Text>
            <Text style={[styles.examSubtitle, { color: colors.secondaryText }]}>Chọn đề và làm ngay</Text>
          </View>

          {isExamsLoading ? (
            <View style={styles.examLoading}>
              <ActivityIndicator size="small" color={colors.tint} />
              <Text style={[styles.examLoadingText, { color: colors.secondaryText }]}>Đang tải đề thi thử...</Text>
            </View>
          ) : exams.length === 0 ? (
            <View style={styles.examEmpty}>
              <Ionicons name="document-text-outline" size={28} color={colors.mutedText} />
              <Text style={[styles.examEmptyText, { color: colors.secondaryText }]}>
                Chưa có đề thi thử cho khoá học này.
              </Text>
            </View>
          ) : (
            exams.map((exam) => (
              <View key={exam.id} style={[styles.examCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.examCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.examCardTitle, { color: colors.text }]} numberOfLines={2}>
                      {exam.title}
                    </Text>
                    {!!exam.description && (
                      <Text style={[styles.examCardDesc, { color: colors.secondaryText }]} numberOfLines={2}>
                        {exam.description}
                      </Text>
                    )}
                  </View>
                  <View style={styles.examMeta}>
                    <Ionicons name="time-outline" size={16} color={colors.tint} />
                    <Text style={[styles.examMetaText, { color: colors.tint }]}>
                      {formatDuration(exam.timeLimitSeconds)}
                    </Text>
                  </View>
                </View>

                <View style={styles.examCardBottom}>
                  <Text style={[styles.examMetaRowText, { color: colors.secondaryText }]}>
                    {exam.totalQuestions} câu • Ngưỡng {exam.passingScore ?? 0}%
                  </Text>
                  <TouchableOpacity
                    style={[styles.examStartBtn, { backgroundColor: colors.tint }]}
                    onPress={() => {
                      router.push(
                        {
                          pathname: '/exams/[id]/start',
                          params: { id: exam.id },
                        } as any
                      );
                    }}
                  >
                    <Text style={styles.examStartBtnText}>Vào thi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
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
  // --- Exam styles (render list of mock exams) ---
  examSection: {
    marginTop: 16,
  },
  examHeader: {
    marginBottom: 12,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  examSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  examLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  examLoadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
  },
  examEmpty: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  examEmptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  examCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  examCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  examCardDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examMetaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  examCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  examMetaRowText: {
    fontSize: 13,
    color: '#6B7280',
  },
  examStartBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  examStartBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

