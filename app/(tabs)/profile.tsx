import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useColors } from '@/hooks/use-colors';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color?: string;
    onPress?: () => void;
    right?: React.ReactNode;
}

function MenuItem({ icon, label, color, onPress, right }: MenuItemProps) {
    const colors = useColors();
    const itemColor = color ?? colors.text;
    return (
        <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.separator }]}
            onPress={onPress}
            activeOpacity={right ? 1 : 0.7}
        >
            <Ionicons name={icon} size={22} color={itemColor} />
            <Text style={[styles.menuLabel, { color: itemColor }]}>{label}</Text>
            {right ? (
                right
            ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
            )}
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const colors = useColors();
    const { isDark, toggleTheme } = useAppTheme();
    const { logout, tokens, user } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [fullName, setFullName] = useState<string>(() => user?.email?.split('@')[0] || 'Bạn');
    const [email, setEmail] = useState<string>(() => user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(() => user?.avatarUrl ?? null);
    const [stats, setStats] = useState<{ streakDays: number; completedLessons: number; dailyProgressPercent: number }>({
        streakDays: 0,
        completedLessons: 0,
        dailyProgressPercent: 0,
    });

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Vẫn redirect về login ngay cả khi có lỗi
            router.replace('/(auth)/login');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!tokens?.accessToken) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const headers = {
                    Authorization: `Bearer ${tokens.accessToken}`,
                };

                // 1) Dashboard: lấy fullName + streak + daily progress
                const dashboardRes = await fetch(`${API_BASE_URL}/api/v1/dashboard`, { headers });
                let dashboardData: any = null;
                if (dashboardRes.ok) {
                    dashboardData = await dashboardRes.json();
                    setFullName(
                        dashboardData?.user?.fullName ||
                        dashboardData?.fullName ||
                        user?.email?.split('@')[0] ||
                        'Bạn'
                    );
                    setStats({
                        streakDays: dashboardData?.studentProfile?.currentStreak || 0,
                        completedLessons: 0, // preenchido no step 3
                        dailyProgressPercent: dashboardData?.dailyProgress?.percent || 0,
                    });
                } else {
                    setFullName(user?.email?.split('@')[0] || 'Bạn');
                    setStats((prev) => ({
                        ...prev,
                        streakDays: 0,
                        dailyProgressPercent: 0,
                    }));
                }

                setEmail(user?.email || '');
                setAvatarUrl(user?.avatarUrl ?? null);

                // 2) Courses: pegar courseId para buscar curriculum e contar bài học hoàn thành
                const coursesRes = await fetch(`${API_BASE_URL}/api/v1/courses/personalized`, { headers });
                let coursesData: any = null;
                if (coursesRes.ok) {
                    coursesData = await coursesRes.json();
                    const firstCourseId: string | undefined = coursesData?.data?.items?.[0]?.id;

                    if (firstCourseId) {
                        const curriculumRes = await fetch(
                            `${API_BASE_URL}/api/v1/sequential-learning/curriculum/${firstCourseId}`,
                            { headers }
                        );
                        if (curriculumRes.ok) {
                            const raw: any = await curriculumRes.json();
                            const data = raw?.data ?? raw;

                            let completed = 0;
                            if (data?.chapters) {
                                data.chapters.forEach((chapter: any) => {
                                    if (!Array.isArray(chapter?.lessons)) return;
                                    chapter.lessons.forEach((lesson: any) => {
                                        if (lesson?.isCompleted) completed += 1;
                                    });
                                });
                            }

                            setStats((prev) => ({ ...prev, completedLessons: completed }));
                        }
                    }
                }
            } catch (error) {
                console.error('[PROFILE] fetchProfile error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchProfile();
    }, [tokens?.accessToken, user?.email, user?.avatarUrl]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thông tin...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Cá nhân</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.cardBg }]}>
                    <Image
                        source={{
                            uri:
                                avatarUrl ||
                                'https://kenh14cdn.com/203336854389633024/2021/1/3/5eaa8adf32978-1589277602636643044840-158953676924396578872-16096680352171545831444.jpeg',
                        }}
                        style={styles.avatar}
                    />
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                        {fullName}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.secondaryText }]} numberOfLines={1}>
                        {email}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.streakDays}</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Ngày liên tiếp</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.completedLessons}</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Bài học</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{Math.round(stats.dailyProgressPercent)}%</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Tiến độ hôm nay</Text>
                        </View>
                    </View>
                </View>

                {/* Menu - Account */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: colors.secondaryText }]}>Tài khoản</Text>
                    <View style={[styles.menuCard, { backgroundColor: colors.cardBg }]}>
                        <MenuItem icon="person-outline" label="Thông tin cá nhân" />
                        <MenuItem icon="school-outline" label="Lớp học của tôi" />
                        {/* <MenuItem icon="bookmark-outline" label="Đã lưu" /> */}
                        <MenuItem icon="time-outline" label="Lịch sử học tập" />
                        <MenuItem
                            icon="link-outline"
                            label="Kết nối Phụ huynh"
                            onPress={() => router.push('/parent-linking' as any)}
                        />
                    </View>
                </View>

                {/* Menu - Settings */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: colors.secondaryText }]}>Cài đặt</Text>
                    <View style={[styles.menuCard, { backgroundColor: colors.cardBg }]}>
                        <MenuItem
                            icon="notifications-outline"
                            label="Thông báo"
                            onPress={() => router.push('/notifications' as any)}
                        />
                        <MenuItem
                            icon="moon-outline"
                            label="Giao diện tối"
                            right={
                                <Switch
                                    value={isDark}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                                    thumbColor="#fff"
                                />
                            }
                        />
                        {/* <MenuItem icon="language-outline" label="Ngôn ngữ" /> */}
                        {/* <MenuItem icon="help-circle-outline" label="Trợ giúp" /> */}
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.menuSection}>
                    <View style={[styles.menuCard, { backgroundColor: colors.cardBg }]}>
                        <MenuItem
                            icon="log-out-outline"
                            label="Đăng xuất"
                            color="#EF4444"
                            onPress={handleLogout}
                        />
                    </View>
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        textAlign: 'center',
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
    profileCard: {
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 12,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#3B82F6',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
    },
    statDivider: {
        width: 1,
        height: 30,
    },
    menuSection: {
        marginBottom: 20,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 20,
        marginBottom: 8,
    },
    menuCard: {
        marginHorizontal: 20,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        marginLeft: 12,
    },
});
