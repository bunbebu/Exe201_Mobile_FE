import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding1" />
            <Stack.Screen name="onboarding2" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="personalize" />
            <Stack.Screen name="select-grade" />
        </Stack>
    );
}
