import { Stack } from 'expo-router';
import { MethodsScreen } from '@/features/methods/components/MethodsScreen';

export default function MethodsRoute() {
    return (
        <>
            <Stack.Screen options={{ title: 'Phương pháp' }} />
            <MethodsScreen />
        </>
    );
}
