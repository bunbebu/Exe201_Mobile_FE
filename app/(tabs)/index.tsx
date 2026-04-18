import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress?: () => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isCompleted: boolean;
  isLocked: boolean;
  isNext: boolean;
  chapterId?: string;
  chapterTitle?: string;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface DashboardHeaderData {
  fullName: string;
  currentStreak: number;
  dailyProgressPercent: number;
}

interface DashboardData {
  lessons: Lesson[]; // flatten để tính progress / find next lesson
  chapters: Chapter[]; // để hiển thị dạng tree theo chương
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createHomeStyles(windowWidth), [windowWidth]);
  const colors = useColors();
  const { tokens, user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [headerData, setHeaderData] = useState<DashboardHeaderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState<string>('Lộ trình học của bạn');

  const quickActions: QuickActionProps[] = [
    {
      icon: 'refresh-circle-outline',
      label: 'Ôn tập',
      color: '#3B82F6',
      bgColor: colors.qaBlueBg,
      onPress: () => router.push('/review'),
    },
    { icon: 'clipboard-outline', label: 'Bài tập', color: '#F59E0B', bgColor: colors.qaYellowBg },
    {
      icon: 'checkbox-outline',
      label: 'Kiểm tra',
      color: '#10B981',
      bgColor: colors.qaGreenBg,
      onPress: () => router.push('/exams' as any),
    },
    {
      icon: 'library-outline',
      label: 'Thư viện',
      color: '#8B5CF6',
      bgColor: colors.qaPurpleBg,
      onPress: () => router.push('/materials' as any),
    },
  ];

  // Fetch dashboard header data
  useEffect(() => {
    const fetchDashboardHeader = async () => {
      if (!tokens?.accessToken) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (res.ok) {
          const data: any = await res.json();

          // Extract header data from response
          // Assuming API returns: { user: { fullName }, studentProfile: { currentStreak }, dailyProgress: { percent } }
          setHeaderData({
            fullName: data.user?.fullName || data.fullName || user?.email?.split('@')[0] || 'Bạn',
            currentStreak: data.studentProfile?.currentStreak || data.currentStreak || 0,
            dailyProgressPercent: data.dailyProgress?.percent || data.dailyProgressPercent || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard header:', error);
        // Fallback to user email if API fails
        setHeaderData({
          fullName: user?.email?.split('@')[0] || 'Bạn',
          currentStreak: 0,
          dailyProgressPercent: 0,
        });
      }
    };

    fetchDashboardHeader();
  }, [tokens, user]);

  // Fetch courses để lấy courseId đầu tiên
  useEffect(() => {
    const fetchCourses = async () => {
      if (!tokens?.accessToken) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/courses/personalized`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (res.ok) {
          const data: any = await res.json();

          // Backend trả về { success, data: { items: [...] } }
          const items: any[] = data?.data?.items ?? [];

          if (items.length > 0) {
            const firstCourse = items[0];
            setSelectedCourseId(firstCourse.id);
            setSelectedCourseTitle(firstCourse.title || 'Lộ trình học của bạn');
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, [tokens]);

  // Fetch curriculum với lesson progress
  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!tokens?.accessToken || !selectedCourseId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/v1/sequential-learning/curriculum/${selectedCourseId}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error('Failed to fetch curriculum');
        }

        const raw: any = await res.json();

        // Backend nhiều khả năng trả về { success, data: { chapters: [...] } }
        const data = raw?.data ?? raw;

        // Transform data: chapters + lessons với trạng thái
        const lessons: Lesson[] = [];
        const chapters: Chapter[] = [];
        let foundNext = false;

        if (data?.chapters) {
          data.chapters.forEach((chapter: any) => {
            const chapterLessons: Lesson[] = [];

            if (chapter.lessons) {
              chapter.lessons.forEach((lesson: any) => {
                // Dùng đúng field từ API curriculum: isCompleted, isLocked, videoWatched, quizCompleted
                const isCompleted = lesson.isCompleted || false;
                const isLocked = lesson.isLocked || false;

                // Bài tiếp theo là bài đầu tiên chưa completed và không locked
                const isNext = !foundNext && !isCompleted && !isLocked;

                if (isNext) {
                  foundNext = true;
                }

                const lessonItem: Lesson = {
                  id: lesson.id,
                  title: lesson.title,
                  description: lesson.description,
                  orderIndex: lesson.orderIndex,
                  isCompleted,
                  isLocked: isLocked && !isCompleted,
                  isNext,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                };

                lessons.push(lessonItem);
                chapterLessons.push(lessonItem);
              });
            }

            chapters.push({
              id: chapter.id,
              title: chapter.title,
              orderIndex: chapter.orderIndex ?? 0,
              lessons: chapterLessons.sort((a, b) => a.orderIndex - b.orderIndex),
            });
          });

          // Sắp xếp chương theo orderIndex
          chapters.sort((a, b) => a.orderIndex - b.orderIndex);
        }

        const completedLessons = lessons.filter((l) => l.isCompleted).length;
        const progressPercent =
          lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0;

        setDashboardData({
          lessons,
          chapters,
          totalLessons: lessons.length,
          completedLessons,
          progressPercent,
        });
      } catch (error: any) {
        console.error('Error fetching curriculum:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách bài học. Vui lòng thử lại.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurriculum();
  }, [tokens, selectedCourseId]);

  const getLessonStatusColor = (lesson: Lesson) => {
    if (lesson.isCompleted) {
      return '#10B981'; // Xanh - đã hoàn thành
    }
    if (lesson.isNext) {
      return '#F59E0B'; // Vàng - bài tiếp theo (unlock)
    }
    return '#9CA3AF'; // Xám - locked
  };

  const getLessonStatusBg = (lesson: Lesson) => {
    if (lesson.isCompleted) {
      return '#D1FAE5'; // Xanh nhạt
    }
    if (lesson.isNext) {
      return '#FEF3C7'; // Vàng nhạt
    }
    return '#F3F4F6'; // Xám nhạt
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.isCompleted) {
      return 'checkmark-circle';
    }
    if (lesson.isLocked) {
      return 'lock-closed';
    }
    return 'play-circle';
  };

  // Tìm lesson tiếp theo để học (isNext hoặc lesson đầu tiên chưa completed và không locked)
  const getNextLesson = (): Lesson | null => {
    if (!dashboardData || !dashboardData.lessons.length) return null;

    // Tìm lesson có isNext = true
    const nextLesson = dashboardData.lessons.find((l) => l.isNext);
    if (nextLesson) return nextLesson;

    // Nếu không có isNext, tìm lesson đầu tiên chưa completed và không locked
    const firstAvailable = dashboardData.lessons.find((l) => !l.isCompleted && !l.isLocked);
    return firstAvailable || null;
  };

  const handleStartLearning = () => {
    const nextLesson = getNextLesson();
    if (nextLesson) {
      router.push({ pathname: '/lesson/[id]', params: { id: nextLesson.id } } as any);
    } else {
      Alert.alert('Thông báo', 'Bạn đã hoàn thành tất cả bài học!');
    }
  };

  const handleOpenCourse = () => {
    if (!selectedCourseId) return;
    router.push({
      pathname: '/course/[id]',
      params: {
        id: selectedCourseId,
        title: selectedCourseTitle,
      },
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: user?.avatarUrl || 'https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg' }}
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: colors.secondaryText }]}>
                {(() => {
                  const hour = new Date().getHours();
                  if (hour < 12) return 'Chào buổi sáng';
                  if (hour < 18) return 'Chào buổi chiều';
                  return 'Chào buổi tối';
                })()}
                ,
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {headerData?.fullName || user?.email?.split('@')[0] || 'Bạn'}! 👋
              </Text>
              {headerData && headerData.currentStreak > 0 && (
                <View style={styles.streakContainer}>
                  <Ionicons name="flame" size={14} color="#F59E0B" />
                  <Text style={styles.streakText}>
                    {headerData.currentStreak} ngày liên tiếp
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.notificationBtn, { backgroundColor: colors.notificationBtnBg }]}
            onPress={() => router.push("/notifications" as any)}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Daily Progress Bar */}
        {headerData && headerData.dailyProgressPercent > 0 && (
          <View style={[styles.dailyProgressContainer, { backgroundColor: colors.cardBg }]}>
            <View style={styles.dailyProgressHeader}>
              <Text style={[styles.dailyProgressLabel, { color: colors.text }]}>Tiến độ hôm nay</Text>
              <Text style={styles.dailyProgressPercent}>
                {Math.round(headerData.dailyProgressPercent)}%
              </Text>
            </View>
            <View style={styles.dailyProgressBarBg}>
              <View
                style={[
                  styles.dailyProgressBar,
                  { width: `${headerData.dailyProgressPercent}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Lộ trình học tập</Text>
          <TouchableOpacity onPress={handleOpenCourse} disabled={!selectedCourseId}>
            <Text style={styles.progressTitle}>{selectedCourseTitle}</Text>
          </TouchableOpacity>

          <View style={styles.progressInfo}>
            <View style={styles.progressBarContainer}>
              <Text style={styles.progressPercent}>
                Đã hoàn thành {dashboardData?.progressPercent || 0}%
              </Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${dashboardData?.progressPercent || 0}%` },
                  ]}
                />
              </View>
            </View>
            <View style={styles.lessonCount}>
              <Text style={styles.lessonCountText}>
                {dashboardData?.completedLessons || 0}/{dashboardData?.totalLessons || 0} Bài
              </Text>
            </View>
          </View>

          {/* Button Bắt đầu học / Tiếp tục học */}
          {dashboardData && dashboardData.lessons.length > 0 && (
            <TouchableOpacity
              style={styles.startLearningButton}
              onPress={handleStartLearning}
              disabled={!getNextLesson()}
            >
              <Ionicons
                name={getNextLesson() ? 'play-circle' : 'checkmark-circle'}
                size={24}
                color="#fff"
              />
              <Text style={styles.startLearningButtonText}>
                {getNextLesson()
                  ? dashboardData.completedLessons > 0
                    ? 'Tiếp tục học'
                    : 'Bắt đầu học'
                  : 'Đã hoàn thành'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} layout={styles} />
          ))}
        </View>

        {/* Lessons List Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh sách bài học</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                Đang tải danh sách bài học...
              </Text>
            </View>
          ) : dashboardData && dashboardData.lessons.length > 0 ? (
            dashboardData.lessons.map((lesson) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  {
                    backgroundColor: colors.cardBg,
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
                      },
                    } as any);
                  }
                }}
                disabled={lesson.isLocked}
              >
                <View
                  style={[
                    styles.lessonIconContainer,
                    { backgroundColor: getLessonStatusBg(lesson) },
                  ]}
                >
                  <Ionicons
                    name={getLessonIcon(lesson) as any}
                    size={24}
                    color={getLessonStatusColor(lesson)}
                  />
                </View>
                <View style={styles.lessonInfo}>
                  {lesson.chapterTitle && (
                    <Text style={[styles.lessonChapter, { color: colors.secondaryText }]}>
                      {lesson.chapterTitle}
                    </Text>
                  )}
                  <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.title}</Text>
                  <Text style={[styles.lessonSubtitle, { color: colors.secondaryText }]} numberOfLines={2}>
                    {lesson.description}
                  </Text>
                  <View style={styles.lessonMeta}>
                    <View style={styles.lessonMetaItem}>
                      <Ionicons
                        name={lesson.isCompleted ? 'checkmark-circle' : lesson.isLocked ? 'lock-closed' : 'play-circle'}
                        size={14}
                        color={getLessonStatusColor(lesson)}
                      />
                      <Text
                        style={[
                          styles.lessonMetaText,
                          { color: getLessonStatusColor(lesson) },
                        ]}
                      >
                        {lesson.isCompleted
                          ? 'Đã hoàn thành'
                          : lesson.isLocked
                            ? 'Đã khóa'
                            : 'Có thể học'}
                      </Text>
                    </View>
                  </View>
                </View>
                {!lesson.isLocked && (
                  <TouchableOpacity
                    style={[
                      styles.playButton,
                      {
                        backgroundColor: lesson.isCompleted
                          ? '#10B981'
                          : lesson.isNext
                            ? '#F59E0B'
                            : '#3B82F6',
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/lesson/[id]',
                        params: {
                          id: lesson.id,
                          title: lesson.title,
                          description: lesson.description,
                        },
                      } as any)
                    }
                  >
                    <Ionicons
                      name={lesson.isCompleted ? 'checkmark' : 'play'}
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={48} color={colors.mutedText} />
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Chưa có bài học nào
              </Text>
            </View>
          )}
        </View>

        {/* Suggestions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>

          <View style={styles.suggestionsContainer}>
            {/* Tip Card */}
            <TouchableOpacity
              style={[styles.suggestionCard, { backgroundColor: colors.tipCardBg }]}
              onPress={() => router.push('/tips/memory' as any)}
            >
              <View style={[styles.suggestionIconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="bulb" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.suggestionTitle, { color: colors.text }]}>Mẹo ghi nhớ</Text>
              <Text style={[styles.suggestionDescription, { color: colors.secondaryText }]}>
                5 cách giúp bạn nhớ lâu hơn khi ôn tập...
              </Text>
            </TouchableOpacity>

            {/* Challenge Card */}
            <TouchableOpacity style={[styles.suggestionCard, { backgroundColor: colors.challengeCardBg }]}>
              <View style={[styles.suggestionIconContainer, { backgroundColor: colors.surface }]}>
                <Ionicons name="trophy" size={24} color="#8B5CF6" />
              </View>
              <Text style={[styles.suggestionTitle, { color: colors.text }]}>Thử thách</Text>
              <Text style={[styles.suggestionDescription, { color: colors.secondaryText }]}>
                Hoàn thành 3 bài tập Tiếng Anh ngay!
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createHomeStyles(screenWidth: number) {
  const isWeb = Platform.OS === 'web';
  const isTablet = screenWidth >= 768;
  const isCompactWeb = isWeb && screenWidth < 600;
  const isLargeWeb = isWeb && screenWidth >= 1024;
  const edgePad = isTablet ? 32 : isWeb ? Math.min(screenWidth * 0.05, 40) : 20;

  return StyleSheet.create({
    container: {
      flex: 1,
      maxWidth: isWeb ? 1200 : '100%',
      alignSelf: isWeb ? 'center' : 'stretch',
      width: isWeb ? '100%' : screenWidth,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: edgePad,
      paddingVertical: isTablet ? 20 : 16,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: isTablet ? 16 : 12,
      flex: 1,
    },
    headerTextContainer: {
      flex: 1,
    },
    avatar: {
      width: isTablet ? 52 : 44,
      height: isTablet ? 52 : 44,
      borderRadius: isTablet ? 26 : 22,
    },
    greeting: {
      fontSize: isTablet ? 16 : 14,
    },
    userName: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '700',
      marginTop: 2,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    streakText: {
      fontSize: isTablet ? 13 : 11,
      color: '#F59E0B',
      fontWeight: '600',
    },
    dailyProgressContainer: {
      marginHorizontal: edgePad,
      marginTop: 12,
      marginBottom: 8,
      padding: isTablet ? 16 : 12,
      borderRadius: 12,
    },
    dailyProgressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    dailyProgressLabel: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    dailyProgressPercent: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '700',
      color: '#3B82F6',
    },
    dailyProgressBarBg: {
      height: isTablet ? 10 : 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 4,
      overflow: 'hidden',
    },
    dailyProgressBar: {
      height: '100%',
      backgroundColor: '#3B82F6',
      borderRadius: 4,
    },
    notificationBtn: {
      width: isTablet ? 52 : 44,
      height: isTablet ? 52 : 44,
      borderRadius: isTablet ? 26 : 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressCard: {
      margin: edgePad,
      padding: isTablet ? 28 : isWeb ? 24 : 20,
      backgroundColor: '#3B82F6',
      borderRadius: isTablet ? 24 : 20,
      maxWidth: isWeb ? 800 : '100%',
      alignSelf: isWeb ? 'center' : 'stretch',
    },
    progressLabel: {
      fontSize: isTablet ? 14 : 12,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 4,
    },
    progressTitle: {
      fontSize: isTablet ? 26 : isWeb ? 24 : 22,
      fontWeight: '700',
      color: '#fff',
      marginBottom: isTablet ? 20 : 16,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
    },
    progressBarContainer: {
      flex: 1,
      minWidth: 0,
    },
    progressPercent: {
      fontSize: isTablet ? 14 : 12,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 8,
    },
    progressBarBg: {
      height: isTablet ? 10 : 8,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 4,
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: 4,
    },
    lessonCount: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: isTablet ? 16 : 12,
      paddingVertical: isTablet ? 8 : 6,
      borderRadius: 8,
      flexShrink: 0,
    },
    lessonCountText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: '#fff',
    },
    startLearningButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      paddingVertical: isTablet ? 16 : 14,
      paddingHorizontal: isTablet ? 24 : 20,
      borderRadius: isTablet ? 16 : 12,
      marginTop: isTablet ? 20 : 16,
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    startLearningButtonText: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '700',
      color: '#3B82F6',
    },
    quickActionsContainer: {
      flexDirection: 'row',
      width: '100%',
      alignSelf: 'stretch',
      paddingHorizontal: edgePad,
      marginBottom: isTablet ? 32 : 24,
      gap: isTablet ? 16 : isWeb ? 12 : 8,
      flexWrap: isCompactWeb ? 'wrap' : 'nowrap',
    },
    quickAction: {
      ...(isCompactWeb
        ? { width: '48%', maxWidth: '48%', flexGrow: 0, flexShrink: 0 }
        : { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }),
      alignItems: 'center',
      marginBottom: isCompactWeb ? 12 : 0,
    },
    quickActionIcon: {
      width: isTablet ? 64 : isLargeWeb ? 64 : 56,
      height: isTablet ? 64 : isLargeWeb ? 64 : 56,
      borderRadius: isTablet ? 20 : 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isTablet ? 12 : 8,
    },
    quickActionLabel: {
      fontSize: isTablet ? 14 : isLargeWeb ? 14 : 12,
      fontWeight: '500',
    },
    section: {
      paddingHorizontal: edgePad,
      marginBottom: isTablet ? 32 : 24,
      maxWidth: isWeb ? 800 : '100%',
      alignSelf: isWeb ? 'center' : 'stretch',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isTablet ? 20 : 16,
    },
    sectionTitle: {
      fontSize: isTablet ? 22 : isLargeWeb ? 20 : 18,
      fontWeight: '700',
    },
    seeAllText: {
      fontSize: isTablet ? 16 : isLargeWeb ? 16 : 14,
      color: '#3B82F6',
      fontWeight: '500',
    },
    lessonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 20 : isLargeWeb ? 20 : 16,
      borderRadius: isTablet ? 20 : 16,
      marginBottom: isTablet ? 16 : 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    lessonIconContainer: {
      width: isTablet ? 56 : isLargeWeb ? 56 : 48,
      height: isTablet ? 56 : isLargeWeb ? 56 : 48,
      borderRadius: isTablet ? 16 : 12,
      backgroundColor: '#D1FAE5',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: isTablet ? 16 : 12,
      flexShrink: 0,
    },
    lessonInfo: {
      flex: 1,
      minWidth: 0,
    },
    lessonChapter: {
      fontSize: isTablet ? 14 : isLargeWeb ? 14 : 12,
      marginBottom: 4,
      fontWeight: '500',
    },
    lessonTitle: {
      fontSize: isTablet ? 18 : isLargeWeb ? 18 : 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    lessonSubtitle: {
      fontSize: isTablet ? 16 : isLargeWeb ? 16 : 14,
      marginBottom: 6,
      lineHeight: isTablet ? 22 : 20,
    },
    lessonMeta: {
      flexDirection: 'row',
      gap: isTablet ? 16 : 12,
      flexWrap: 'wrap',
    },
    lessonMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    lessonMetaText: {
      fontSize: isTablet ? 14 : isLargeWeb ? 14 : 12,
    },
    playButton: {
      width: isTablet ? 48 : isLargeWeb ? 48 : 40,
      height: isTablet ? 48 : isLargeWeb ? 48 : 40,
      borderRadius: isTablet ? 24 : 20,
      backgroundColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    suggestionsContainer: {
      flexDirection: isCompactWeb ? 'column' : 'row',
      width: '100%',
      alignSelf: 'stretch',
      gap: isTablet ? 16 : 12,
      marginTop: 16,
    },
    suggestionCard: {
      ...(isCompactWeb
        ? { width: '100%', flexGrow: 0, flexShrink: 0 }
        : { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }),
      padding: isTablet ? 20 : isLargeWeb ? 20 : 16,
      borderRadius: isTablet ? 20 : 16,
    },
    suggestionIconContainer: {
      width: isTablet ? 48 : isLargeWeb ? 48 : 40,
      height: isTablet ? 48 : isLargeWeb ? 48 : 40,
      borderRadius: isTablet ? 16 : 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: isTablet ? 16 : 12,
    },
    suggestionTitle: {
      fontSize: isTablet ? 18 : isLargeWeb ? 18 : 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    suggestionDescription: {
      fontSize: isTablet ? 15 : isLargeWeb ? 15 : 13,
      lineHeight: isTablet ? 22 : 18,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 60 : 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: isTablet ? 16 : 14,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? 60 : 40,
    },
    emptyText: {
      marginTop: 12,
      fontSize: isTablet ? 16 : 14,
    },
  });
}

function QuickAction({
  icon,
  label,
  color,
  bgColor,
  onPress,
  layout,
}: QuickActionProps & { layout: ReturnType<typeof createHomeStyles> }) {
  const colors = useColors();
  return (
    <TouchableOpacity style={layout.quickAction} onPress={onPress}>
      <View style={[layout.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[layout.quickActionLabel, { color: colors.secondaryText }]} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
