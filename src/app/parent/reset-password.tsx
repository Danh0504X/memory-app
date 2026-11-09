import { useLocalSearchParams } from 'expo-router';
import { ResetPasswordScreen } from '@/features/auth/components/ResetPasswordScreen';
export default function ResetParentPassword() {
    const { token } = useLocalSearchParams<{ token?: string }>();
    return <ResetPasswordScreen key={token} rawToken={token} parent />;
}
