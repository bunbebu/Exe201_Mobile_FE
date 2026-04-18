import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 768;
const isWeb = Platform.OS === 'web';

interface DashboardHeaderData {
  fullName: string;
  currentStreak: number;
  dailyProgressPercent: number;
}

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { tokens, user, logout } = useAuth();
  const [headerData, setHeaderData] = useState<DashboardHeaderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  // Fetch dashboard header data from /api/v1/dashboard
  useEffect(() => {
    const fetchDashboardHeader = async () => {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (res.ok) {
          const data: any = await res.json();

          // Extract header data from response
          // API returns: { user: { fullName }, studentProfile: { currentStreak }, dailyProgress: { percent } }
          setHeaderData({
            fullName: data.user?.fullName || data.fullName || user?.email?.split('@')[0] || 'Bạn',
            currentStreak: data.studentProfile?.currentStreak || data.currentStreak || 0,
            dailyProgressPercent: data.dailyProgress?.percent || data.dailyProgressPercent || 0,
          });
        } else {
          // Fallback if API fails
          setHeaderData({
            fullName: user?.email?.split('@')[0] || 'Bạn',
            currentStreak: 0,
            dailyProgressPercent: 0,
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardHeader();
  }, [tokens, user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
            Đang tải thông tin...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
          <View style={styles.headerLeft}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  'https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg',
              }}
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: colors.secondaryText }]}>
                {getGreeting()},
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
          <View>
            <TouchableOpacity
              style={[styles.notificationBtn, { backgroundColor: colors.notificationBtnBg }]}
              onPress={() => setShowMenu((prev) => !prev)}
            >
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
            </TouchableOpacity>
            {showMenu && (
              <View style={[styles.menuContainer, { backgroundColor: colors.cardBg }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/(tabs)/profile');
                  }}
                >
                  <Ionicons name="person-outline" size={18} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Hồ sơ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/(tabs)/profile'); // TODO: replace with dedicated change-password screen when available
                  }}
                >
                  <Ionicons name="key-outline" size={18} color={colors.text} />
                  <Text style={[styles.menuItemText, { color: colors.text }]}>Đổi mật khẩu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={async () => {
                    setShowMenu(false);
                    await logout();
                    router.replace('/(auth)/login');
                  }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                  <Text style={[styles.menuItemText, { color: '#DC2626' }]}>Đăng xuất</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Daily Progress Bar */}
        {headerData && (
          <View style={[styles.dailyProgressContainer, { backgroundColor: colors.cardBg }]}>
            <View style={styles.dailyProgressHeader}>
              <Text style={[styles.dailyProgressLabel, { color: colors.text }]}>
                Tiến độ hôm nay
              </Text>
              <Text style={styles.dailyProgressPercent}>
                {Math.round(headerData.dailyProgressPercent)}%
              </Text>
            </View>
            <View style={styles.dailyProgressBarBg}>
              <View
                style={[
                  styles.dailyProgressBar,
                  { width: `${Math.min(headerData.dailyProgressPercent, 100)}%` },
                ]}
              />
            </View>
            {headerData.dailyProgressPercent === 0 && (
              <Text style={[styles.dailyProgressHint, { color: colors.secondaryText }]}>
                Bắt đầu học ngay để cập nhật tiến độ!
              </Text>
            )}
          </View>
        )}

        {/* Content Area */}
        <View style={styles.content}>
          <Text style={[styles.contentTitle, { color: colors.text }]}>Trang chủ</Text>
          <Text style={[styles.contentDescription, { color: colors.secondaryText }]}>
            Chào mừng bạn đến với Dashboard!
          </Text>
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
    maxWidth: isWeb ? 1200 : '100%',
    alignSelf: isWeb ? 'center' : 'stretch',
    width: isWeb ? '100%' : SCREEN_WIDTH,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: isTablet ? 32 : isWeb ? Math.min(SCREEN_WIDTH * 0.05, 40) : 20,
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
  notificationBtn: {
    width: isTablet ? 52 : 44,
    height: isTablet ? 52 : 44,
    borderRadius: isTablet ? 26 : 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: isTablet ? 56 : 48,
    right: 0,
    minWidth: 170,
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dailyProgressContainer: {
    marginHorizontal: isTablet ? 32 : isWeb ? Math.min(SCREEN_WIDTH * 0.05, 40) : 20,
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
  dailyProgressHint: {
    fontSize: isTablet ? 13 : 11,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: isTablet ? 32 : isWeb ? Math.min(SCREEN_WIDTH * 0.05, 40) : 20,
    marginTop: 24,
  },
  contentTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  contentDescription: {
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 20,
  },
});
