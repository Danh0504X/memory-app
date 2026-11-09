import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Check, Flame, Medal, Sparkles, Star, X } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import celebrating from '@/assets/memio/mascot-celebrating.svg';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LiveShape } from '@/components/ui/LiveShape';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import type { CompletedRound, RecordKey, RoundResult as RoundVerdict } from '../api/games.api';
import { GAME_META } from '../registry';
import { describeCompletedRound } from '../utils/completedRound';
import { formatSeconds } from '../utils/formatTime';
import { Confetti } from './Confetti';
import { GuestNote } from './SetupParts';

const VERDICTS: Record<RoundVerdict, string> = { perfect: 'Hoàn hảo!', pass: 'Đạt rồi!', fail: 'Chưa đạt' };
const RECORD_LABELS: Record<RecordKey, string> = { bestLevel: 'Cấp cao nhất mới', fastestMemorize: 'Nhớ nhanh nhất cấp này' };
const HAPTIC: Record<RoundVerdict, Haptics.NotificationFeedbackType> = {
    perfect: Haptics.NotificationFeedbackType.Success,
    pass: Haptics.NotificationFeedbackType.Success,
    fail: Haptics.NotificationFeedbackType.Warning,
};

interface RoundResultProps {
    round: CompletedRound;
    maxLevel: number;
    busy: boolean;
    onPlayAgain: () => void;
    onNextLevel: (level: number) => void;
    onReset: () => void;
    // Ván thử thách ngày: mặc định về tab Thử thách; game số có thử thách riêng nên quay về màn thiết lập
    dailyAction?: { label: string; onPress: () => void };
    note?: string;
    // Phần đối chiếu riêng của từng trò (ReviewGrid cho thẻ bài/hình ảnh, danh sách tên cho gương mặt)
    children?: ReactNode;
}

// Kết quả, phần thưởng và cấp đã mở đều do backend quyết định; ở đây chỉ trình bày
export function RoundResult({ round, maxLevel, busy, onPlayAgain, onNextLevel, onReset, dailyAction, note, children }: RoundResultProps) {
    const { result, rewards, rules } = round;
    const meta = GAME_META[round.gameName];
    const summary = describeCompletedRound(round, maxLevel);
    const isDaily = rules.mode === 'daily';
    const percentage = Math.round(result.accuracy * 100);
    const verdict = result.result;
    // Hoàn hảo: nền vàng; đạt: màu của trò; chưa đạt: đỏ nhạt
    const band =
        verdict === 'perfect' ? { bg: '#fde9a8', edge: colors.sunDeep, ink: colors.ink, ring: colors.sunDeep, track: 'rgba(255,255,255,0.7)' }
        : verdict === 'pass' ? { bg: meta.color, edge: meta.edge, ink: colors.white, ring: colors.white, track: 'rgba(255,255,255,0.3)' }
        : { bg: colors.dangerTint, edge: '#f5b5b5', ink: colors.ink, ring: colors.danger, track: 'rgba(255,255,255,0.8)' };

    // Rung báo kết quả một lần khi màn hiện
    useEffect(() => {
        void Haptics.notificationAsync(HAPTIC[verdict]).catch(() => undefined);
    }, [verdict]);

    const leave = (path: '/daily' | '/games') => {
        onReset();
        router.dismissTo(path);
    };
    const primary = () => {
        if (isDaily) {
            if (dailyAction) dailyAction.onPress();
            else leave('/daily');
        }
        else if (summary.nextLevel !== null) onNextLevel(summary.nextLevel);
        else onPlayAgain();
    };
    const primaryLabel = isDaily ? (dailyAction?.label ?? 'Xem bảng xếp hạng') : summary.nextLevel !== null ? `Chơi cấp ${summary.nextLevel}` : 'Chơi lại';

    return (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Animated.View entering={enterUp(0)} style={[styles.band, { backgroundColor: band.bg, borderBottomColor: band.edge }]}>
                {/* Khoảnh khắc của màn kết quả: pháo giấy khi đạt, linh vật ăn mừng khi đúng hết */}
                {verdict !== 'fail' ? <Confetti /> : null}
                {verdict === 'perfect' ? (
                    <LiveShape art={celebrating} motion="hop" size={88} label="Linh vật Memio ăn mừng" tappable />
                ) : null}
                <AppText style={[styles.verdict, { color: band.ink }]} accessibilityRole="header">{VERDICTS[verdict]}</AppText>
                <Animated.View entering={ZoomIn.delay(200).springify()}>
                    <ProgressRing value={result.accuracy} size={128} stroke={12} color={band.ring} track={band.track}>
                        <AppText style={[styles.percent, { color: band.ink }]}>{percentage}%</AppText>
                    </ProgressRing>
                </Animated.View>
                <AppText style={[styles.count, { color: band.ink }]}>
                    {summary.value}/{summary.total} {summary.unit}
                </AppText>
                <AppText style={[styles.message, { color: band.ink }]}>{summary.message}</AppText>
            </Animated.View>

            {rewards ? (
                <Animated.View entering={enterUp(1)} style={styles.rewards}>
                    <Reward tint="#fff3cf" icon={<Sparkles color={colors.sunDeep} size={18} />}>+{rewards.exp.total} EXP</Reward>
                    {rewards.streak.currentStreak > 0 ? (
                        <Reward tint="#fff0e6" icon={<Flame color="#e8590c" size={18} />}>Chuỗi {rewards.streak.currentStreak} ngày</Reward>
                    ) : null}
                    {rewards.newRecords.map((record) => (
                        <Reward key={record} tint={colors.mint} icon={<Medal color={colors.brand} size={18} />}>{RECORD_LABELS[record]}</Reward>
                    ))}
                    {rewards.userLevel.after > rewards.userLevel.before ? (
                        <Reward tint={colors.sky} icon={<Star color="#1c7ed6" size={18} />}>Lên cấp {rewards.userLevel.after}</Reward>
                    ) : null}
                </Animated.View>
            ) : (
                <GuestNote text="Chơi khách nên ván này không tính EXP, kỷ lục hay chuỗi ngày." />
            )}

            {note ? <AppText variant="small" style={{ textAlign: 'center' }}>{note}</AppText> : null}

            <Animated.View entering={enterUp(2)} style={styles.actions}>
                <Button title={primaryLabel} tone={{ color: meta.color, edge: meta.edge }} loading={busy} onPress={primary} />
                <View style={styles.row}>
                    {!isDaily && summary.canPlayNext ? (
                        <Button title="Chơi lại" variant="secondary" disabled={busy} onPress={onPlayAgain} style={{ flex: 1 }} />
                    ) : null}
                    <Button title="Trò khác" variant="secondary" disabled={busy} onPress={() => leave('/games')} style={{ flex: 1 }} />
                </View>
                <AppText variant="small" style={{ textAlign: 'center' }}>
                    Ghi nhớ {formatSeconds(result.memorizeSec)} · Nhớ lại {formatSeconds(result.recallSec)}
                </AppText>
            </Animated.View>

            {children}
        </ScrollView>
    );
}

interface ReviewGridProps<T> {
    // Đáp án của người chơi và đáp án đúng ở từng vị trí, do backend chấm
    items: { expected: T; answer: T | null; correct: boolean }[];
    unit: string;
    perRow: number;
    itemRatio: number;
    renderItem: (item: T, width: number) => ReactNode;
}

const REVIEW_GAP = 8;

// Đối chiếu từng vị trí cho trò xếp thứ tự: ô sai nền đỏ nhạt, hiện cả đáp án đúng bên dưới
export function ReviewGrid<T>({ items, unit, perRow, itemRatio, renderItem }: ReviewGridProps<T>) {
    const { width } = useWindowDimensions();
    const wrong = items.filter((item) => !item.correct).length;
    const cellWidth = Math.floor((width - spacing.md * 2 - REVIEW_GAP * (perRow - 1)) / perRow);
    const itemWidth = cellWidth - 8;

    return (
        <>
            <View style={styles.reviewHead}>
                <AppText style={styles.reviewTitle}>Đối chiếu từng vị trí</AppText>
                <AppText variant="small">
                    {wrong === 0 ? `Bạn xếp đúng mọi ${unit}.` : `${wrong} vị trí chưa đúng. Trên là bạn xếp, dưới là đáp án.`}
                </AppText>
            </View>
            <View style={styles.reviewGrid}>
                {items.map((item, index) => (
                    <View
                        key={index}
                        style={[styles.cell, { width: cellWidth }, !item.correct && styles.cellWrong]}
                        accessibilityLabel={`Vị trí ${index + 1}: ${item.correct ? 'đúng' : 'sai'}`}
                    >
                        <View style={styles.cellHead}>
                            <AppText style={styles.cellNo}>{index + 1}</AppText>
                            {item.correct ? <Check color={colors.brand} size={14} strokeWidth={3} /> : <X color={colors.danger} size={14} strokeWidth={3} />}
                        </View>
                        {item.answer !== null ? (
                            renderItem(item.answer, itemWidth)
                        ) : (
                            <View style={[styles.empty, { width: itemWidth, height: itemWidth * itemRatio }]} />
                        )}
                        {!item.correct ? renderItem(item.expected, itemWidth) : null}
                    </View>
                ))}
            </View>
        </>
    );
}

function Reward({ children, icon, tint }: { children: ReactNode; icon: ReactNode; tint: string }) {
    return (
        <View style={[styles.reward, { backgroundColor: tint }]}>
            {icon}
            <AppText style={styles.rewardLabel}>{children}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    band: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2, overflow: 'hidden' },
    verdict: { fontFamily: fonts.extrabold, fontSize: 34, lineHeight: 42 },
    percent: { fontFamily: fonts.extrabold, fontSize: 30, fontVariant: ['tabular-nums'] },
    count: { fontFamily: fonts.extrabold, fontSize: 18 },
    message: { fontFamily: fonts.medium, textAlign: 'center' },
    rewards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
    reward: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
    rewardLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
    actions: { gap: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm },
    reviewHead: { gap: 4, marginTop: spacing.sm },
    reviewTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
    reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: REVIEW_GAP },
    cell: { alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge },
    cellWrong: { backgroundColor: colors.dangerTint, borderColor: '#f5c2bd', borderBottomColor: '#eaa2a2' },
    cellHead: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    cellNo: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 14, color: colors.inkSoft },
    empty: { borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#c9d6cc' },
});
