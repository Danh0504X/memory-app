import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { GAME_IDS, GAME_META } from '@/features/shared-game/registry';

// Màn tạm cho các trò chưa làm giao diện mobile (trò đã làm có route riêng, vd. games/cards.tsx).
// Store và API của trò đã có sẵn trong features/<trò>-game.
export default function GameScreen() {
    const { game } = useLocalSearchParams<{ game: string }>();
    // Đường dẫn giống bản web (GAME_META.route), vd. /games/images
    const id = GAME_IDS.find((gameId) => GAME_META[gameId].route === `/games/${game}`);
    const meta = id ? GAME_META[id] : null;

    return (
        <Screen edges={['bottom']}>
            <Stack.Screen options={{ title: meta?.label ?? 'Trò chơi' }} />
            <AppText variant="title">{meta?.label ?? 'Không tìm thấy trò chơi'}</AppText>
            <AppText variant="lead">Trò này đang được chuyển sang ứng dụng di động.</AppText>
        </Screen>
    );
}
