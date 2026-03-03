import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';

interface CategoryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  color: string;
  bgColor: string;
}

function CategoryCard({ icon, title, count, color, bgColor }: CategoryCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: bgColor }]}>
      <View style={[styles.categoryIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={[styles.categoryTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.categoryCount, { color: colors.mutedText }]}>{count} khóa học</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const colors = useColors();

  const categories: CategoryCardProps[] = [
    { icon: 'calculator-outline', title: 'Toán học', count: 24, color: '#3B82F6', bgColor: colors.qaBlueBg },
    { icon: 'flask-outline', title: 'Hóa học', count: 18, color: '#10B981', bgColor: colors.qaGreenBg },
    { icon: 'planet-outline', title: 'Vật lý', count: 20, color: '#F59E0B', bgColor: colors.qaYellowBg },
    { icon: 'language-outline', title: 'Tiếng Anh', count: 32, color: '#8B5CF6', bgColor: colors.qaPurpleBg },
    { icon: 'book-outline', title: 'Ngữ văn', count: 15, color: '#EC4899', bgColor: colors.tipCardBg },
    { icon: 'earth-outline', title: 'Địa lý', count: 12, color: '#06B6D4', bgColor: colors.qaBlueBg },
  ];

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
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </View>
        </View>

        {/* Popular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phổ biến nhất</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={[styles.courseCard, { backgroundColor: colors.cardBg }]}>
              <View style={[styles.courseImage, { backgroundColor: colors.background }]}>
                <Ionicons name="play-circle" size={32} color="#3B82F6" />
              </View>
              <View style={styles.courseInfo}>
                <Text style={[styles.courseTitle, { color: colors.text }]}>Luyện thi THPT Quốc gia - Toán</Text>
                <Text style={[styles.courseTeacher, { color: colors.secondaryText }]}>GV. Nguyễn Văn A</Text>
                <View style={styles.courseStats}>
                  <View style={styles.courseStat}>
                    <Ionicons name="people-outline" size={14} color={colors.mutedText} />
                    <Text style={[styles.courseStatText, { color: colors.mutedText }]}>1.2k</Text>
                  </View>
                  <View style={styles.courseStat}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.courseStatText, { color: colors.mutedText }]}>4.8</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
});
