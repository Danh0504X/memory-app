import { Stack } from 'expo-router';
import { ProgressScreen } from '@/features/dashboard/components/ProgressScreen';

export default function ProgressRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Tiến độ' }} />
            <ProgressScreen />
        </>
    );
}
