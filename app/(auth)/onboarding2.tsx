import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface StepItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    badge?: string;
    isLast?: boolean;
}

function StepItem({ icon, title, description, badge, isLast = false }: StepItemProps) {
    return (
        <View style={styles.stepContainer}>
            {/* Timeline */}
            <View style={styles.timeline}>
                <View style={styles.iconCircle}>
                    <Ionicons name={icon} size={20} color="#3B82F6" />
                </View>
                {!isLast && <View style={styles.line} />}
            </View>

            {/* Content */}
            <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>{title}</Text>
                    {badge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.stepDescription}>{description}</Text>
            </View>
        </View>
    );
}

export default function Onboarding2() {
    const steps = [
        {
            icon: 'flag' as const,
            title: 'Bắt đầu',
            description: 'Xác định mục tiêu học tập',
        },
        {
            icon: 'bulb' as const,
            title: 'Kiểm tra năng lực',
            description: 'Bài thi đầu vào thông minh',
            badge: 'SAVE 8 QR',
        },
        {
            icon: 'book' as const,
            title: 'Bài học cốt lõi',
            description: 'Kiến thức nền tảng vững chắc',
        },
        {
            icon: 'trophy' as const,
            title: 'Chinh phục mục tiêu',
            description: 'Hoàn thành lộ trình riêng bạn',
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Skip button */}
            <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.skipText}>Bỏ qua</Text>
            </TouchableOpacity>

            {/* Main content */}
            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.title}>Lộ trình cá nhân hóa</Text>

                {/* Description */}
                <Text style={styles.description}>
                    BachKhoaViet tự động điều chỉnh nội dung{'\n'}
                    học tập dựa trên trình độ và tốc độ của bạn,{'\n'}
                    giúp bạn tiến bộ mỗi ngày một cách hiệu{'\n'}
                    quả nhất.
                </Text>

                {/* Steps */}
                <View style={styles.stepsContainer}>
                    {steps.map((step, index) => (
                        <StepItem
                            key={index}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                            badge={step.badge}
                            isLast={index === steps.length - 1}
                        />
                    ))}
                </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.replace('/(auth)/login')}
            >
                <Text style={styles.continueButtonText}>Tiếp theo</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 24,
    },
    skipButton: {
        alignSelf: 'flex-end',
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    skipText: {
        fontSize: 16,
        color: '#666',
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 22,
        marginBottom: 32,
    },
    stepsContainer: {
        marginTop: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    timeline: {
        alignItems: 'center',
        marginRight: 16,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EBF5FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 4,
        minHeight: 30,
    },
    stepContent: {
        flex: 1,
        paddingTop: 8,
        paddingBottom: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    badge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
    },
    stepDescription: {
        fontSize: 14,
        color: '#666',
    },
    continueButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 32,
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
