import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color?: string;
    onPress?: () => void;
}

function MenuItem({ icon, label, color = '#1a1a1a', onPress }: MenuItemProps) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Ionicons name={icon} size={22} color={color} />
            <Text style={[styles.menuLabel, { color }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
    );
}

export default function ProfileScreen() {
    const handleLogout = () => {
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Cá nhân</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <Image
                        source={{ uri: 'https://kenh14cdn.com/203336854389633024/2021/1/3/5eaa8adf32978-1589277602636643044840-158953676924396578872-16096680352171545831444.jpeg' }}
                        style={styles.avatar}
                    />
                    <Text style={styles.userName}>Nguyễn Văn Nam</Text>
                    <Text style={styles.userEmail}>nam.nguyen@email.com</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Khóa học</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>45</Text>
                            <Text style={styles.statLabel}>Bài học</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>24h</Text>
                            <Text style={styles.statLabel}>Giờ học</Text>
                        </View>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Tài khoản</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon="person-outline" label="Thông tin cá nhân" />
                        <MenuItem icon="school-outline" label="Lớp học của tôi" />
                        <MenuItem icon="bookmark-outline" label="Đã lưu" />
                        <MenuItem icon="time-outline" label="Lịch sử học tập" />
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Cài đặt</Text>
                    <View style={styles.menuCard}>
                        <MenuItem icon="notifications-outline" label="Thông báo" />
                        <MenuItem icon="moon-outline" label="Giao diện" />
                        <MenuItem icon="language-outline" label="Ngôn ngữ" />
                        <MenuItem icon="help-circle-outline" label="Trợ giúp" />
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <View style={styles.menuCard}>
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
    profileCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
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
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
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
        color: '#9CA3AF',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    menuSection: {
        marginBottom: 20,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginLeft: 20,
        marginBottom: 8,
    },
    menuCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        marginLeft: 12,
    },
});
