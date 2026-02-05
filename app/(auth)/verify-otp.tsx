import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [timer, setTimer] = useState(59);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        // Mock verify OTP - navigate to personalize screen
        router.push('/(auth)/personalize');
    };

    const handleResend = () => {
        setTimer(59);
        // Mock resend OTP
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
                        Nhập mã xác thực đã gửi tới Email/SĐT của{'\n'}bạn
                    </Text>

                    {/* OTP Input */}
                    <View style={styles.otpContainer}>
                        {[0, 1, 2, 3].map((index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    otp[index] ? styles.otpInputFilled : null,
                                ]}
                                value={otp[index]}
                                onChangeText={(value) => handleOtpChange(value.slice(-1), index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
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
                        disabled={timer > 0}
                    >
                        <Text style={styles.resendText}>
                            Chưa nhận được mã?{' '}
                            <Text style={[styles.resendLink, timer > 0 && styles.resendLinkDisabled]}>
                                Gửi lại mã
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Verify button */}
                <TouchableOpacity
                    style={[
                        styles.verifyButton,
                        otp.every((digit) => digit) ? null : styles.verifyButtonDisabled,
                    ]}
                    onPress={handleVerify}
                    disabled={!otp.every((digit) => digit)}
                >
                    <Text style={styles.verifyButtonText}>Xác nhận</Text>
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
