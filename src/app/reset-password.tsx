import { Stack, useLocalSearchParams } from 'expo-router';
import { ResetPasswordScreen } from '@/features/auth/components/ResetPasswordScreen';

// memio://reset-password?token=... (link trong email đặt lại mật khẩu)
export default function ResetPasswordRoute() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    return (
        <>
            <Stack.Screen options={{ title: 'Đặt mật khẩu mới' }} />
            <ResetPasswordScreen key={token} rawToken={token} />
        </>
    );
}
