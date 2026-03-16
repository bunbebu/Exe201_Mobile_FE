import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';

const STORAGE_KEYS = {
    OAUTH_COMPLETION_TOKEN: "@edutech/oauthCompletionToken",
};

type LearningGoal = "lay-lai-goc" | "hoc-nang-cao" | "on-thi-thpt" | "luyen-thi-10";

interface GoalOption {
    id: LearningGoal;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

export default function CompleteOAuth() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
    const [selectedGoals, setSelectedGoals] = useState<LearningGoal[]>([]);
    const [completionToken, setCompletionToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { completeOAuthProfile, setOnboardingGoals, setOnboardingGrade } = useAuth();

    const grades = [9, 10, 11, 12];

    const goals: GoalOption[] = [
        { id: 'lay-lai-goc', label: 'Lấy lại gốc', icon: 'refresh-outline' },
        { id: 'hoc-nang-cao', label: 'Học nâng cao', icon: 'trending-up-outline' },
        { id: 'on-thi-thpt', label: 'Ôn thi THPT Quốc gia', icon: 'school-outline' },
        { id: 'luyen-thi-10', label: 'Luyện thi vào 10', icon: 'trophy-outline' },
    ];

    useEffect(() => {
        // Load completion token from storage
        AsyncStorage.getItem(STORAGE_KEYS.OAUTH_COMPLETION_TOKEN).then((token) => {
            if (token) {
                setCompletionToken(token);
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
                router.replace('/(auth)/login');
            }
        });
    }, []);

    const toggleGoal = (goalId: LearningGoal) => {
        if (selectedGoals.includes(goalId)) {
            setSelectedGoals(selectedGoals.filter((g) => g !== goalId));
        } else {
            setSelectedGoals([...selectedGoals, goalId]);
        }
    };

    const handleComplete = async () => {
        if (!completionToken) {
            Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
            return;
        }

        if (!firstName || !lastName) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ họ và tên.');
            return;
        }

        if (!selectedGrade) {
            Alert.alert('Thiếu thông tin', 'Vui lòng chọn khối lớp.');
            return;
        }

        if (selectedGoals.length === 0) {
            Alert.alert('Thiếu thông tin', 'Vui lòng chọn ít nhất một mục tiêu học tập.');
            return;
        }

        setIsSubmitting(true);
        try {
            await completeOAuthProfile({
                completionToken,
                role: 'STUDENT',
                firstName,
                lastName,
                phoneNumber: phoneNumber || undefined,
                gradeLevel: selectedGrade,
                goals: selectedGoals,
            });

            // Save onboarding data
            await setOnboardingGrade(selectedGrade);
            await setOnboardingGoals(selectedGoals);

            // Navigate to select-grade screen (đã có grade và goals, chỉ cần chọn lại để confirm)
            router.replace('/(auth)/select-grade');
        } catch (error: any) {
            Alert.alert('Lỗi', error?.message ?? 'Hoàn tất hồ sơ thất bại. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Hoàn tất hồ sơ</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Welcome text */}
                    <Text style={styles.welcomeTitle}>Chào mừng bạn!</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Vui lòng điền thông tin để hoàn tất tài khoản của bạn.
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* First name */}
                        <Text style={styles.inputLabel}>Họ *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ"
                                placeholderTextColor="#9CA3AF"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>

                        {/* Last name */}
                        <Text style={styles.inputLabel}>Tên *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên"
                                placeholderTextColor="#9CA3AF"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>

                        {/* Phone number (optional) */}
                        <Text style={styles.inputLabel}>Số điện thoại (tùy chọn)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập số điện thoại"
                                placeholderTextColor="#9CA3AF"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Grade selection */}
                        <Text style={styles.inputLabel}>Khối lớp *</Text>
                        <View style={styles.gradeContainer}>
                            {grades.map((grade) => (
                                <TouchableOpacity
                                    key={grade}
                                    style={[
                                        styles.gradeCard,
                                        selectedGrade === grade && styles.gradeCardSelected,
                                    ]}
                                    onPress={() => setSelectedGrade(grade)}
                                >
                                    <Text
                                        style={[
                                            styles.gradeText,
                                            selectedGrade === grade && styles.gradeTextSelected,
                                        ]}
                                    >
                                        Lớp {grade}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Goals selection */}
                        <Text style={styles.inputLabel}>Mục tiêu học tập *</Text>
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
                                    <Text
                                        style={[
                                            styles.goalText,
                                            selectedGoals.includes(goal.id) && styles.goalTextSelected,
                                        ]}
                                    >
                                        {goal.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Complete button */}
                        <TouchableOpacity
                            style={[
                                styles.completeButton,
                                isSubmitting && styles.completeButtonDisabled,
                            ]}
                            onPress={handleComplete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.completeButtonText}>Hoàn tất</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 24,
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
    },
    form: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 14,
        color: '#1a1a1a',
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1a1a1a',
    },
    gradeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    gradeCard: {
        width: '47%',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    gradeCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF5FF',
    },
    gradeText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    gradeTextSelected: {
        color: '#3B82F6',
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
    completeButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    completeButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    completeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
