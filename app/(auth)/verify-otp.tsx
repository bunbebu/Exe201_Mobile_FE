import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function VerifyOTP() {
    const params = useLocalSearchParams<{ email?: string }>();
    const email = (params.email as string | undefined) ?? '';

    const { requestPasswordResetOtp, verifyPasswordResetOtp } = useAuth();

    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(600); // 10 minutes
    const [isLoading, setIsLoading] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value.replace(/[^0-9]/g, '').slice(-1);
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');

        if (!email.trim()) {
            // Mantém compatibilidade com fluxo mock do register (chưa gửi email).
            router.push('/(auth)/personalize');
            return;
        }

        if (otpString.length !== 6) {
            Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ 6 số OTP.');
            return;
        }

        setIsLoading(true);
        try {
            const { resetToken } = await verifyPasswordResetOtp({
                email: email.trim(),
                otp: otpString,
            });

            router.push({
                pathname: '/(auth)/reset-password',
                params: { resetToken, email: email.trim() },
            });
        } catch (error: any) {
            console.error('Error verifying OTP:', error);
            Alert.alert('Lỗi', error?.message || 'OTP không hợp lệ. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email.trim()) {
            Alert.alert('Thiếu thông tin', 'Không tìm thấy email để gửi lại OTP.');
            return;
        }

        setIsLoading(true);
        try {
            await requestPasswordResetOtp({ email: email.trim() });
            setTimer(600);
            setOtp(['', '', '', '', '', '']);
            Alert.alert('Thành công', 'Nếu email này đã được đăng ký, OTP mới đã được gửi.');
        } catch (error: any) {
            console.error('Error resending OTP:', error);
            Alert.alert('Lỗi', error?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.title}>Xác thực OTP</Text>
                    <Text style={styles.subtitle}>
                        {email
                            ? `Nhập mã OTP đã gửi đến ${email}`
                            : 'Nhập mã OTP của bạn'}
                    </Text>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    otp[index] ? styles.otpInputFilled : null,
                                ]}
                                value={otp[index]}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!isLoading}
                            />
                        ))}
                    </View>

                    {/* Timer */}
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(timer)}</Text>
                        <Text style={styles.timerLabel}>Còn lại</Text>
                    </View>

                    {/* Resend link */}
                    <TouchableOpacity
                        style={styles.resendContainer}
                        onPress={handleResend}
                        disabled={timer > 0 || isLoading || !email.trim()}
                    >
                        <Text style={styles.resendText}>
                            Chưa nhận được mã?{' '}
                            <Text
                                style={[
                                    styles.resendLink,
                                    (timer > 0 || isLoading || !email.trim()) && styles.resendLinkDisabled,
                                ]}
                            >
                                Gửi lại mã
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Verify button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        (otp.join('').length !== 6 || isLoading) ? styles.verifyButtonDisabled : null,
                    ]}
                    onPress={handleVerify}
                    disabled={otp.join('').length !== 6 || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.verifyButtonText}>Xác nhận OTP</Text>
                    )}
                </TouchableOpacity>
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
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    otpInput: {
        width: 56,
        height: 56,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: '#1a1a1a',
    },
    otpInputFilled: {
        borderColor: '#3B82F6',
        backgroundColor: '#EBF5FF',
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    timerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#3B82F6',
    },
    timerLabel: {
        fontSize: 14,
        color: '#666',
    },
    resendContainer: {
        marginTop: 8,
    },
    resendText: {
        fontSize: 14,
        color: '#666',
    },
    resendLink: {
        color: '#3B82F6',
        fontWeight: '500',
    },
    resendLinkDisabled: {
        color: '#9CA3AF',
    },
    verifyButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    verifyButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
