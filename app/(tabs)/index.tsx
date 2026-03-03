import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
}

function QuickAction({ icon, label, color, bgColor }: QuickActionProps) {
  const colors = useColors();
  return (
    <TouchableOpacity style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.secondaryText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();

  const quickActions: QuickActionProps[] = [
    { icon: 'book-outline', label: 'Môn học', color: '#3B82F6', bgColor: colors.qaBlueBg },
    { icon: 'clipboard-outline', label: 'Bài tập', color: '#F59E0B', bgColor: colors.qaYellowBg },
    { icon: 'checkbox-outline', label: 'Kiểm tra', color: '#10B981', bgColor: colors.qaGreenBg },
    { icon: 'library-outline', label: 'Thư viện', color: '#8B5CF6', bgColor: colors.qaPurpleBg },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: 'https://kenh14cdn.com/203336854389633024/2021/1/3/5eaa8adf32978-1589277602636643044840-158953676924396578872-16096680352171545831444.jpeg' }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.greeting, { color: colors.secondaryText }]}>Chào buổi sáng,</Text>
              <Text style={[styles.userName, { color: colors.text }]}>Nam! 👋</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: colors.notificationBtnBg }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Lộ trình học tập</Text>
          <Text style={styles.progressTitle}>Luyện thi vào 10</Text>

          <View style={styles.progressInfo}>
            <View style={styles.progressBarContainer}>
              <Text style={styles.progressPercent}>Đã hoàn thành 80%</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBar, { width: '80%' }]} />
              </View>
            </View>
            <View style={styles.lessonCount}>
              <Text style={styles.lessonCountText}>12/15 Bài</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => (
            <QuickAction key={index} {...action} />
          ))}
        </View>

        {/* Next Lesson Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Bài học tiếp theo</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.lessonCard, { backgroundColor: colors.cardBg }]}>
            <View style={styles.lessonIconContainer}>
              <Ionicons name="leaf" size={24} color="#10B981" />
            </View>
            <View style={styles.lessonInfo}>
              <Text style={[styles.lessonTitle, { color: colors.text }]}>Toán học - Lớp 9</Text>
              <Text style={[styles.lessonSubtitle, { color: colors.secondaryText }]}>Bài 4: Hệ thức Vi-ét</Text>
              <View style={styles.lessonMeta}>
                <View style={styles.lessonMetaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                  <Text style={[styles.lessonMetaText, { color: colors.mutedText }]}>45 phút</Text>
                </View>
                <View style={styles.lessonMetaItem}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={[styles.lessonMetaText, { color: colors.mutedText }]}>Cơ bản</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={20} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Suggestions Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gợi ý cho bạn</Text>

          <View style={styles.suggestionsContainer}>
            {/* Tip Card */}
            <TouchableOpacity style={[styles.suggestionCard, { backgroundColor: colors.tipCardBg }]}>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  greeting: {
    fontSize: 14,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    flex: 1,
    marginRight: 16,
  },
  progressPercent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lessonCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  lessonSubtitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonMetaText: {
    fontSize: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  suggestionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
  suggestionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
