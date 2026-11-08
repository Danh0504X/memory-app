import { router } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { GameCatalogItem } from '../api/games.api';
import { formatSeconds } from '../utils/formatTime';
import { Chips } from './Chips';
import { LevelGrid } from './LevelGrid';

const levelLabel = (level: number) => (level <= 3 ? 'Mức căn bản' : level <= 6 ? 'Mức trung cấp' : 'Mức nâng cao');
const FAN_MAX = 7;

interface RoundSetupProps {
    itemUnit: string;               // "thẻ bài", "hình ảnh"
    shortUnit: string;              // "lá", "hình": dùng trên ô cấp độ
    game: GameCatalogItem;          // luật chơi và cấp đã mở, lấy từ backend
    customItemCount: number | null; // null: chơi theo cấp; số: ván tự chọn
    selectedLevel: number | null;   // null: cấp cao nhất đã mở
    onSelectLevel: (level: number | null) => void;
    memorizeSec: number;
    onMemorizeSecChange: (seconds: number) => void;
    onStart: (gameLevel: number) => void;
    isStarting: boolean;
    error: string | null;
    renderBack: (width: number) => ReactNode; // mặt úp, xoè ra cho biết số lượng cần nhớ
    options?: ReactNode;            // tuỳ chọn riêng của từng trò, hiện khi bấm "Tùy chọn"
}

export function RoundSetup({
    itemUnit,
    shortUnit,
    game,
    customItemCount,
    selectedLevel,
    onSelectLevel,
    memorizeSec,
    onMemorizeSecChange,
    onStart,
    isStarting,
    error,
    renderBack,
    options,
}: RoundSetupProps) {
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
    const [showOptions, setShowOptions] = useState(false);

    const unlockedLevel = game.player?.unlockedLevel ?? 1;
    // Cấp đã chọn có thể không còn mở (đổi tài khoản, tiến độ khách hết hạn): quay về cấp cao nhất đã mở
    const level = selectedLevel !== null && selectedLevel <= unlockedLevel ? selectedLevel : unlockedLevel;
    const isCustom = customItemCount !== null;
    const isReplay = !isCustom && level < unlockedLevel;
    const itemCount = customItemCount ?? game.levels[level - 1]?.itemCount ?? 0;
    const passPercent = Math.round(game.passAccuracy * 100);
    const fanCount = Math.min(itemCount, FAN_MAX);

    let goal = `Nhớ đúng tất cả để mở khoá cấp ${level + 1}.`;
    if (isCustom) goal = 'Ván tự chọn số lượng: không mở khoá cấp mới và không tính kỷ lục.';
    else if (isReplay) goal = `Chơi lại để luyện tập. Chỉ ván ở cấp ${unlockedLevel} mới mở khoá cấp tiếp theo.`;
    else if (level >= game.maxLevel) goal = 'Đây là cấp cao nhất. Thử ghi nhớ nhanh hơn để phá kỷ lục!';

    return (
        <Screen edges={['bottom']}>
            <View style={styles.deal}>
                <AppText variant="small" style={styles.overline}>
                    {isCustom ? 'Ván tự chọn' : `Cấp ${level} · ${levelLabel(level)}`}
                </AppText>
                <View style={styles.fan} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {Array.from({ length: fanCount }, (_, i) => {
                        const offset = i - (fanCount - 1) / 2;
                        return (
                            <View key={i} style={[styles.fanCard, { transform: [{ translateX: offset * 22 }, { rotate: `${offset * 6}deg` }] }]}>
                                {renderBack(56)}
                            </View>
                        );
                    })}
                </View>
                <AppText style={styles.count}>
                    {itemCount} <AppText variant="lead">{itemUnit} cần nhớ</AppText>
                </AppText>
            </View>

            {isCustom ? (
                <AppText variant="small">
                    Bạn đang chơi ván tự chọn {itemCount} {itemUnit}. Đổi về chơi theo cấp trong Tùy chọn.
                </AppText>
            ) : (
                <View style={styles.section}>
                    <AppText variant="heading">Cấp độ</AppText>
                    <AppText variant="small">Đã mở {unlockedLevel}/{game.maxLevel} cấp. Chọn lại cấp đã mở để luyện tập.</AppText>
                    <LevelGrid
                        levels={game.levels.map(({ level: option, itemCount }) => ({ level: option, count: itemCount }))}
                        unlockedLevel={unlockedLevel}
                        selectedLevel={level}
                        shortUnit={shortUnit}
                        onSelect={(option) => onSelectLevel(option === unlockedLevel ? null : option)}
                    />
                </View>
            )}

            <View style={styles.section}>
                <AppText variant="heading">Thời gian ghi nhớ</AppText>
                <Chips
                    accessibilityLabel="Thời gian ghi nhớ"
                    options={game.memorizeSecOptions.map((seconds) => ({ value: seconds, label: formatSeconds(seconds) }))}
                    value={memorizeSec}
                    onChange={onMemorizeSecChange}
                />
                <AppText variant="small">
                    Nhớ lại trong {formatSeconds(game.recallSec)} · Đạt từ {passPercent}%
                    {game.player?.bestLevel ? ` · Hoàn hảo cao nhất: cấp ${game.player.bestLevel}` : ''}
                </AppText>
            </View>

            {options ? (
                <View style={styles.section}>
                    <Pressable
                        onPress={() => setShowOptions((shown) => !shown)}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showOptions }}
                        style={styles.optionsToggle}
                    >
                        <SlidersHorizontal color={colors.brandDeep} size={18} />
                        <AppText style={styles.optionsLabel}>Tùy chọn</AppText>
                    </Pressable>
                    {showOptions ? options : null}
                </View>
            ) : null}

            <AppText variant="body" style={styles.goal}>{goal}</AppText>

            {isGuest ? (
                <AppText variant="small">
                    Bạn đang chơi với tư cách khách: cấp đã mở chỉ giữ tạm trên máy này, không nhận EXP và không lưu lịch sử.{' '}
                    <AppText variant="small" style={styles.link} onPress={() => router.push('/login')}>Đăng nhập</AppText> để lưu tiến độ.
                </AppText>
            ) : null}

            {error ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{error}</AppText> : null}

            <Button title={isStarting ? 'Đang chia bài...' : 'Bắt đầu'} loading={isStarting} onPress={() => onStart(level)} />
        </Screen>
    );
}

// Hiện trong lúc chưa có luật chơi từ backend
export function RoundSetupStatus({ status, error, onRetry }: { status: string; error: string | null; onRetry: () => void }) {
    return (
        <Screen edges={['bottom']}>
            {status === 'error' ? (
                <>
                    <AppText style={{ color: colors.danger }}>{error ?? 'Không thể tải thông tin trò chơi.'}</AppText>
                    <Button title="Thử lại" variant="secondary" onPress={onRetry} />
                </>
            ) : (
                <View style={styles.loading}>
                    <ActivityIndicator color={colors.brand} />
                    <AppText variant="small">Đang tải thông tin trò chơi...</AppText>
                </View>
            )}
        </Screen>
    );
}

const styles = StyleSheet.create({
    deal: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, backgroundColor: colors.mint, borderRadius: radius * 1.5 },
    overline: { fontFamily: fonts.bold, color: colors.brandDeep },
    fan: { height: 100, width: '100%', alignItems: 'center', justifyContent: 'center' },
    fanCard: { position: 'absolute' },
    count: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 40 },
    section: { gap: spacing.sm },
    optionsToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
    optionsLabel: { fontFamily: fonts.bold, color: colors.brandDeep },
    goal: { fontFamily: fonts.semibold },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
    loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
