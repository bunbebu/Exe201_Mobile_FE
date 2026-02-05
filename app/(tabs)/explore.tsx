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

interface CategoryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  count: number;
  color: string;
  bgColor: string;
}

function CategoryCard({ icon, title, count, color, bgColor }: CategoryCardProps) {
  return (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: bgColor }]}>
      <View style={[styles.categoryIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categoryCount}>{count} khóa học</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen() {
  const categories: CategoryCardProps[] = [
    { icon: 'calculator-outline', title: 'Toán học', count: 24, color: '#3B82F6', bgColor: '#EBF5FF' },
    { icon: 'flask-outline', title: 'Hóa học', count: 18, color: '#10B981', bgColor: '#D1FAE5' },
    { icon: 'planet-outline', title: 'Vật lý', count: 20, color: '#F59E0B', bgColor: '#FEF3C7' },
    { icon: 'language-outline', title: 'Tiếng Anh', count: 32, color: '#8B5CF6', bgColor: '#EDE9FE' },
    { icon: 'book-outline', title: 'Ngữ văn', count: 15, color: '#EC4899', bgColor: '#FCE7F3' },
    { icon: 'earth-outline', title: 'Địa lý', count: 12, color: '#06B6D4', bgColor: '#CFFAFE' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Khám phá</Text>
          <TouchableOpacity>
            <Ionicons name="filter-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm khóa học..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục môn học</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <CategoryCard key={index} {...category} />
            ))}
          </View>
        </View>

        {/* Popular */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phổ biến nhất</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {[1, 2, 3].map((item) => (
            <TouchableOpacity key={item} style={styles.courseCard}>
              <View style={styles.courseImage}>
                <Ionicons name="play-circle" size={32} color="#3B82F6" />
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>Luyện thi THPT Quốc gia - Toán</Text>
                <Text style={styles.courseTeacher}>GV. Nguyễn Văn A</Text>
                <View style={styles.courseStats}>
                  <View style={styles.courseStat}>
                    <Ionicons name="people-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.courseStatText}>1.2k</Text>
                  </View>
                  <View style={styles.courseStat}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.courseStatText}>4.8</Text>
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
    backgroundColor: '#F5F5F5',
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
    color: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  courseImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
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
    color: '#1a1a1a',
    marginBottom: 4,
  },
  courseTeacher: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
