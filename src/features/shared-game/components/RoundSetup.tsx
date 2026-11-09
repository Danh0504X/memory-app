import { BookOpen, Info, SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ease } from '@/constants/motion';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { GameCatalogItem } from '../api/games.api';
import { GAME_META } from '../registry';
import { formatSeconds } from '../utils/formatTime';
import { Chips } from './Chips';
import { GuideSheet } from './GuideSheet';
import { LevelGrid } from './LevelGrid';
import { LevelTableSheet } from './LevelTableSheet';
import { DealBand, GuestNote, SectionTitle, ToolButton, ToolRow, levelLabel, setupStyles, toneOf } from './SetupParts';

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
    typing?: boolean;               // Ghi nhớ từ: nhớ lại bằng cách gõ (đổi nội dung "Cách chơi")
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
    typing = false,
}: RoundSetupProps) {
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
    const [showOptions, setShowOptions] = useState(false);
    const [sheet, setSheet] = useState<'guide' | 'levels' | null>(null);
    const tone = toneOf(game.gameName);

    const unlockedLevel = game.player?.unlockedLevel ?? 1;
    // Cấp đã chọn có thể không còn mở (đổi tài khoản, tiến độ khách hết hạn): quay về cấp cao nhất đã mở
    const level = selectedLevel !== null && selectedLevel <= unlockedLevel ? selectedLevel : unlockedLevel;
    const isCustom = customItemCount !== null;
    const isReplay = !isCustom && level < unlockedLevel;
    const itemCount = customItemCount ?? game.levels[level - 1]?.itemCount ?? 0;
    const passPercent = Math.round(game.passAccuracy * 100);
    const fanCount = Math.min(itemCount, FAN_MAX);

    let goal = `Nhớ đúng tất cả để mở cấp ${level + 1}.`;
    if (isCustom) goal = 'Ván tự chọn: không mở cấp mới, không tính kỷ lục.';
    else if (isReplay) goal = `Chơi lại để luyện. Chỉ ván cấp ${unlockedLevel} mới mở cấp tiếp theo.`;
    else if (level >= game.maxLevel) goal = 'Cấp cao nhất rồi. Thử nhớ nhanh hơn để phá kỷ lục!';

    return (
        <Screen
            edges={['bottom']}
            footer={
                <>
                    {error ? <AppText variant="small" style={setupStyles.error} accessibilityRole="alert">{error}</AppText> : null}
                    <Button title={isStarting ? 'Đang chia bài...' : 'Bắt đầu'} tone={tone} loading={isStarting} onPress={() => onStart(level)} />
                </>
            }
        >
            <DealBand
                game={game.gameName}
                overline={isCustom ? 'Ván tự chọn' : `Cấp ${level} · ${levelLabel(level)}`}
                count={itemCount}
                unit={`${itemUnit} cần nhớ`}
                line={`Nhớ lại trong ${formatSeconds(game.recallSec)} · Đạt từ ${passPercent}%`}
            >
                <View style={styles.fan} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    {Array.from({ length: fanCount }, (_, i) => {
                        const offset = i - (fanCount - 1) / 2;
                        return (
                            <Animated.View key={`${itemCount}-${i}`} style={styles.fanCard} entering={FadeInDown.duration(420).delay(i * 50).easing(ease.enter)}>
                                <View style={{ transform: [{ translateX: offset * 22 }, { rotate: `${offset * 6}deg` }] }}>{renderBack(56)}</View>
                            </Animated.View>
                        );
                    })}
                </View>
            </DealBand>

            <AppText style={setupStyles.goal}>{goal}</AppText>

            {isCustom ? (
                <AppText variant="small">Đang chơi ván tự chọn {itemCount} {itemUnit}. Tắt trong Tùy chọn để chơi theo cấp.</AppText>
            ) : (
                <View style={styles.section}>
                    <SectionTitle title="Cấp độ" note={`Đã mở ${unlockedLevel}/${game.maxLevel}${game.player?.bestLevel ? ` · Hoàn hảo cao nhất: cấp ${game.player.bestLevel}` : ''}`} />
                    <LevelGrid
                        levels={game.levels.map(({ level: option, itemCount }) => ({ level: option, count: itemCount }))}
                        unlockedLevel={unlockedLevel}
                        selectedLevel={level}
                        shortUnit={shortUnit}
                        tone={tone}
                        onSelect={(option) => onSelectLevel(option === unlockedLevel ? null : option)}
                    />
                </View>
            )}

            <View style={styles.section}>
                <SectionTitle title="Thời gian ghi nhớ" />
                <Chips
                    accessibilityLabel="Thời gian ghi nhớ"
                    options={game.memorizeSecOptions.map((seconds) => ({ value: seconds, label: formatSeconds(seconds) }))}
                    value={memorizeSec}
                    onChange={onMemorizeSecChange}
                    tone={tone.color}
                />
            </View>

            <ToolRow>
                <ToolButton icon={<BookOpen color={colors.brandDeep} size={20} />} label="Cách chơi" onPress={() => setSheet('guide')} />
                <ToolButton icon={<Info color={colors.brandDeep} size={20} />} label="Bảng cấp độ" onPress={() => setSheet('levels')} />
                {options ? (
                    <ToolButton
                        icon={<SlidersHorizontal color={colors.brandDeep} size={20} />}
                        label="Tùy chọn"
                        open={showOptions}
                        onPress={() => setShowOptions((shown) => !shown)}
                    />
                ) : null}
            </ToolRow>
            {options && showOptions ? options : null}
            <GuideSheet
                visible={sheet === 'guide'}
                onClose={() => setSheet(null)}
                itemUnit={shortUnit}
                recallSec={game.recallSec}
                passPercent={passPercent}
                typing={typing}
            />
            <LevelTableSheet
                visible={sheet === 'levels'}
                onClose={() => setSheet(null)}
                gameTitle={GAME_META[game.gameName].label}
                itemUnit={shortUnit}
                levels={game.levels}
                unlockedLevel={unlockedLevel}
                unlockOn={game.unlockOn}
            />

            {isGuest ? <GuestNote /> : null}
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
    fan: { height: 96, width: '100%', alignItems: 'center', justifyContent: 'center' },
    fanCard: { position: 'absolute' },
    section: { gap: spacing.sm },
    loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
