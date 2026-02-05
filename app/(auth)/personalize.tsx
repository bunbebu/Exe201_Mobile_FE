import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type LevelType = 'cap1' | 'cap2' | 'cap3';
type GoalType = 'lay-lai-goc' | 'hoc-nang-cao' | 'on-thi-thpt' | 'luyen-thi-10';

interface LevelOption {
    id: LevelType;
    label: string;
    sublabel: string;
    icon: keyof typeof Ionicons.glyphMap;
}

interface GoalOption {
    id: GoalType;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export default function Personalize() {
    const [selectedLevel, setSelectedLevel] = useState<LevelType | null>(null);
    const [selectedGoals, setSelectedGoals] = useState<GoalType[]>([]);

    const levels: LevelOption[] = [
        { id: 'cap1', label: 'Cấp 1', sublabel: 'Lớp 1 - 5', icon: 'school-outline' },
        { id: 'cap2', label: 'Cấp 2', sublabel: 'Lớp 6 - 9', icon: 'person-outline' },
        { id: 'cap3', label: 'Cấp 3', sublabel: 'Lớp 10 - 12', icon: 'desktop-outline' },
    ];

    const goals: GoalOption[] = [
        { id: 'lay-lai-goc', label: 'Lấy lại gốc', icon: 'refresh-outline' },
        { id: 'hoc-nang-cao', label: 'Học nâng cao', icon: 'trending-up-outline' },
        { id: 'on-thi-thpt', label: 'Ôn thi THPT Quốc gia', icon: 'school-outline' },
        { id: 'luyen-thi-10', label: 'Luyện thi vào 10', icon: 'trophy-outline' },
    ];

    const toggleGoal = (goalId: GoalType) => {
        if (selectedGoals.includes(goalId)) {
            setSelectedGoals(selectedGoals.filter((g) => g !== goalId));
        } else {
            setSelectedGoals([...selectedGoals, goalId]);
        }
    };

    const handleStart = () => {
        // Navigate to grade selection
        router.push('/(auth)/select-grade');
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cá nhân hóa lộ trình</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: '80%' }]} />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>BƯỚC CUỐI CÙNG</Text>
                    <Text style={styles.progressPercent}>80% hoàn thành</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Welcome */}
                <Text style={styles.title}>
                    Chào mừng bạn đến với{'\n'}BachKhoaViet
                </Text>
                <Text style={styles.subtitle}>
                    Hãy cho chúng tôi biết thêm về bạn để có{'\n'}
                    nhân hóa lộ trình học tập hiệu quả nhất.
                </Text>

                {/* Level selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="school-outline" size={20} color="#1a1a1a" />
                        <Text style={styles.sectionTitle}>Chọn khối lớp</Text>
                    </View>

                    <View style={styles.levelContainer}>
                        {levels.map((level) => (
                            <TouchableOpacity
                                key={level.id}
                                style={[
                                    styles.levelCard,
                                    selectedLevel === level.id && styles.levelCardSelected,
                                ]}
                                onPress={() => setSelectedLevel(level.id)}
                            >
                                <View style={[
                                    styles.levelIconContainer,
                                    selectedLevel === level.id && styles.levelIconContainerSelected,
                                ]}>
                                    <Ionicons
                                        name={level.icon}
                                        size={24}
                                        color={selectedLevel === level.id ? '#fff' : '#3B82F6'}
                                    />
                                </View>
                                <Text style={[
                                    styles.levelLabel,
                                    selectedLevel === level.id && styles.levelLabelSelected,
                                ]}>
                                    {level.label}
                                </Text>
                                <Text style={styles.levelSublabel}>{level.sublabel}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Goals selection */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="flag-outline" size={20} color="#1a1a1a" />
                        <Text style={styles.sectionTitle}>Mục tiêu học tập</Text>
                    </View>

                    <View style={styles.goalsContainer}>
                        {goals.map((goal) => (
                            <TouchableOpacity
                                key={goal.id}
                                style={[
                                    styles.goalChip,
                                    selectedGoals.includes(goal.id) && styles.goalChipSelected,
                                ]}
                                onPress={() => toggleGoal(goal.id)}
                            >
                                <Ionicons
                                    name={goal.icon}
                                    size={16}
                                    color={selectedGoals.includes(goal.id) ? '#fff' : '#3B82F6'}
                                />
                                <Text style={[
                                    styles.goalText,
                                    selectedGoals.includes(goal.id) && styles.goalTextSelected,
                                ]}>
                                    {goal.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Info note */}
                <Text style={styles.infoNote}>
                    Lộ trình được thiết kế riêng cho bạn sẽ hiển{'\n'}
                    thị sau khi bắt đầu
                </Text>
            </ScrollView>

            {/* Start button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.startButton,
                        (!selectedLevel || selectedGoals.length === 0) && styles.startButtonDisabled,
                    ]}
                    onPress={handleStart}
                    disabled={!selectedLevel || selectedGoals.length === 0}
                >
                    <Text style={styles.startButtonText}>Bắt đầu ngay</Text>
                    <Ionicons name="rocket-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    placeholder: {
        width: 40,
    },
    progressContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 3,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabel: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
    },
    progressPercent: {
        fontSize: 12,
        color: '#666',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
        lineHeight: 32,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    levelContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    levelCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    levelCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF5FF',
    },
    levelIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    levelIconContainerSelected: {
        backgroundColor: '#3B82F6',
    },
    levelLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    levelLabelSelected: {
        color: '#3B82F6',
    },
    levelSublabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    goalsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    goalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#3B82F6',
        backgroundColor: '#fff',
    },
    goalChipSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    goalText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    goalTextSelected: {
        color: '#fff',
    },
    infoNote: {
        fontSize: 13,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 8,
        marginBottom: 24,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    startButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
    },
    startButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    startButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
