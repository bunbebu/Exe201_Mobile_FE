import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

export default function ResetPassword() {
  const params = useLocalSearchParams<{ email: string }>();
  const [email] = useState(params.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [step, setStep] = useState<'otp' | 'password'>('otp');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, timer]);

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

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ 6 số OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otpString,
        }),
      });

      if (res.ok) {
        const data: any = await res.json();
        setResetToken(data.resetToken);
        setStep('password');
        Alert.alert('Thành công', 'OTP hợp lệ. Vui lòng đặt mật khẩu mới.');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'OTP không hợp lệ hoặc đã hết hạn.');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Lỗi', error?.message || 'OTP không hợp lệ. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    if (!resetToken) {
      Alert.alert('Lỗi', 'Không có reset token. Vui lòng thử lại từ đầu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken,
          newPassword,
        }),
      });

      if (res.ok) {
        Alert.alert(
          'Thành công',
          'Mật khẩu đã được đặt lại. Vui lòng đăng nhập với mật khẩu mới.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => router.replace('/(auth)/login'),
            },
          ]
        );
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/password/forgot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (res.ok) {
        setTimer(600);
        setOtp(['', '', '', '', '', '']);
        Alert.alert('Thành công', 'OTP mới đã được gửi đến email của bạn.');
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Không thể gửi lại OTP. Vui lòng thử lại.');
      }
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {step === 'otp' ? 'Xác thực OTP' : 'Đặt lại mật khẩu'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {step === 'otp'
                ? `Nhập mã OTP đã gửi đến ${email}`
                : 'Vui lòng nhập mật khẩu mới của bạn'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 'otp' ? (
              <>
                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[styles.otpInput, otp[index] ? styles.otpInputFilled : null]}
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
                  onPress={handleResendOTP}
                  disabled={timer > 0 || isLoading}
                >
                  <Text style={styles.resendText}>
                    Chưa nhận được mã?{' '}
                    <Text
                      style={[styles.resendLink, (timer > 0 || isLoading) && styles.resendLinkDisabled]}
                    >
                      Gửi lại mã
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* Verify button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (otp.join('').length !== 6 || isLoading) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={otp.join('').length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Xác nhận OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* New Password */}
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>

                {/* Reset button */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Đặt lại mật khẩu</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
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
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    backgroundColor: '#F9FAFB',
  },
  otpInputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#fff',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#9CA3AF',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
