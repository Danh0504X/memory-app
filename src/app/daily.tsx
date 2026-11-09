import { Stack } from 'expo-router';
import { DailyScreen } from '@/features/daily/components/DailyScreen';

// Thử thách ngày: mở từ tab Luyện tập, Hôm nay hoặc trang chủ khách (không còn là tab)
export default function DailyRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Thử thách hôm nay' }} />
            <DailyScreen />
        </>
    );
}
