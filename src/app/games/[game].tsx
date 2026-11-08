import { Stack, useLocalSearchParams } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { GAME_META, type GameName } from '@/features/shared-game/registry';

const isGameName = (value: unknown): value is GameName => typeof value === 'string' && value in GAME_META;

// Màn tạm cho từng trò chơi: store và API của trò đã có sẵn trong features/<trò>-game,
// giao diện các phase (ghi nhớ, nhớ lại, kết quả) sẽ được làm lần lượt từng trò ở bước sau.
export default function GameScreen() {
    const { game } = useLocalSearchParams<{ game: string }>();
    const meta = isGameName(game) ? GAME_META[game] : null;

    return (
        <Screen edges={['bottom']}>
            <Stack.Screen options={{ title: meta?.label ?? 'Trò chơi' }} />
            <AppText variant="title">{meta?.label ?? 'Không tìm thấy trò chơi'}</AppText>
            <AppText variant="lead">Trò này đang được chuyển sang ứng dụng di động.</AppText>
        </Screen>
    );
}
