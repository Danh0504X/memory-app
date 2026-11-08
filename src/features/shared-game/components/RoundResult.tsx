import { router } from 'expo-router';
import { Check, Flame, Medal, Star, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { CompletedRound, RecordKey, RoundResult as RoundVerdict } from '../api/games.api';
import { describeCompletedRound } from '../utils/completedRound';
import { formatSeconds } from '../utils/formatTime';

const VERDICTS: Record<RoundVerdict, string> = { perfect: 'Hoàn hảo!', pass: 'Đạt rồi!', fail: 'Chưa đạt' };
const VERDICT_COLORS: Record<RoundVerdict, string> = { perfect: colors.brand, pass: colors.brand, fail: colors.danger };
const RECORD_LABELS: Record<RecordKey, string> = { bestLevel: 'Cấp cao nhất mới', fastestMemorize: 'Ghi nhớ nhanh nhất ở cấp này' };

interface RoundResultProps {
    round: CompletedRound;
    maxLevel: number;
    busy: boolean;
    onPlayAgain: () => void;
    onNextLevel: (level: number) => void;
    onReset: () => void;
    // Ván thử thách ngày: mặc định về trang Hôm nay; game số có thử thách riêng nên quay về màn thiết lập
    dailyAction?: { label: string; onPress: () => void };
    note?: string;
    // Phần đối chiếu riêng của từng trò (ReviewGrid cho thẻ bài/hình ảnh, danh sách tên cho gương mặt)
    children?: ReactNode;
}

// Kết quả, phần thưởng và cấp đã mở đều do backend quyết định; ở đây chỉ trình bày
export function RoundResult({ round, maxLevel, busy, onPlayAgain, onNextLevel, onReset, dailyAction, note, children }: RoundResultProps) {
    const { result, rewards, rules } = round;
    const summary = describeCompletedRound(round, maxLevel);
    const isDaily = rules.mode === 'daily';
    const percentage = Math.round(result.accuracy * 1000) / 10;

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
            <Animated.View entering={enterUp(0)} style={styles.card}>
                <AppText variant="title" style={{ color: VERDICT_COLORS[result.result] }} accessibilityRole="header">
                    {VERDICTS[result.result]}
                </AppText>
                <AppText style={styles.count}>
                    {summary.value}
                    <AppText variant="lead"> / {summary.total} {summary.unit}</AppText>
                </AppText>
                <ProgressBar value={result.accuracy} color={VERDICT_COLORS[result.result]} />
                <AppText variant="body">
                    Đúng {result.correctItems}/{result.totalItems} · Chính xác {percentage}%. {summary.message}
                </AppText>
                {note ? <AppText variant="small">{note}</AppText> : null}

                {rewards ? (
                    <View style={styles.rewards}>
                        <Reward highlight>+{rewards.exp.total} EXP</Reward>
                        {rewards.newRecords.map((record) => (
                            <Reward key={record} icon={<Medal color={colors.brandDeep} size={16} />}>{RECORD_LABELS[record]}</Reward>
                        ))}
                        {rewards.userLevel.after > rewards.userLevel.before ? (
                            <Reward icon={<Star color={colors.brandDeep} size={16} />}>Lên cấp tài khoản {rewards.userLevel.after}</Reward>
                        ) : null}
                        {rewards.streak.currentStreak > 0 ? (
                            <Reward icon={<Flame color={colors.brandDeep} size={16} />}>Chuỗi {rewards.streak.currentStreak} ngày</Reward>
                        ) : null}
                    </View>
                ) : (
                    <AppText variant="small">
                        Bạn đang chơi với tư cách khách nên ván này không tính EXP, kỷ lục hay chuỗi ngày.{' '}
                        <AppText variant="small" style={styles.link} onPress={() => router.push('/login')}>Đăng nhập</AppText> để lưu tiến độ.
                    </AppText>
                )}

                <View style={styles.actions}>
                    <Button title={primaryLabel} loading={busy} onPress={primary} />
                    {!isDaily && summary.canPlayNext ? (
                        <Button title="Chơi lại cấp này" variant="secondary" disabled={busy} onPress={onPlayAgain} />
                    ) : null}
                    <Button title="Chọn trò khác" variant="secondary" disabled={busy} onPress={() => leave('/games')} />
                </View>
                <AppText variant="small">
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
                <AppText variant="heading">Đối chiếu từng vị trí</AppText>
                <AppText variant="small">
                    {wrong === 0 ? `Bạn xếp đúng mọi ${unit}.` : `${wrong} vị trí chưa đúng. Hàng trên là bạn xếp, hàng dưới là đáp án.`}
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
                            <AppText variant="small" style={styles.cellNo}>{index + 1}</AppText>
                            {item.correct ? <Check color={colors.brand} size={14} /> : <X color={colors.danger} size={14} />}
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

function Reward({ children, icon, highlight = false }: { children: ReactNode; icon?: ReactNode; highlight?: boolean }) {
    return (
        <View style={[styles.reward, highlight && styles.rewardHighlight]}>
            {icon}
            <AppText variant="small" style={styles.rewardLabel}>{children}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.md },
    card: { backgroundColor: colors.white, borderRadius: radius * 1.5, borderWidth: 1, borderColor: colors.step, padding: spacing.lg, gap: spacing.sm },
    count: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46 },
    rewards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    reward: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.wall, borderWidth: 1, borderColor: colors.step },
    rewardHighlight: { backgroundColor: colors.sun, borderColor: colors.sun },
    rewardLabel: { fontFamily: fonts.semibold, color: colors.ink },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
    actions: { gap: spacing.sm, marginTop: spacing.sm },
    reviewHead: { gap: 4, marginTop: spacing.sm },
    reviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: REVIEW_GAP },
    cell: { alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    cellWrong: { backgroundColor: '#fdecea', borderColor: '#f5c2bd' },
    cellHead: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    cellNo: { fontSize: 12, lineHeight: 14 },
    empty: { borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#c9d6cc' },
});
