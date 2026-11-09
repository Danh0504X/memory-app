import { router } from 'expo-router';
import { BarChart3 } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { AuthHeader } from '@/features/auth/components/AuthParts';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ProgressScreen } from '@/features/dashboard/components/ProgressScreen';

// Tab Tiến độ. Khách chưa có lịch sử trên máy chủ nên mời đăng nhập thay vì hiện lỗi 401
export default function ProgressTab() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (isAuthenticated) return <ProgressScreen />;
    return (
        <Screen>
            <AppText variant="title">Tiến độ</AppText>
            <AuthHeader
                title="Theo dõi tiến bộ của bạn"
                line="Đăng nhập để xem biểu đồ độ chính xác, lịch luyện tập và mọi ván đã chơi."
                icon={<BarChart3 color="#1c7ed6" size={48} />}
                tint={colors.sky}
            />
            <Button title="Đăng nhập" onPress={() => router.push('/login')} />
            <Button title="Tạo tài khoản" variant="secondary" onPress={() => router.push('/register')} />
        </Screen>
    );
}
