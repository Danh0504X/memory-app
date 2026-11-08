import { Stack } from 'expo-router';
import { ForgotPasswordScreen } from '@/features/auth/components/ForgotPasswordScreen';

export default function ForgotPasswordRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Quên mật khẩu', presentation: 'modal' }} />
            <ForgotPasswordScreen />
        </>
    );
}
