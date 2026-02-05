import { router } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function Onboarding1() {
    return (
        <SafeAreaView style={styles.container}>
            {/* Skip button */}
            <TouchableOpacity style={styles.skipButton} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.skipText}>Bỏ qua</Text>
            </TouchableOpacity>

            {/* Main content */}
            <View style={styles.content}>
                {/* Image */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop' }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>

                {/* Title */}
                <Text style={styles.title}>
                    Học tập thông minh{'\n'}cùng AI
                </Text>

                {/* Description */}
                <Text style={styles.description}>
                    Khám phá lộ trình học tập cá nhân hóa{'\n'}
                    và giải đáp mọi thắc mắc ngay lập tức{'\n'}
                    với BachKhoaViet.
                </Text>

                {/* Pagination dots */}
                <View style={styles.pagination}>
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={styles.dot} />
                </View>
            </View>

            {/* Continue button */}
            <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.push('/(auth)/onboarding2')}
            >
                <Text style={styles.continueButtonText}>Tiếp tục →</Text>
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
        alignSelf: 'flex-start',
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    imageContainer: {
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 42,
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    pagination: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D1D5DB',
    },
    activeDot: {
        backgroundColor: '#3B82F6',
        width: 24,
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
