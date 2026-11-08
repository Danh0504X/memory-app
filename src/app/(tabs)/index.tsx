import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';

// Khung màn Today. Gợi ý trò chơi và mục tiêu theo ngày (features/today/utils) sẽ được nối vào ở bước sau.
export default function TodayScreen() {
    const user = useAuthStore((state) => state.user);

    return (
        <Screen>
            <AppText variant="small">Memio</AppText>
            <AppText variant="title">{user ? `Chào ${user.username}!` : 'Rèn trí nhớ mỗi ngày'}</AppText>
            <AppText variant="lead">
                {user
                    ? 'Mỗi ngày vài phút: chơi một ván để giữ chuỗi ngày luyện tập.'
                    : 'Chơi ngay không cần tài khoản. Đăng nhập để lưu EXP, kỷ lục và chuỗi ngày.'}
            </AppText>

            <View style={styles.card}>
                <AppText variant="heading">Bắt đầu luyện tập</AppText>
                <AppText variant="small">Năm trò chơi: thẻ bài, hình ảnh, số, gương mặt & tên, từ.</AppText>
                <Button title="Chọn trò chơi" onPress={() => router.navigate('/games')} />
            </View>

            {!user ? <Button title="Đăng nhập" variant="secondary" onPress={() => router.push('/login')} /> : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: radius * 1.5,
        borderWidth: 1,
        borderColor: colors.step,
        padding: spacing.lg,
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
});
