import { Stack } from 'expo-router';
import { GoalsScreen } from '@/features/profile/components/GoalsScreen';

export default function GoalsRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Mục tiêu luyện tập', presentation: 'modal' }} />
            <GoalsScreen />
        </>
    );
}
