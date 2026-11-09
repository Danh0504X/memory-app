import { Stack } from 'expo-router';
import { DeleteAccountScreen } from '@/features/profile/components/DeleteAccountScreen';

export default function DeleteAccountRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Xoá tài khoản', presentation: 'modal' }} />
            <DeleteAccountScreen />
        </>
    );
}
