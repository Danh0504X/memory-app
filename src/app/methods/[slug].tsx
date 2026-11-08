import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { GUIDES, GUIDE_SLUGS } from '@/features/methods/guide/content';
import { GuideScreen } from '@/features/methods/guide/GuideScreen';

// /methods/story-linking, /methods/number-shape, /methods/memory-palace (giống đường dẫn bản web)
export default function GuideRoute() {
    const { slug } = useLocalSearchParams<{ slug: string }>();
    const id = GUIDE_SLUGS[slug];
    if (!id) {
        return (
            <Screen edges={['bottom']}>
                <Stack.Screen options={{ title: 'Phương pháp' }} />
                <AppText variant="body">Không tìm thấy hướng dẫn này.</AppText>
            </Screen>
        );
    }
    const content = GUIDES[id];
    return (
        <>
            <Stack.Screen options={{ title: content.crumb }} />
            <GuideScreen key={id} content={content} />
        </>
    );
}
