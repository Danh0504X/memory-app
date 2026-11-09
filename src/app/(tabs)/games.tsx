import { router } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { NavRow } from '@/components/ui/NavRow';
import { BlockState } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DailyHero } from '@/features/daily/components/DailyScreen';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { GameTile } from '@/features/shared-game/components/GameTile';
import { GAME_IDS } from '@/features/shared-game/registry';
import { useGameCatalogStore } from '@/features/shared-game/store/gameCatalogStore';

// Tab Luyện tập: thử thách hôm nay nổi bật ở đầu (tham gia ngay tại đây), rồi lưới các trò
export default function GamesScreen() {
    const userId = useAuthStore((state) => state.user?._id ?? null);
    const { games, status, error, load } = useGameCatalogStore();
    const daily = useDailyChallenge();
    const { reload: reloadDaily } = daily;

    useEffect(() => {
        void load(userId);
    }, [load, userId]);
    // Chơi xong ván thử thách (hay ván thường) thì hạng và số người chơi đổi
    useEffect(() => onGameSessionRecorded(reloadDaily), [reloadDaily]);

    return (
        <Screen>
            <View style={{ gap: 2 }}>
                <AppText variant="title">Luyện tập</AppText>
                <AppText variant="body">Thử thách mỗi ngày, hoặc chọn một trò để lên cấp.</AppText>
            </View>

            <BlockState request={daily.state} onRetry={reloadDaily}>
                {(view) => <DailyHero view={view} onChanged={reloadDaily} onLeaderboard={() => router.push('/daily')} />}
            </BlockState>

            <AppText style={styles.section}>Chọn một trò</AppText>
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
    section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink, marginTop: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
