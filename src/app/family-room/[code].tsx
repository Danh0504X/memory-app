import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { FamilyRoomScreen } from '@/features/parent/components/FamilyRoomScreen';
export default function FamilyRoom() {
    const { code = '' } = useLocalSearchParams<{ code?: string }>();
    const account = useAuthStore((s) => s.user?._id);
    return <FamilyRoomScreen key={`${account}:${code}`} code={code.toUpperCase()} />;
}
