import { Stack } from 'expo-router';
import { DailyScreen } from '@/features/daily/components/DailyScreen';

export default function DailyRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Thử thách hôm nay' }} />
            <DailyScreen />
        </>
    );
}
