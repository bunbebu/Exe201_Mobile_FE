import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';
import { API_BASE_URL } from '@/config/api';

interface ApiImage {
  url?: string;
}

interface SubjectItem {
  id: string;
  name: string;
  iconUrl?: ApiImage | null;
}

interface CourseItem {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: ApiImage | null;
}

interface CategoryCardProps {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  color: string;
  bgColor: string;
  imageUrl?: string;
  onPress: () => void;
}

function CategoryCard({ icon, title, count, color, bgColor, imageUrl, onPress }: CategoryCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: bgColor }]} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.categoryImage} resizeMode="cover" />
      ) : (
        <View style={[styles.categoryIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
      )}
      <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const colors = useColors();
  const { tokens } = useAuth();
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [popularCourses, setPopularCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadExploreData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const subjectUrl = `${API_BASE_URL}/api/v1/subjects?page=1&limit=10`;
        const publishedFilter = encodeURIComponent(JSON.stringify({ status: 'Published' }));
        const popularUrl = `${API_BASE_URL}/api/v1/courses?page=1&limit=10&filters=${publishedFilter}`;

        const authHeaders: any = {};
        if (tokens?.accessToken) {
          authHeaders['Authorization'] = `Bearer ${tokens.accessToken}`;
        }

        const [subjectsRes, coursesRes] = await Promise.all([
          fetch(subjectUrl, { headers: authHeaders }),
          fetch(popularUrl, { headers: authHeaders }),
        ]);

        if (!subjectsRes.ok || !coursesRes.ok) {
          throw new Error('Không thể tải dữ liệu khám phá');
        }

        const subjectsJson = await subjectsRes.json();
        const coursesJson = await coursesRes.json();

        const subjectItems: SubjectItem[] = subjectsJson?.data?.items ?? [];
        const courseItems: CourseItem[] = coursesJson?.data?.items ?? [];

        if (!isMounted) return;
        setSubjects(subjectItems);
        setPopularCourses(courseItems);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadExploreData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories: CategoryCardProps[] = useMemo(
    () =>
      subjects.map((subject, index) => {
        const palette = [
          { icon: 'book-outline', color: '#3B82F6', bgColor: colors.qaBlueBg },
          { icon: 'school-outline', color: '#10B981', bgColor: colors.qaGreenBg },
          { icon: 'planet-outline', color: '#F59E0B', bgColor: colors.qaYellowBg },
          { icon: 'library-outline', color: '#8B5CF6', bgColor: colors.qaPurpleBg },
          { icon: 'reader-outline', color: '#EC4899', bgColor: colors.tipCardBg },
        ] as const;
        const styleSet = palette[index % palette.length];

        return {
          id: subject.id,
          icon: styleSet.icon,
          title: subject.name,
          count: 0,
          color: styleSet.color,
          bgColor: styleSet.bgColor,
          imageUrl: subject.iconUrl?.url,
          onPress: () => {
            router.push({
              pathname: '/subject/[id]',
              params: {
                id: subject.id,
                name: subject.name,
              },
            } as any);
          },
        };
      }),
    [subjects, colors.qaBlueBg, colors.qaGreenBg, colors.qaPurpleBg, colors.qaYellowBg, colors.tipCardBg]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Khám phá</Text>
          <TouchableOpacity>
            <Ionicons name="filter-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="search-outline" size={20} color={colors.mutedText} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Tìm kiếm khóa học..."
            placeholderTextColor={colors.mutedText}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh mục môn học</Text>
          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => (
                <CategoryCard key={`${category.id}-${index}`} {...category} />
              ))}
            </View>
          )}
        </View>

        {/* Popular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phổ biến nhất</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {popularCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={[styles.courseCard, { backgroundColor: colors.cardBg }]}
              onPress={() =>
                router.push({
                  pathname: '/course/[id]',
                  params: {
                    id: course.id,
                    title: course.title,
                  },
                } as any)
              }
            >
              <View style={[styles.courseImage, { backgroundColor: colors.background }]}>
                {course.thumbnailUrl?.url ? (
                  <Image source={{ uri: course.thumbnailUrl.url }} style={styles.courseThumb} resizeMode="cover" />
                ) : (
                  <Ionicons name="play-circle" size={32} color="#3B82F6" />
                )}
              </View>
              <View style={styles.courseInfo}>
                <Text style={[styles.courseTitle, { color: colors.text }]} numberOfLines={2}>
                  {course.title}
                </Text>
                <Text style={[styles.courseTeacher, { color: colors.secondaryText }]} numberOfLines={2}>
                  {course.description || 'Khóa học nổi bật'}
                </Text>
                <View style={styles.courseStats}>
                  <View style={styles.courseStat}>
                    <Ionicons name="rocket-outline" size={14} color={colors.mutedText} />
                    <Text style={[styles.courseStatText, { color: colors.mutedText }]}>Published</Text>
                  </View>
                  <View style={styles.courseStat}>
                    <Ionicons name="flame-outline" size={14} color="#F59E0B" />
                    <Text style={[styles.courseStatText, { color: colors.mutedText }]}>Popular</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {!isLoading && popularCourses.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>Chưa có khóa học phổ biến.</Text>
          ) : null}
          {errorMessage ? (
            <Text style={[styles.emptyText, { color: '#EF4444' }]}>{errorMessage}</Text>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '31%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
  },
  courseCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  courseImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  courseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseTeacher: {
    fontSize: 13,
    marginBottom: 6,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 12,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 13,
  },
  stateContainer: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginTop: 8,
  },
});
