import { Stack } from 'expo-router';
import { PrivacyScreen } from '@/features/profile/components/PrivacyScreen';

export default function PrivacyRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Quyền riêng tư', presentation: 'modal' }} />
            <PrivacyScreen />
        </>
    );
}
