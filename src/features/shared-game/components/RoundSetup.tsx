import { router } from 'expo-router';
import { BookOpen, Info, SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ease } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { GameCatalogItem } from '../api/games.api';
import { formatSeconds } from '../utils/formatTime';
import { Chips } from './Chips';
import { GuideSheet } from './GuideSheet';
import { LevelTableSheet } from './LevelTableSheet';
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
    gameTitle: string;              // tên trò trên bảng cấp độ
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
    gameTitle,
    typing = false,
}: RoundSetupProps) {
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
    const [showOptions, setShowOptions] = useState(false);
    const [sheet, setSheet] = useState<'guide' | 'levels' | null>(null);

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
                            <Animated.View key={`${itemCount}-${i}`} style={styles.fanCard} entering={FadeInDown.duration(420).delay(i * 50).easing(ease.enter)}>
                                <View style={{ transform: [{ translateX: offset * 22 }, { rotate: `${offset * 6}deg` }] }}>{renderBack(56)}</View>
                            </Animated.View>
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

            {/* Công cụ như bản web: cách chơi và bảng cấp độ mở bảng trượt; tuỳ chọn mở ngay bên dưới */}
            <View style={styles.tools}>
                <ToolButton icon={<BookOpen color={colors.brandDeep} size={18} />} label="Cách chơi" onPress={() => setSheet('guide')} />
                <ToolButton icon={<Info color={colors.brandDeep} size={18} />} label="Bảng cấp độ" onPress={() => setSheet('levels')} />
                {options ? (
                    <ToolButton
                        icon={<SlidersHorizontal color={colors.brandDeep} size={18} />}
                        label="Tùy chọn"
                        open={showOptions}
                        onPress={() => setShowOptions((shown) => !shown)}
                    />
                ) : null}
            </View>
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
                gameTitle={gameTitle}
                itemUnit={shortUnit}
                levels={game.levels}
                unlockedLevel={unlockedLevel}
                unlockOn={game.unlockOn}
            />

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

function ToolButton({ icon, label, open, onPress }: { icon: ReactNode; label: string; open?: boolean; onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={open === undefined ? undefined : { expanded: open }}
            style={[styles.tool, open && styles.toolOpen]}
        >
            {icon}
            <AppText style={styles.toolLabel}>{label}</AppText>
        </PressableScale>
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
    tools: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tool: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white },
    toolOpen: { borderColor: colors.brand, backgroundColor: colors.mint },
    toolLabel: { fontFamily: fonts.bold, color: colors.brandDeep },
    goal: { fontFamily: fonts.semibold },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
    loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
