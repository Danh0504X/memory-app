import { router } from 'expo-router';
import { BookOpen, Trophy } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { NavRow } from '@/components/ui/NavRow';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GameTile } from '@/features/shared-game/components/GameTile';
import { GAME_IDS } from '@/features/shared-game/registry';
import { useGameCatalogStore } from '@/features/shared-game/store/gameCatalogStore';

// Tab Luyện tập: lưới ô màu, mỗi trò một ô kèm cấp đã mở (GET /api/games)
export default function GamesScreen() {
    const userId = useAuthStore((state) => state.user?._id ?? null);
    const { games, status, error, load } = useGameCatalogStore();

    useEffect(() => {
        void load(userId);
    }, [load, userId]);

    return (
        <Screen>
            <AppText variant="title">Luyện tập</AppText>
            <AppText variant="body">Chọn một trò. Nhớ đủ tốt ở cấp này để mở cấp tiếp theo.</AppText>

            {status === 'loading' ? <ActivityIndicator color={colors.brand} /> : null}
            {status === 'error' ? (
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="small" style={{ color: colors.danger }}>{error}</AppText>
                    <Button title="Thử lại" variant="secondary" onPress={() => void load(userId, true)} />
                </View>
            ) : null}

            <View style={styles.grid}>
                {GAME_IDS.map((id) => {
                    const game = games?.find((item) => item.gameName === id);
                    return <GameTile key={id} game={id} level={game ? (game.player?.unlockedLevel ?? 1) : undefined} maxLevel={game?.maxLevel} />;
                })}
            </View>

            <NavRow
                icon={<Trophy color={colors.sunDeep} size={24} />}
                tint="#fff3cf"
                title="Thử thách hôm nay"
                subtitle="Một đề cho mọi người, một lượt mỗi ngày"
                onPress={() => router.navigate('/daily')}
            />
            <NavRow
                icon={<BookOpen color={colors.brand} size={24} />}
                tint={colors.mint}
                title="Ba cách để nhớ"
                subtitle="Học mẹo trước khi chơi, có trò thử"
                onPress={() => router.navigate('/methods')}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
