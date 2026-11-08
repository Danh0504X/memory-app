import { Stack } from 'expo-router';
import { ChangePasswordScreen } from '@/features/profile/components/ChangePasswordScreen';

export default function ChangePasswordRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Mật khẩu', presentation: 'modal' }} />
            <ChangePasswordScreen />
        </>
    );
}
