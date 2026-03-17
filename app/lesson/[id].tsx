import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

interface LessonStatus {
  id: string;
  title: string;
  description?: string;
  isLocked: boolean;
  videoCompleted: boolean;
  quizCompleted: boolean;
  canAccessQuiz: boolean;
}

interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  contentMd?: string;
}

interface HtmlVideoProps {
  src: string;
}

// Custom Video component: dùng thẻ <video> nguyên bản trên web, placeholder trên mobile
const HtmlVideo: React.FC<HtmlVideoProps> = ({ src }) => {
  if (!src) {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="play-circle" size={48} color="#3B82F6" />
        <Text style={styles.videoText}>Video bài học đang được cập nhật</Text>
      </View>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.videoPlaceholder}>
        <Ionicons name="play-circle" size={48} color="#3B82F6" />
        <Text style={styles.videoText}>Video hiện chỉ hỗ trợ xem trên web.</Text>
      </View>
    );
  }

  // Web: render thẻ <video> giống đoạn bạn mong muốn
  return (
    // eslint-disable-next-line react/no-unknown-property
    <video
      src={src}
      controls
      playsInline
      style={{
        objectFit: 'contain',
        overflow: 'hidden',
        width: '100%',
        borderRadius: 12,
        backgroundColor: '#000',
      }}
    />
  );
};

export default function LessonScreen() {
  const params = useLocalSearchParams();
  const lessonId = params.id as string | undefined;
  const initialTitle = (params.title as string) || 'Bài học';
  const initialDescription = (params.description as string) || '';
  const fromCourseId = params.courseId as string | undefined;
  const fromCourseTitle = (params.courseTitle as string) || undefined;

  const { tokens } = useAuth();

  const [status, setStatus] = useState<LessonStatus | null>({
    id: lessonId || '',
    title: initialTitle,
    description: initialDescription,
    isLocked: false,
    videoCompleted: false,
    quizCompleted: false,
    canAccessQuiz: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingVideo, setIsMarkingVideo] = useState(false);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);

  useEffect(() => {
    if (!lessonId || !tokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/sequential-learning/lesson/${lessonId}/status`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Không thể tải trạng thái bài học.');
        }

        const raw: any = await res.json();

        // Backend có thể trả về { success, data: {...} } hoặc flat object
        const data = raw?.data ?? raw;
        const lesson = data.lesson ?? data; // fallback nếu lesson nằm trực tiếp ở root

        setStatus((prev) => ({
          id: lesson?.id ?? prev?.id ?? lessonId ?? '',
          title: (lesson?.title as string) || prev?.title || initialTitle,
          description:
            (lesson?.description as string) || prev?.description || initialDescription,
          isLocked: data.isLocked ?? prev?.isLocked ?? false,
          videoCompleted: data.videoProgress?.isCompleted ?? prev?.videoCompleted ?? false,
          quizCompleted: data.quizResult?.isCompleted ?? prev?.quizCompleted ?? false,
          canAccessQuiz: data.canAccessQuiz ?? prev?.canAccessQuiz ?? false,
        }));
      } catch (error: any) {
        console.error('[LESSON] fetchStatus error:', error);
        Alert.alert('Lỗi', error?.message ?? 'Không thể tải trạng thái bài học.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, [lessonId, tokens?.accessToken]);

  // Fetch lesson detail để lấy video.url
  useEffect(() => {
    if (!lessonId || !tokens?.accessToken) {
      return;
    }

    const fetchLessonDetail = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/lessons/${lessonId}`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Không thể tải thông tin bài học.');
        }

        const raw: any = await res.json();
        const data = raw?.data ?? raw;

        setLessonDetail({
          id: data.id,
          title: data.title,
          description: data.description,
          videoUrl: data.video?.url,
          durationSeconds: data.video?.durationSeconds,
          contentMd: data.contentMd,
        });
      } catch (error: any) {
        console.error('[LESSON] fetchLessonDetail error:', error);
        // Không alert để tránh làm phiền nếu chỉ thiếu video
      }
    };

    void fetchLessonDetail();
  }, [lessonId, tokens?.accessToken]);

  const handleMarkVideoCompleted = async () => {
    if (!lessonId || !tokens?.accessToken) return;

    setIsMarkingVideo(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/sequential-learning/video/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || 'Không thể đánh dấu đã xem xong video.');
      }

      setStatus((prev) =>
        prev
          ? {
              ...prev,
              videoCompleted: true,
            }
          : prev
      );

      Alert.alert('Thành công', 'Đã đánh dấu xem xong video.');
    } catch (error: any) {
      console.error('[LESSON] markVideo error:', error);
      Alert.alert('Lỗi', error?.message ?? 'Không thể đánh dấu đã xem xong video.');
    } finally {
      setIsMarkingVideo(false);
    }
  };

  const handleLoadQuiz = () => {
    // Navigate đến màn hình quiz riêng
    router.push({
      pathname: '/lesson/[id]/quiz',
      params: {
        id: lessonId,
        title: status?.title || initialTitle,
        courseId: fromCourseId,
        courseTitle: fromCourseTitle,
      },
    } as any);
  };


  if (isLoading || !status) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải bài học...</Text>
      </SafeAreaView>
    );
  }

  if (status.isLocked) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="lock-closed" size={40} color="#6B7280" />
        <Text style={styles.lockedText}>Bài học này đang bị khóa. Hãy hoàn thành bài trước đó.</Text>
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
            {status.title}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Video section */}
        <View style={styles.videoCard}>
          <HtmlVideo src={lessonDetail?.videoUrl || ''} />

          <Text style={styles.lessonDescription}>
            {lessonDetail?.description || status.description}
          </Text>
          <TouchableOpacity
            style={[styles.videoButton, status.videoCompleted && styles.videoButtonCompleted]}
            onPress={handleMarkVideoCompleted}
            disabled={isMarkingVideo}
          >
            {isMarkingVideo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.videoButtonText}>
                {status.videoCompleted ? 'Đã đánh dấu xem xong video' : 'Đánh dấu xem xong video'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quiz section */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <Text style={styles.quizTitle}>Quiz kiểm tra nhanh</Text>
            {status.quizCompleted && <Text style={styles.quizBadge}>Đã hoàn thành</Text>}
          </View>

          <TouchableOpacity
            style={[styles.loadQuizButton, !status.videoCompleted && styles.loadQuizButtonDisabled]}
            onPress={handleLoadQuiz}
            disabled={!status.videoCompleted}
          >
            <Text style={styles.loadQuizButtonText}>
              {status.videoCompleted ? 'Bắt đầu làm bài tập' : 'Hãy xem xong video trước'}
            </Text>
          </TouchableOpacity>
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
  lockedText: {
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
  videoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  videoPlaceholder: {
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  videoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  // Video responsive: width 100% + giữ tỉ lệ 16:9, giống <video style="object-fit: contain; width: 100%">
  videoPlayer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  videoButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  videoButtonCompleted: {
    backgroundColor: '#10B981',
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  quizCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  quizBadge: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  loadQuizButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loadQuizButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loadQuizButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  quizContent: {
    marginTop: 8,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionButtonCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  optionButtonWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  optionTextCorrect: {
    color: '#059669',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#DC2626',
    fontWeight: '600',
  },
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#6EE7B7',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ECFEFF',
  },
  resultText: {
    fontSize: 14,
    color: '#047857',
  },
});

