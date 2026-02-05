import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StatsScreen() {
    const weekData = [
        { day: 'T2', hours: 2, height: 40 },
        { day: 'T3', hours: 3, height: 60 },
        { day: 'T4', hours: 1.5, height: 30 },
        { day: 'T5', hours: 4, height: 80 },
        { day: 'T6', hours: 2.5, height: 50 },
        { day: 'T7', hours: 3.5, height: 70 },
        { day: 'CN', hours: 1, height: 20 },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Thống kê</Text>
                </View>

                {/* Overview Cards */}
                <View style={styles.overviewContainer}>
                    <View style={[styles.overviewCard, styles.primaryCard]}>
                        <Ionicons name="time-outline" size={24} color="#fff" />
                        <Text style={styles.overviewValue}>24h</Text>
                        <Text style={styles.overviewLabel}>Tổng giờ học</Text>
                    </View>
                    <View style={styles.overviewCard}>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
                        <Text style={[styles.overviewValue, { color: '#10B981' }]}>45</Text>
                        <Text style={styles.overviewLabel}>Bài đã hoàn thành</Text>
                    </View>
                    <View style={styles.overviewCard}>
                        <Ionicons name="flame-outline" size={24} color="#F59E0B" />
                        <Text style={[styles.overviewValue, { color: '#F59E0B' }]}>7</Text>
                        <Text style={styles.overviewLabel}>Ngày liên tiếp</Text>
                    </View>
                </View>

                {/* Weekly Chart */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thời gian học trong tuần</Text>
                    <View style={styles.chartContainer}>
                        <View style={styles.chart}>
                            {weekData.map((item, index) => (
                                <View key={index} style={styles.barContainer}>
                                    <View style={[styles.bar, { height: item.height }]} />
                                    <Text style={styles.barLabel}>{item.day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Subject Progress */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tiến độ theo môn</Text>

                    {[
                        { subject: 'Toán học', progress: 75, color: '#3B82F6' },
                        { subject: 'Tiếng Anh', progress: 60, color: '#8B5CF6' },
                        { subject: 'Vật lý', progress: 45, color: '#F59E0B' },
                        { subject: 'Hóa học', progress: 30, color: '#10B981' },
                    ].map((item, index) => (
                        <View key={index} style={styles.progressItem}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressSubject}>{item.subject}</Text>
                                <Text style={styles.progressPercent}>{item.progress}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        { width: `${item.progress}%`, backgroundColor: item.color },
                                    ]}
                                />
                            </View>
                        </View>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    overviewContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    overviewCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    primaryCard: {
        backgroundColor: '#3B82F6',
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginVertical: 4,
    },
    overviewLabel: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
    },
    barContainer: {
        alignItems: 'center',
    },
    bar: {
        width: 24,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
        marginBottom: 8,
    },
    barLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    progressItem: {
        backgroundColor: '#fff',
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
        color: '#1a1a1a',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
});
