import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';

// Khung màn Hồ sơ. EXP, huy hiệu và mục tiêu luyện tập (features/profile) sẽ được nối vào ở bước sau.
export default function ProfileScreen() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [loggingOut, setLoggingOut] = useState(false);

    if (!user) {
        return (
            <Screen>
                <AppText variant="title">Hồ sơ</AppText>
                <AppText variant="lead">Đăng nhập để lưu EXP, kỷ lục và chuỗi ngày luyện tập trên mọi thiết bị.</AppText>
                <Button title="Đăng nhập" onPress={() => router.push('/login')} />
                <Button title="Tạo tài khoản" variant="secondary" onPress={() => router.push('/register')} />
            </Screen>
        );
    }

    const onLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
        } catch {
            // logout() luôn xoá phiên trên máy; lỗi mạng chỉ làm backend chưa thu hồi được refresh token
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <Screen>
            <AppText variant="title">Hồ sơ</AppText>
            <View style={styles.card}>
                <AppText variant="heading">{user.username}</AppText>
                <AppText variant="small">{user.email}</AppText>
            </View>
            <Button title="Đăng xuất" variant="secondary" loading={loggingOut} onPress={onLogout} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.step,
        padding: spacing.lg,
        gap: 4,
    },
});
