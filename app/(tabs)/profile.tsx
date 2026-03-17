import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    const { logout } = useAuth();

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
                        source={{ uri: 'https://kenh14cdn.com/203336854389633024/2021/1/3/5eaa8adf32978-1589277602636643044840-158953676924396578872-16096680352171545831444.jpeg' }}
                        style={styles.avatar}
                    />
                    <Text style={[styles.userName, { color: colors.text }]}>Nguyễn Văn Nam</Text>
                    <Text style={[styles.userEmail, { color: colors.secondaryText }]}>nam.nguyen@email.com</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Khóa học</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>45</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Bài học</Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>24h</Text>
                            <Text style={[styles.statLabel, { color: colors.mutedText }]}>Giờ học</Text>
                        </View>
                    </View>
                </View>

                {/* Menu - Account */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: colors.secondaryText }]}>Tài khoản</Text>
                    <View style={[styles.menuCard, { backgroundColor: colors.cardBg }]}>
                        <MenuItem icon="person-outline" label="Thông tin cá nhân" />
                        <MenuItem icon="school-outline" label="Lớp học của tôi" />
                        <MenuItem icon="bookmark-outline" label="Đã lưu" />
                        <MenuItem icon="time-outline" label="Lịch sử học tập" />
                    </View>
                </View>

                {/* Menu - Settings */}
                <View style={styles.menuSection}>
                    <Text style={[styles.menuTitle, { color: colors.secondaryText }]}>Cài đặt</Text>
                    <View style={[styles.menuCard, { backgroundColor: colors.cardBg }]}>
                        <MenuItem icon="notifications-outline" label="Thông báo" />
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
                        <MenuItem icon="language-outline" label="Ngôn ngữ" />
                        <MenuItem icon="help-circle-outline" label="Trợ giúp" />
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
