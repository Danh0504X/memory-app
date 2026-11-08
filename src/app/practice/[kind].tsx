import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { PRACTICES, PracticeScreen } from '@/features/practice/PracticeScreen';

// /practice/story, /practice/numbers, /practice/loci (giống đường dẫn bản web)
export default function PracticeRoute() {
    const { kind } = useLocalSearchParams<{ kind: string }>();
    const practice = PRACTICES[kind];
    if (!practice) {
        return (
            <Screen edges={['bottom']}>
                <Stack.Screen options={{ title: 'Bài thực hành' }} />
                <AppText variant="body">Không tìm thấy bài thực hành này.</AppText>
            </Screen>
        );
    }
    return (
        <>
            <Stack.Screen options={{ title: 'Bài thực hành' }} />
            <PracticeScreen key={kind} practice={practice} />
        </>
    );
}
