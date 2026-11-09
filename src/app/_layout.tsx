import {
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { sessionStore } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [fontsLoaded, fontError] = useFonts({
        BeVietnamPro_400Regular,
        BeVietnamPro_500Medium,
        BeVietnamPro_600SemiBold,
        BeVietnamPro_700Bold,
        BeVietnamPro_800ExtraBold,
    });
    const authLoading = useAuthStore((state) => state.isLoading);

    // Khôi phục phiên đã lưu (refresh token trong SecureStore) ngay khi mở app
    useEffect(() => {
        void useAuthStore.getState().hydrate();
        // Lần mở trước mất mạng nên chưa vào được phiên: quay lại app thì thử khôi phục lần nữa
        const subscription = AppState.addEventListener('change', (state) => {
            const auth = useAuthStore.getState();
            if (state === 'active' && !auth.isAuthenticated && sessionStore.getRefreshToken()) void auth.hydrate();
        });
        return () => subscription.remove();
    }, []);

    // Giữ splash tới khi có font và biết đã đăng nhập hay chưa, tránh chớp màn "khách" rồi mới đổi
    const ready = (fontsLoaded || fontError !== null) && !authLoading;
    useEffect(() => {
        if (ready) void SplashScreen.hideAsync();
    }, [ready]);

    if (!ready) return null;

    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerTintColor: colors.brandDeep,
                    headerTitleStyle: { fontFamily: fonts.bold },
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: colors.wall },
                    contentStyle: { backgroundColor: colors.wall },
                    headerBackButtonDisplayMode: 'minimal',
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ title: 'Đăng nhập', presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ title: 'Tạo tài khoản', presentation: 'modal' }} />
            </Stack>
        </>
    );
}
