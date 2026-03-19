import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/use-colors';

interface DashboardResponse {
    progressSummary?: {
        totalLessons?: number;
        completedLessons?: number;
        progressPercent?: number;
        totalXP?: number;
    };
    userInfo?: {
        currentStreak?: number;
    };
    plan?: {
        dailyLimits?: {
            lessons?: { limit?: number; description?: string };
            exams?: { limit?: number; description?: string };
        };
    };
}

interface DashboardStatsResponse {
    lessonStats?: {
        completed?: number;
        inProgress?: number;
        notStarted?: number;
        total?: number;
    };
    achievements?: Array<{
        name?: string;
        description?: string;
        earned?: boolean;
    }>;
}

export default function StatsScreen() {
    const colors = useColors();
    const { tokens } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStatsResponse | null>(null);

    useEffect(() => {
        const fetchStatsData = async () => {
            if (!tokens?.accessToken) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrorMessage(null);
            try {
                const headers = {
                    Authorization: `Bearer ${tokens.accessToken}`,
                };

                const [dashboardRes, statsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/dashboard`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/dashboard/stats`, { headers }),
                ]);

                if (!dashboardRes.ok || !statsRes.ok) {
                    throw new Error('Không thể tải dữ liệu thống kê');
                }

                const dashboardJson: DashboardResponse = await dashboardRes.json();
                const statsJson: DashboardStatsResponse = await statsRes.json();
                setDashboard(dashboardJson);
                setDashboardStats(statsJson);
            } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
            } finally {
                setIsLoading(false);
            }
        };

        void fetchStatsData();
    }, [tokens?.accessToken]);

    const totalLessons = dashboard?.progressSummary?.totalLessons ?? 0;
    const completedLessons = dashboard?.progressSummary?.completedLessons ?? 0;
    const progressPercent = dashboard?.progressSummary?.progressPercent ?? 0;
    const totalXP = dashboard?.progressSummary?.totalXP ?? 0;
    const currentStreak = dashboard?.userInfo?.currentStreak ?? 0;
    const lessonLimit = dashboard?.plan?.dailyLimits?.lessons?.limit ?? 0;
    const examLimit = dashboard?.plan?.dailyLimits?.exams?.limit ?? 0;
    const lessonStats = dashboardStats?.lessonStats;

    const lessonStatusData = useMemo(
        () => [
            { label: 'Hoàn thành', value: lessonStats?.completed ?? 0, color: '#10B981' },
            { label: 'Đang học', value: lessonStats?.inProgress ?? 0, color: '#3B82F6' },
            { label: 'Chưa bắt đầu', value: lessonStats?.notStarted ?? 0, color: '#F59E0B' },
        ],
        [lessonStats?.completed, lessonStats?.inProgress, lessonStats?.notStarted]
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.tint} />
                    <Text style={[styles.loadingText, { color: colors.secondaryText }]}>Đang tải thống kê...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Thống kê</Text>
                </View>

                {/* Overview Cards */}
                <View style={styles.overviewContainer}>
                    <View style={[styles.overviewCard, styles.primaryCard]}>
                        <Ionicons name="time-outline" size={24} color="#fff" />
                        <Text style={styles.overviewValueWhite}>{progressPercent}%</Text>
                        <Text style={styles.overviewLabelWhite}>Tiến độ tổng</Text>
                    </View>
                    <View style={[styles.overviewCard, { backgroundColor: colors.cardBg }]}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                        <Text style={[styles.overviewValue, { color: '#10B981' }]}>{completedLessons}</Text>
                        <Text style={[styles.overviewLabel, { color: colors.secondaryText }]}>Bài đã hoàn thành</Text>
                    </View>
                    <View style={[styles.overviewCard, { backgroundColor: colors.cardBg }]}>
                        <Ionicons name="flame-outline" size={24} color="#F59E0B" />
                        <Text style={[styles.overviewValue, { color: '#F59E0B' }]}>{currentStreak}</Text>
                        <Text style={[styles.overviewLabel, { color: colors.secondaryText }]}>Ngày liên tiếp</Text>
                    </View>
                </View>

                {/* Learning Summary */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tổng quan học tập</Text>
                    <View style={[styles.chartContainer, { backgroundColor: colors.cardBg }]}>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Tổng bài học</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalLessons}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>Tổng XP</Text>
                            <Text style={[styles.summaryValue, { color: colors.text }]}>{totalXP}</Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: colors.border, marginTop: 12 }]}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${progressPercent}%`, backgroundColor: colors.tint },
                                ]}
                            />
                        </View>
                    </View>
                </View>

                {/* Lesson Status */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Trạng thái bài học</Text>

                    {lessonStatusData.map((item, index) => (
                        <View key={index} style={[styles.progressItem, { backgroundColor: colors.cardBg }]}>
                            <View style={styles.progressHeader}>
                                <Text style={[styles.progressSubject, { color: colors.text }]}>{item.label}</Text>
                                <Text style={[styles.progressPercent, { color: item.color }]}>{item.value}</Text>
                            </View>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${totalLessons > 0 ? Math.round((item.value / totalLessons) * 100) : 0}%`,
                                            backgroundColor: item.color,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Daily Limits & Achievements */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Giới hạn ngày & Thành tựu</Text>
                    <View style={[styles.progressItem, { backgroundColor: colors.cardBg }]}>
                        <Text style={[styles.progressSubject, { color: colors.text }]}>
                            Giới hạn: {lessonLimit} bài học / {examLimit} lượt thi mỗi ngày
                        </Text>
                        <Text style={[styles.overviewLabel, { color: colors.secondaryText, marginTop: 8 }]}>
                            Theo gói hiện tại của bạn.
                        </Text>
                    </View>
                    {(dashboardStats?.achievements ?? []).map((item, index) => (
                        <View key={`${item.name}-${index}`} style={[styles.progressItem, { backgroundColor: colors.cardBg }]}>
                            <View style={styles.progressHeader}>
                                <Text style={[styles.progressSubject, { color: colors.text }]}>{item.name || 'Achievement'}</Text>
                                <Text style={[styles.progressPercent, { color: item.earned ? '#10B981' : colors.mutedText }]}>
                                    {item.earned ? 'Đã đạt' : 'Chưa đạt'}
                                </Text>
                            </View>
                            <Text style={[styles.overviewLabel, { color: colors.secondaryText }]}>
                                {item.description || ''}
                            </Text>
                        </View>
                    ))}
                </View>

                {errorMessage ? (
                    <View style={styles.section}>
                        <Text style={{ color: '#EF4444', fontSize: 13 }}>{errorMessage}</Text>
                    </View>
                ) : null}

                <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
    },
    overviewContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    overviewCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    primaryCard: {
        backgroundColor: '#3B82F6',
    },
    overviewValueWhite: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginVertical: 4,
    },
    overviewLabelWhite: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: '700',
        marginVertical: 4,
    },
    overviewLabel: {
        fontSize: 11,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    chartContainer: {
        borderRadius: 16,
        padding: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 13,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressItem: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressSubject: {
        fontSize: 15,
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
});
