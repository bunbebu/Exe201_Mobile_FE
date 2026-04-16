import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
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
} from 'react-native';

import { API_BASE_URL } from '@/config/api';
import { useAuth } from '@/context/AuthContext';

type GenderType = 'male' | 'female';

export default function UpdateProfile() {
    const [fullName, setFullName] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [gender, setGender] = useState<GenderType | null>(null);
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { tokens, onboardingGrade, markOnboardingCompleted } = useAuth();

    const formatDateInput = (text: string): string => {
        // Chỉ lấy số, bỏ tất cả ký tự khác
        const numbers = text.replace(/\D/g, '');

        // Format: YYYY-MM-DD
        if (numbers.length === 0) {
            return '';
        } else if (numbers.length <= 4) {
            return numbers;
        } else if (numbers.length <= 6) {
            return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
        } else {
            return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
        }
    };

    const isValidDate = (dateString: string): boolean => {
        // Kiểm tra format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }

        // Kiểm tra date có hợp lệ không
        const date = new Date(dateString);
        const [year, month, day] = dateString.split('-').map(Number);

        return (
            date instanceof Date &&
            !isNaN(date.getTime()) &&
            date.getFullYear() === year &&
            date.getMonth() + 1 === month &&
            date.getDate() === day
        );
    };

    const handleContinue = async () => {
        if (!fullName.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên đầy đủ.');
            return;
        }

        if (!schoolName.trim()) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên trường học.');
            return;
        }


        if (!onboardingGrade) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin khối lớp. Vui lòng quay lại chọn khối lớp.');
            router.back();
            return;
        }

        // Validate dateOfBirth nếu có
        if (dateOfBirth && !isValidDate(dateOfBirth)) {
            Alert.alert('Ngày sinh không hợp lệ', 'Vui lòng nhập ngày sinh theo định dạng YYYY-MM-DD (VD: 2010-06-20)');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/student-profiles/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.accessToken}`,
                },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    schoolName: schoolName.trim(),
                    gender: gender || undefined,
                    dateOfBirth: dateOfBirth && isValidDate(dateOfBirth) ? dateOfBirth : undefined,
                    gradeLevel: String(onboardingGrade),
                }),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                throw new Error(text || 'Cập nhật thông tin thất bại.');
            }

            // Đánh dấu onboarding đã hoàn tất
            await markOnboardingCompleted();

            // Chuyển đến tabs
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert(
                'Cập nhật thất bại',
                error?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.'
            );
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
                        <Text style={styles.headerTitle}>Cập nhật hồ sơ</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Progress indicator */}
                    <View style={styles.progressContainer}>
                        <Text style={styles.progressText}>Tiến độ hoàn thành</Text>
                        <Text style={styles.progressStep}>2 / 2</Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Thông tin cá nhân</Text>
                    <Text style={styles.subtitle}>
                        Vui lòng cập nhật thông tin để hoàn tất hồ sơ của bạn.
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full name */}
                        <Text style={styles.inputLabel}>Họ và tên đầy đủ *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập họ và tên đầy đủ"
                                placeholderTextColor="#9CA3AF"
                                value={fullName}
                                onChangeText={setFullName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* School name */}
                        <Text style={styles.inputLabel}>Tên trường học *</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên trường học"
                                placeholderTextColor="#9CA3AF"
                                value={schoolName}
                                onChangeText={setSchoolName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Gender */}
                        <Text style={styles.inputLabel}>Giới tính</Text>
                        <View style={styles.genderContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.genderCard,
                                    gender === 'male' && styles.genderCardSelected,
                                ]}
                                onPress={() => setGender('male')}
                            >
                                <Ionicons
                                    name="male-outline"
                                    size={24}
                                    color={gender === 'male' ? '#fff' : '#3B82F6'}
                                />
                                <Text
                                    style={[
                                        styles.genderText,
                                        gender === 'male' && styles.genderTextSelected,
                                    ]}
                                >
                                    Nam
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.genderCard,
                                    gender === 'female' && styles.genderCardSelected,
                                ]}
                                onPress={() => setGender('female')}
                            >
                                <Ionicons
                                    name="female-outline"
                                    size={24}
                                    color={gender === 'female' ? '#fff' : '#3B82F6'}
                                />
                                <Text
                                    style={[
                                        styles.genderText,
                                        gender === 'female' && styles.genderTextSelected,
                                    ]}
                                >
                                    Nữ
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Date of birth */}
                        <Text style={styles.inputLabel}>Ngày sinh (YYYY-MM-DD)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="VD: 2010-06-20"
                                placeholderTextColor="#9CA3AF"
                                value={dateOfBirth}
                                onChangeText={(text) => setDateOfBirth(formatDateInput(text))}
                                // Dùng default keyboard để có thể nhập cả số và dấu '-' trên mobile
                                keyboardType="default"
                                maxLength={10}
                            />
                            <Ionicons name="calendar-outline" size={20} color="#9CA3AF" style={styles.iconRight} />
                        </View>
                    </View>
                </ScrollView>

                {/* Continue button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!fullName.trim() || !schoolName.trim() || isSubmitting) &&
                            styles.continueButtonDisabled,
                        ]}
                        onPress={handleContinue}
                        disabled={!fullName.trim() || !schoolName.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.continueButtonText}>Hoàn tất</Text>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 24,
        marginBottom: 8,
    },
    subtitle: {
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
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1a1a1a',
    },
    iconRight: {
        paddingHorizontal: 16,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    genderCardSelected: {
        borderColor: '#3B82F6',
        backgroundColor: '#3B82F6',
    },
    genderText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    genderTextSelected: {
        color: '#fff',
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
