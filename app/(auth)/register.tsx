import { API_BASE_URL } from '@/config/api';
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

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [gradeLevel, setGradeLevel] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [nationalIdNumber, setNationalIdNumber] = useState('');
    const [educationLevel, setEducationLevel] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegister = async () => {
        setErrorMessage('');
        if (!agreeTerms) {
            Alert.alert("Lỗi", "Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.");
            return;
        }

        if (!fullName || !emailOrPhone || !password || !confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            console.log("[REGISTER] Starting handleRegister...");
            setIsLoading(true);
            const nameParts = fullName.trim().split(' ');
            const lastName = nameParts[0] || 'Unknown';
            const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Name';

            const payload = {
                email: emailOrPhone.trim(),
                password: password,
                firstName: firstName,
                lastName: lastName,
                role: "STUDENT",
                gradeLevel: gradeLevel.trim(),
                phoneNumber: phoneNumber.trim(),
                relationship: "OTHER",
                nationalIdNumber: nationalIdNumber.trim(),
                subjectsTaught: [
                    "Mathematics"
                ],
                yearsOfExperience: 0,
                educationLevel: educationLevel.trim()
            };

            console.log("[REGISTER] Payload:", JSON.stringify(payload));
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/email/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            console.log("[REGISTER] Response status:", response.status, "ok:", response.ok);

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                console.error("[REGISTER] API Error raw response:", text);

                let errMsg = "Đăng ký thất bại.";
                try {
                    const data = JSON.parse(text);
                    const rawMessage = data.message || data.error || data.data?.message;
                    console.log("[REGISTER] Parsed rawMessage:", rawMessage);

                    if (Array.isArray(rawMessage)) {
                        errMsg = rawMessage.join("\n");
                    } else if (rawMessage) {
                        errMsg = String(rawMessage);
                    }
                } catch (e) {
                    console.error("[REGISTER] JSON parse error:", e);
                    if (text && text.length < 200) errMsg = text;
                }
                console.log("[REGISTER] Final error message to show:", errMsg);
                throw new Error(errMsg);
            }

            const responseData = await response.json();
            console.log("[REGISTER] Success response:", responseData);
            const apiMessage = responseData?.message || "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.";
            setSuccessMessage(apiMessage);
            setRegisterSuccess(true);
        } catch (error: any) {
            console.error("[REGISTER] Caught error:", error);
            const msg = error.message || "Có lỗi xảy ra, vui lòng thử lại.";
            setErrorMessage(msg);
            Alert.alert("Lỗi", msg);
        } finally {
            setIsLoading(false);
            console.log("[REGISTER] handleRegister finished.");
        }
    };

    // --- Success Screen ---
    if (registerSuccess) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.successWrapper}>
                    <View style={styles.successIconCircle}>
                        <Ionicons name="mail-open-outline" size={56} color="#3B82F6" />
                    </View>
                    <Text style={styles.successTitle}>Đăng ký thành công!</Text>
                    <Text style={styles.successMessage}>{successMessage}</Text>
                    <View style={styles.successHint}>
                        <Ionicons name="information-circle-outline" size={18} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.successHintText}>
                            Kiểm tra cả hòm thư Spam nếu không thấy email.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backToLoginButton}
                        onPress={() => router.replace('/(auth)/login')}
                    >
                        <Ionicons name="arrow-back-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.backToLoginText}>Quay lại đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Đăng ký tài khoản</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Welcome text */}
                        <Text style={styles.welcomeTitle}>Chào mừng bạn!</Text>
                        <Text style={styles.welcomeSubtitle}>
                            Hãy điền thông tin bên dưới để tham gia cộng{'\n'}
                            đồng học tập BachKhoaViet.
                        </Text>

                        {/* Form */}
                        <View style={styles.form}>
                            {/* Full name */}
                            <Text style={styles.inputLabel}>Họ và tên</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập họ và tên của bạn"
                                    placeholderTextColor="#9CA3AF"
                                    value={fullName}
                                    onChangeText={setFullName}
                                />
                            </View>

                            {/* Email */}
                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập email"
                                    placeholderTextColor="#9CA3AF"
                                    value={emailOrPhone}
                                    onChangeText={setEmailOrPhone}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Phone Number */}
                            <Text style={styles.inputLabel}>Số điện thoại</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#9CA3AF"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Grade Level */}
                            <Text style={styles.inputLabel}>Lớp học (Grade Level)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="school-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập lớp học (VD: 10)"
                                    placeholderTextColor="#9CA3AF"
                                    value={gradeLevel}
                                    onChangeText={setGradeLevel}
                                />
                            </View>

                            {/* National ID Number */}
                            <Text style={styles.inputLabel}>CCCD/CMND (National ID)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="card-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập CCCD/CMND"
                                    placeholderTextColor="#9CA3AF"
                                    value={nationalIdNumber}
                                    onChangeText={setNationalIdNumber}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Education Level */}
                            <Text style={styles.inputLabel}>Trình độ học vấn</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="book-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập trình độ (VD: MASTER, BACHELOR)"
                                    placeholderTextColor="#9CA3AF"
                                    value={educationLevel}
                                    onChangeText={setEducationLevel}
                                />
                            </View>


                            {/* Password */}
                            <Text style={styles.inputLabel}>Mật khẩu</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập mật khẩu"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowPassword(!showPassword)}
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
                                    placeholder="Nhập lại mật khẩu"
                                    placeholderTextColor="#9CA3AF"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.eyeButton}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={22}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Terms checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAgreeTerms(!agreeTerms)}
                            >
                                <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                                    {agreeTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxText}>
                                    Tôi đồng ý với{' '}
                                    <Text style={styles.linkText}>Điều khoản dịch vụ</Text>
                                    {' '}và{' '}
                                    <Text style={styles.linkText}>Chính sách bảo mật</Text>
                                </Text>
                            </TouchableOpacity>

                            {/* Error message */}
                            {errorMessage ? (
                                <View style={styles.errorContainer}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                                    <Text style={styles.errorText}>{errorMessage}</Text>
                                </View>
                            ) : null}

                            {/* Register button */}
                            <TouchableOpacity
                                style={[styles.registerButton, (!agreeTerms || isLoading) && styles.registerButtonDisabled]}
                                onPress={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerButtonText}>Đăng ký</Text>
                                )}
                            </TouchableOpacity>

                            {/* Login link */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Bạn đã có tài khoản? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                    <Text style={styles.loginLink}>Đăng nhập</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3B82F6',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
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
        marginTop: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
    },
    inputIcon: {
        marginLeft: 16,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1a1a1a',
    },
    eyeButton: {
        paddingHorizontal: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 20,
        marginBottom: 24,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    linkText: {
        color: '#3B82F6',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginLeft: 8,
        fontWeight: '500',
    },
    registerButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    registerButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    loginText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    // --- Success Screen Styles ---
    successWrapper: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    successIconCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        borderWidth: 2,
        borderColor: '#BFDBFE',
    },
    successTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 14,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 15,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
    },
    successHint: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    successHintText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
    },
    backToLoginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignSelf: 'stretch',
        justifyContent: 'center',
    },
    backToLoginText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
