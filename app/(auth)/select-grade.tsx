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
    Alert,
    ActivityIndicator,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

type GradeType = 9 | 10 | 11 | 12;

interface GradeOption {
    grade: GradeType;
    label: string;
}

export default function SelectGrade() {
    const [selectedGrade, setSelectedGrade] = useState<GradeType | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { tokens, onboardingGoals, setOnboardingGrade, markOnboardingCompleted } = useAuth();

    const grades: GradeOption[] = [
        { grade: 9, label: 'Lớp 9' },
        { grade: 10, label: 'Lớp 10' },
        { grade: 11, label: 'Lớp 11' },
        { grade: 12, label: 'Lớp 12' },
    ];

    const handleContinue = async () => {
        if (!selectedGrade) return;
        if (!tokens?.accessToken) {
            Alert.alert('Phiên đăng nhập hết hạn', 'Vui lòng đăng nhập lại.');
            router.replace('/(auth)/login');
            return;
        }

        setIsSubmitting(true);
        try {
            // Gọi API onboarding student profile
            // Dựa theo swagger: POST /api/v1/student-profiles/onboarding (CompleteOnboardingDto)
            // Body cụ thể có thể cần tinh chỉnh lại theo backend thực tế.
            await fetch(`${API_BASE_URL}/api/v1/student-profiles/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.accessToken}`,
                },
                body: JSON.stringify({
                    gradeLevel: selectedGrade,
                    goals: onboardingGoals,
                }),
            });

            // Lưu grade vào context (client)
            setOnboardingGrade(selectedGrade);

            // Chuyển sang màn hình cập nhật profile
            router.replace('/(auth)/update-profile');
        } catch (error: any) {
            Alert.alert(
                'Không thể hoàn tất cấu hình',
                error?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cá nhân hóa</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Tiến độ hoàn thành</Text>
                <Text style={styles.progressStep}>1 / 2</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={styles.title}>Bạn đang học lớp mấy?</Text>
                <Text style={styles.subtitle}>
                    Chọn khối lớp hiện tại để chúng tôi chuẩn bị{'\n'}
                    nội dung và bài tập phù hợp nhất với chương{'\n'}
                    trình của bạn.
                </Text>

                {/* Grade grid */}
                <View style={styles.gradeGrid}>
                    {grades.map((item) => (
                        <TouchableOpacity
                            key={item.grade}
                            style={[
                                styles.gradeCard,
                                selectedGrade === item.grade && styles.gradeCardSelected,
                            ]}
                            onPress={() => setSelectedGrade(item.grade)}
                        >
                            <View style={[
                                styles.gradeIconContainer,
                                selectedGrade === item.grade && styles.gradeIconContainerSelected,
                            ]}>
                                <Ionicons
                                    name="book-outline"
                                    size={20}
                                    color={selectedGrade === item.grade ? '#fff' : '#3B82F6'}
                                />
                            </View>
                            <Text style={[
                                styles.gradeLabel,
                                selectedGrade === item.grade && styles.gradeLabelSelected,
                            ]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Goal section */}
                <View style={styles.goalSection}>
                    <Text style={styles.goalTitle}>Mục tiêu của bạn là gì?</Text>
                    <Text style={styles.goalSubtitle}>
                        Chúng tôi sẽ tối ưu hóa lộ trình dựa trên đích đến của{'\n'}bạn.
                    </Text>
                </View>
            </ScrollView>

            {/* Continue button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        (!selectedGrade || isSubmitting) && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedGrade || isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.continueButtonText}>Tiếp tục</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    progressText: {
        fontSize: 14,
        color: '#666',
    },
    progressStep: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
    },
    gradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gradeCard: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    gradeCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF5FF',
    },
    gradeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradeIconContainerSelected: {
        backgroundColor: '#3B82F6',
    },
    gradeLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    gradeLabelSelected: {
        color: '#3B82F6',
    },
    goalSection: {
        marginTop: 32,
        marginBottom: 24,
    },
    goalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    goalSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
    },
    buttonContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#fff',
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
    },
    continueButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
