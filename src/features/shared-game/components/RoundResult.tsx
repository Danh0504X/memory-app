import { router } from 'expo-router';
import { Check, Flame, Medal, Star, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { CompletedRound, RecordKey, RoundResult as RoundVerdict } from '../api/games.api';
import { describeCompletedRound } from '../utils/completedRound';
import { formatSeconds } from '../utils/formatTime';

const VERDICTS: Record<RoundVerdict, string> = { perfect: 'Hoàn hảo!', pass: 'Đạt rồi!', fail: 'Chưa đạt' };
const VERDICT_COLORS: Record<RoundVerdict, string> = { perfect: colors.brand, pass: colors.brand, fail: colors.danger };
const RECORD_LABELS: Record<RecordKey, string> = { bestLevel: 'Cấp cao nhất mới', fastestMemorize: 'Ghi nhớ nhanh nhất ở cấp này' };

interface RoundResultProps<T> {
    round: CompletedRound;
    maxLevel: number;
    busy: boolean;
    onPlayAgain: () => void;
    onNextLevel: (level: number) => void;
    onReset: () => void;
    // Đối chiếu từng vị trí (đáp án của người chơi và đáp án đúng), do backend chấm
    review: { expected: T; answer: T | null; correct: boolean }[];
    unit: string;
    reviewPerRow: number;
    itemRatio: number;
    renderItem: (item: T, width: number) => ReactNode;
}

const REVIEW_GAP = 8;

export function RoundResult<T>({
    round,
    maxLevel,
    busy,
    onPlayAgain,
    onNextLevel,
    onReset,
    review,
    unit,
    reviewPerRow,
    itemRatio,
    renderItem,
}: RoundResultProps<T>) {
    const { width } = useWindowDimensions();
    const { result, rewards, rules } = round;
    const summary = describeCompletedRound(round, maxLevel);
    const isDaily = rules.mode === 'daily';
    const percentage = Math.round(result.accuracy * 1000) / 10;
    const wrong = review.filter((item) => !item.correct).length;
    const cellWidth = Math.floor((width - spacing.md * 2 - REVIEW_GAP * (reviewPerRow - 1)) / reviewPerRow);
    const itemWidth = cellWidth - 8;

    const leave = (path: '/' | '/games') => {
        onReset();
        router.dismissTo(path);
    };
    const primary = () => {
        if (isDaily) leave('/');
        else if (summary.nextLevel !== null) onNextLevel(summary.nextLevel);
        else onPlayAgain();
    };
    const primaryLabel = isDaily ? 'Về trang Hôm nay' : summary.nextLevel !== null ? `Chơi cấp ${summary.nextLevel}` : 'Chơi lại';

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
                <AppText variant="title" style={{ color: VERDICT_COLORS[result.result] }} accessibilityRole="header">
                    {VERDICTS[result.result]}
                </AppText>
                <AppText style={styles.count}>
                    {summary.value}
                    <AppText variant="lead"> / {summary.total} {summary.unit}</AppText>
                </AppText>
                <View style={styles.meter}>
                    <View style={[styles.meterFill, { width: `${percentage}%`, backgroundColor: VERDICT_COLORS[result.result] }]} />
                </View>
                <AppText variant="body">
                    Đúng {result.correctItems}/{result.totalItems} · Chính xác {percentage}%. {summary.message}
                </AppText>

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
            </View>

            <View style={styles.reviewHead}>
                <AppText variant="heading">Đối chiếu từng vị trí</AppText>
                <AppText variant="small">
                    {wrong === 0 ? `Bạn xếp đúng mọi ${unit}.` : `${wrong} vị trí chưa đúng. Hàng trên là bạn xếp, hàng dưới là đáp án.`}
                </AppText>
            </View>
            <View style={styles.reviewGrid}>
                {review.map((item, index) => (
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
        </ScrollView>
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
    meter: { height: 8, borderRadius: 4, backgroundColor: colors.step, overflow: 'hidden' },
    meterFill: { height: '100%' },
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
