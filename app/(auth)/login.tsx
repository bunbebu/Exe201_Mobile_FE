import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

import { useAuth } from '@/context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { loginWithEmail, loginWithGoogle, loginWithFacebook, isLoading, isAuthenticated, onboardingCompleted } = useAuth();

    // Auto redirect sau khi login thành công
    useEffect(() => {
        console.log('[LOGIN] useEffect triggered:', {
            isAuthenticated,
            onboardingCompleted,
            isLoading,
        });
        
        if (isAuthenticated && !isLoading) {
            console.log('[LOGIN] Ready to redirect to index');
            router.replace('/');
        }
    }, [isAuthenticated, onboardingCompleted, isLoading]);

    const handleLogin = async () => {
        try {
            console.log('[LOGIN] handleLogin called');
            if (!email || !password) {
                Alert.alert('Thiếu thông tin', 'Vui lòng nhập đầy đủ email và mật khẩu.');
                return;
            }

            console.log('[LOGIN] Calling loginWithEmail...');
            await loginWithEmail({ email, password });
            console.log('[LOGIN] loginWithEmail completed successfully');
            
            // Wait a bit for state to update
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check onboarding status và redirect
            const onboardingStatus = await AsyncStorage.getItem('@edutech/onboardingCompleted');
            console.log('[LOGIN] After loginWithEmail - Onboarding status from storage:', onboardingStatus);
            console.log('[LOGIN] After loginWithEmail - Current auth state from hook:', {
                isAuthenticated,
                onboardingCompleted: onboardingCompleted,
                isLoading,
            });
            
            // Check onboarding status và redirect
            const onboardingCompletedFromStorage = await AsyncStorage.getItem('@edutech/onboardingCompleted');
            console.log('[LOGIN] Onboarding status from storage:', onboardingCompletedFromStorage);
            
            // Redirect về index sau khi login thành công
            console.log('[LOGIN] Redirecting to / (from handleLogin)');
            router.replace('/');
        } catch (error: any) {
            console.error('[LOGIN] Error in handleLogin:', error);
            Alert.alert(
                'Đăng nhập thất bại',
                error?.message ?? 'Vui lòng kiểm tra lại thông tin đăng nhập.'
            );
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
                    {/* Back button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Đăng nhập</Text>
                    </View>

                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBox}>
                            <Ionicons name="book-outline" size={40} color="#3B82F6" />
                        </View>
                        <Text style={styles.logoText}>BachKhoaViet</Text>
                    </View>

                    {/* Welcome text */}
                    <Text style={styles.welcomeTitle}>Chào mừng bạn quay lại</Text>
                    <Text style={styles.welcomeSubtitle}>
                        Học tập không giới hạn cùng chúng tôi
                    </Text>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Email/Phone tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity style={[styles.tab, styles.activeTab]}>
                                <Text style={[styles.tabText, styles.activeTabText]}>
                                    Email hoặc Số điện thoại
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Email input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập email hoặc số điện thoại"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Password label */}
                        <Text style={styles.inputLabel}>Mật khẩu</Text>

                        {/* Password input */}
                        <View style={styles.inputContainer}>
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

                        {/* Forgot password */}
                        <TouchableOpacity
                            style={styles.forgotPassword}
                            onPress={() => router.push('/(auth)/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
                        </TouchableOpacity>

                        {/* Login button */}
                        <TouchableOpacity
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Đăng nhập</Text>
                            )}
                        </TouchableOpacity>

                        {/* Social login divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>Hoặc tiếp tục với</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Social buttons */}
                        <View style={styles.socialContainer}>
                            <TouchableOpacity
                                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                                onPress={() => Alert.alert('Thông báo', 'Hệ thống đăng nhập bằng Google đang được bảo trì. Vui lòng đăng nhập bằng Email.')}
                                disabled={isLoading}
                            >
                                <Ionicons name="logo-google" size={20} color="#1a1a1a" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.socialButton, isLoading && styles.socialButtonDisabled]}
                                onPress={() => Alert.alert('Thông báo', 'Hệ thống đăng nhập bằng Facebook đang được bảo trì. Vui lòng đăng nhập bằng Email.')}
                                disabled={isLoading}
                            >
                                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                                <Text style={styles.socialButtonText}>Facebook</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Register link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>Chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                                <Text style={styles.registerLink}>Đăng ký ngay</Text>
                            </TouchableOpacity>
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
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginTop: -40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 24,
    },
    logoBox: {
        width: 72,
        height: 72,
        borderRadius: 16,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#3B82F6',
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
    },
    form: {
        flex: 1,
    },
    tabContainer: {
        marginBottom: 16,
    },
    tab: {
        paddingBottom: 8,
    },
    activeTab: {
        borderBottomWidth: 0,
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    activeTabText: {
        color: '#1a1a1a',
        fontWeight: '500',
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
    eyeButton: {
        paddingHorizontal: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 12,
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#E5E7EB',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#666',
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },
    socialButtonDisabled: {
        opacity: 0.5,
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1a1a1a',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
        marginBottom: 32,
    },
    registerText: {
        fontSize: 14,
        color: '#666',
    },
    registerLink: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
});
