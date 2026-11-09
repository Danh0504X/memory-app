import { useLocalSearchParams } from 'expo-router';
import { ParentVerifyScreen } from '@/features/parent/components/ParentAccountScreens';
export default function VerifyParent() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    return <ParentVerifyScreen key={token} rawToken={token} />;
}
