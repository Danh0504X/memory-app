import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GAME_IDS, GAME_META } from '@/features/shared-game/registry';
import { useGameCatalogStore } from '@/features/shared-game/store/gameCatalogStore';

// Danh sách trò chơi kèm cấp đã mở, lấy từ GET /api/games như bản web
export default function GamesScreen() {
    const userId = useAuthStore((state) => state.user?._id ?? null);
    const { games, status, error, load } = useGameCatalogStore();

    useEffect(() => {
        void load(userId);
    }, [load, userId]);

    return (
        <Screen>
            <AppText variant="title">Luyện tập</AppText>
            <AppText variant="lead">Chọn một trò để bắt đầu. Cấp mới mở khi bạn nhớ đủ tốt ở cấp trước.</AppText>

            {status === 'loading' ? <ActivityIndicator color={colors.brand} /> : null}
            {status === 'error' ? (
                <View style={styles.errorBox}>
                    <AppText variant="small" style={{ color: colors.danger }}>{error}</AppText>
                    <Button title="Thử lại" variant="secondary" onPress={() => void load(userId, true)} />
                </View>
            ) : null}

            {GAME_IDS.map((id) => {
                const meta = GAME_META[id];
                const game = games?.find((item) => item.gameName === id);
                return (
                    <PressableScale key={id} onPress={() => router.push(meta.route)} accessibilityRole="button" style={styles.row}>
                        <View style={[styles.swatch, { backgroundColor: meta.color }]} />
                        <View style={styles.rowText}>
                            <AppText variant="heading">{meta.label}</AppText>
                            <AppText variant="small">
                                {game ? `Cấp ${game.player?.unlockedLevel ?? 1}/${game.maxLevel}` : ' '}
                            </AppText>
                        </View>
                        <ChevronRight color={colors.inkSoft} />
                    </PressableScale>
                );
            })}

            {/* Không bọc trong <Link asChild>: Slot của expo-router báo lỗi khi style là mảng */}
            <PressableScale onPress={() => router.navigate('/methods')} accessibilityRole="button" style={[styles.row, styles.methods]}>
                <View style={styles.rowText}>
                    <AppText variant="heading">Phương pháp ghi nhớ</AppText>
                    <AppText variant="small">Nối thành câu chuyện, biến số thành hình, căn phòng trí nhớ. Có trò chơi thử.</AppText>
                </View>
                <ChevronRight color={colors.inkSoft} />
            </PressableScale>
        </Screen>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.white,
        borderRadius: radius,
        borderWidth: 1,
        borderColor: colors.step,
        padding: spacing.md,
    },
    methods: { backgroundColor: colors.mint, borderColor: colors.mint, marginTop: spacing.sm },
    swatch: { width: 12, alignSelf: 'stretch', borderRadius: 6 },
    rowText: { flex: 1, gap: 2 },
    errorBox: { gap: spacing.sm },
});
