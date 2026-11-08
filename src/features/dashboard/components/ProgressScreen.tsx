import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ease, enterUp } from '@/constants/motion';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { BlockState, Panel } from '@/components/ui/Panel';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { Chips } from '@/features/shared-game/components/Chips';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { GAME_IDS, GAME_META } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { useMonthSessions } from '../hooks/useMonthSessions';
import { useCatalog, useRecentSessions } from '../hooks/useOverview';
import type { DashboardSummary, GameId, GameSession, Period, PeriodBucket } from '../types';
import { intensity, monthGrid, monthOf, sameMonth, shiftMonth, summarizeDay, type CalendarDay, type MonthRef } from '../utils/calendar';
import { PROGRESS_TIME_ZONE, dayKey, describePeriod, formatPercent, formatTotalDuration, formatWhen } from '../utils/format';

const PERIODS: { value: Period; label: string }[] = [
    { value: 'week', label: 'Theo tuần' },
    { value: 'month', label: 'Theo tháng' },
];
const GRADE_LABELS = { perfect: 'Hoàn hảo', pass: 'Đạt', fail: 'Chưa đạt' } as const;
const GRADE_COLORS = { perfect: colors.brand, pass: colors.brandDeep, fail: colors.danger } as const;
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HEAT = [colors.white, '#cdebd6', '#7fc68f', colors.brand];
const CHART_HEIGHT = 140;
const HISTORY_LIMIT = 20;

// Trang Tiến độ: số liệu theo kỳ (backend tính), biểu đồ độ chính xác từng trò, lịch luyện tập và các ván gần đây
export function ProgressScreen() {
    const [period, setPeriod] = useState<Period>('week');
    const timeline = useDashboardData(period, 'all');
    const catalog = useCatalog();
    const recent = useRecentSessions();
    const { reload: reloadTimeline } = timeline;
    const { reload: reloadRecent } = recent;

    useEffect(
        () =>
            onGameSessionRecorded(() => {
                reloadTimeline();
                reloadRecent();
            }),
        [reloadTimeline, reloadRecent],
    );

    return (
        <ScrollView
            style={{ backgroundColor: colors.wall }}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl
                    refreshing={false}
                    onRefresh={() => {
                        reloadTimeline();
                        reloadRecent();
                        catalog.reload();
                    }}
                    tintColor={colors.brand}
                />
            }
        >
            <Chips accessibilityLabel="Khoảng thời gian" options={PERIODS} value={period} onChange={setPeriod} />

            <BlockState request={timeline.state} onRetry={reloadTimeline}>
                {(data) => {
                    const { label, compareLabel } = describePeriod(period, data.buckets.length);
                    return (
                        <>
                            <Animated.View entering={enterUp(0)}>
                                <Panel title={label}>
                                    <SummaryTiles summary={data.summary} previous={data.previousSummary} compareLabel={compareLabel} />
                                </Panel>
                            </Animated.View>
                            <Panel title="Độ chính xác theo kỳ">
                                <AccuracyChart
                                    buckets={data.buckets}
                                    passAccuracyOf={(game) =>
                                        catalog.state.status === 'ready' ? (catalog.state.data.find((item) => item.gameName === game)?.passAccuracy ?? 0.7) : 0.7
                                    }
                                />
                            </Panel>
                        </>
                    );
                }}
            </BlockState>

            <Panel title="Lịch luyện tập">
                <PracticeCalendar />
            </Panel>

            <Panel title="Các ván gần đây">
                <BlockState request={recent.state} onRetry={reloadRecent}>
                    {(sessions) => <History sessions={sessions.slice(0, HISTORY_LIMIT)} />}
                </BlockState>
            </Panel>
        </ScrollView>
    );
}

// Cột mọc lên từ đáy khi biểu đồ hiện hoặc đổi trò, cột sau trễ hơn cột trước một chút; chỉ đổi scaleY
function GrowBar({ index, height, color }: { index: number; height: number; color: string }) {
    const reduceMotion = useReducedMotion();
    const scale = useSharedValue(reduceMotion ? 1 : 0);
    useEffect(() => {
        if (!reduceMotion) scale.value = withDelay(index * 40, withTiming(1, { duration: 600, easing: ease.enter }));
    }, [index, reduceMotion, scale]);
    const grow = useAnimatedStyle(() => ({ transform: [{ scaleY: scale.value }] }));
    return <Animated.View style={[styles.bar, { height, backgroundColor: color, transformOrigin: 'bottom' }, grow]} />;
}

function SummaryTiles({ summary, previous, compareLabel }: { summary: DashboardSummary; previous: DashboardSummary; compareLabel: string }) {
    const playedDelta = summary.played - previous.played;
    const accuracyDelta = summary.accuracy !== null && previous.accuracy !== null ? Math.round((summary.accuracy - previous.accuracy) * 100) : null;
    return (
        <View style={styles.tiles}>
            <Tile label="Ván đã chơi" value={String(summary.played)} note={playedDelta === 0 ? `bằng kỳ trước` : `${playedDelta > 0 ? '+' : ''}${playedDelta} ${compareLabel}`} />
            <Tile label="Chính xác" value={formatPercent(summary.accuracy)} note={accuracyDelta === null ? undefined : `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta} điểm % ${compareLabel}`} />
            <Tile label="Cấp cao nhất" value={summary.bestLevel ? `Cấp ${summary.bestLevel}` : '–'} />
            <Tile label="Ván hoàn hảo" value={String(summary.perfectCount)} />
            <Tile label="Thời gian luyện" value={formatTotalDuration(summary.durationSec)} />
        </View>
    );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <View style={styles.tile}>
            <AppText variant="small">{label}</AppText>
            <AppText style={styles.tileValue}>{value}</AppText>
            {note ? <AppText variant="small" style={styles.tileNote}>{note}</AppText> : null}
        </View>
    );
}

// Một trò, một chuỗi cột: kỳ hiện tại màu thương hiệu, các kỳ trước màu nhạt.
// Kỳ không chơi để trống (–) thay vì cột 0%, vì 0% nghĩa là có chơi nhưng nhớ sai hết.
function AccuracyChart({ buckets, passAccuracyOf }: { buckets: PeriodBucket[]; passAccuracyOf: (game: GameId) => number }) {
    // Mặc định trò chơi nhiều nhất trong các kỳ đang xem
    const mostPlayed = GAME_IDS.reduce((best, game) =>
        buckets.reduce((sum, bucket) => sum + bucket.byGame[game].played, 0) > buckets.reduce((sum, bucket) => sum + bucket.byGame[best].played, 0) ? game : best,
    );
    const [chosen, setChosen] = useState<GameId | null>(null);
    const game = chosen ?? mostPlayed;
    const passAccuracy = passAccuracyOf(game);
    const current = buckets.length - 1;

    return (
        <View style={{ gap: spacing.sm }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Chips accessibilityLabel="Trò chơi" options={GAME_IDS.map((id) => ({ value: id, label: GAME_META[id].label }))} value={game} onChange={setChosen} />
            </ScrollView>
            <View style={[styles.chart, { height: CHART_HEIGHT + 40 }]}>
                <View style={[styles.passLine, { bottom: 40 + CHART_HEIGHT * passAccuracy }]}>
                    <AppText style={styles.passLabel}>Đạt {Math.round(passAccuracy * 100)}%</AppText>
                </View>
                {buckets.map((bucket, index) => {
                    const stats = bucket.byGame[game];
                    const accuracy = stats.played > 0 ? stats.accuracy : null;
                    return (
                        <View
                            key={bucket.key}
                            style={styles.column}
                            accessible
                            accessibilityLabel={`${bucket.fullLabel}: ${accuracy === null ? 'không chơi' : `${formatPercent(accuracy)}, ${stats.played} ván`}`}
                        >
                            <View style={[styles.track, { height: CHART_HEIGHT }]}>
                                {accuracy !== null ? (
                                    <>
                                        <AppText style={styles.barValue}>{formatPercent(accuracy)}</AppText>
                                        <GrowBar
                                            key={game}
                                            index={index}
                                            height={Math.max(2, CHART_HEIGHT * accuracy - 16)}
                                            color={index === current ? GAME_META[game].color : '#c9d6cc'}
                                        />
                                    </>
                                ) : (
                                    <AppText style={styles.none}>–</AppText>
                                )}
                            </View>
                            <AppText style={styles.axis} numberOfLines={1}>{bucket.label}</AppText>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

// Lịch tháng: ô đậm nhạt theo số ván trong ngày; chạm một ngày để xem tóm tắt
function PracticeCalendar() {
    const today = monthOf(dayKey(new Date(), PROGRESS_TIME_ZONE));
    const [month, setMonth] = useState<MonthRef>(today);
    const [selected, setSelected] = useState<CalendarDay | null>(null);
    const sessions = useMonthSessions(month);
    const isCurrent = sameMonth(month, today);

    const change = (by: number) => {
        setMonth((value) => shiftMonth(value, by));
        setSelected(null);
    };

    return (
        <View style={{ gap: spacing.sm }}>
            <View style={styles.monthNav}>
                <Pressable onPress={() => change(-1)} accessibilityRole="button" accessibilityLabel="Tháng trước" style={styles.navButton}>
                    <ChevronLeft color={colors.brandDeep} size={20} />
                </Pressable>
                <AppText style={styles.monthLabel}>Tháng {month.month}/{month.year}</AppText>
                <Pressable onPress={() => change(1)} disabled={isCurrent} accessibilityRole="button" accessibilityLabel="Tháng sau" style={[styles.navButton, isCurrent && { opacity: 0.3 }]}>
                    <ChevronRight color={colors.brandDeep} size={20} />
                </Pressable>
            </View>
            <View style={styles.weekRow}>
                {WEEKDAYS.map((day) => (
                    <AppText key={day} style={styles.weekday}>{day}</AppText>
                ))}
            </View>
            <BlockState request={sessions.state} onRetry={sessions.reload}>
                {(data) => (
                    <View style={styles.grid}>
                        {monthGrid(month, data, PROGRESS_TIME_ZONE).map((cell, index) =>
                            cell ? (
                                <Pressable
                                    key={cell.key}
                                    onPress={() => setSelected(cell)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Ngày ${cell.day}: ${cell.sessions.length} ván`}
                                    style={[styles.day, { backgroundColor: HEAT[intensity(cell.sessions.length)] }, selected?.key === cell.key && styles.daySelected]}
                                >
                                    <AppText style={[styles.dayText, intensity(cell.sessions.length) >= 2 && { color: colors.white }]}>{cell.day}</AppText>
                                </Pressable>
                            ) : (
                                <View key={`empty-${index}`} style={styles.dayEmpty} />
                            ),
                        )}
                    </View>
                )}
            </BlockState>
            {selected ? <DaySummary day={selected} /> : <AppText variant="small">Chạm một ngày để xem số ván và độ chính xác.</AppText>}
        </View>
    );
}

function DaySummary({ day }: { day: CalendarDay }) {
    const { played, accuracy, minutes } = summarizeDay(day.sessions);
    const date = `${day.key.slice(8, 10)}/${day.key.slice(5, 7)}`;
    return (
        <AppText variant="small" style={{ color: colors.ink }}>
            {played === 0 ? `${date}: không chơi ván nào.` : `${date}: ${played} ván · chính xác ${formatPercent(accuracy)} · ${minutes} phút`}
        </AppText>
    );
}

function History({ sessions }: { sessions: GameSession[] }) {
    if (sessions.length === 0) return <AppText variant="body">Chưa có ván nào. Chơi một ván để bắt đầu theo dõi tiến độ.</AppText>;
    return (
        <View>
            {sessions.map((session) => {
                const meta = GAME_META[session.game];
                return (
                    <View
                        key={session.id}
                        style={styles.historyRow}
                        accessibilityLabel={`${meta.label}, ${formatWhen(session.playedAt, PROGRESS_TIME_ZONE)}, đúng ${session.correctItems}/${session.totalItems}, ${GRADE_LABELS[session.grade]}`}
                    >
                        <View style={[styles.dot, { backgroundColor: meta.color }]} />
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.historyTitle}>
                                {meta.label}
                                {session.daily ? ' · Thử thách' : session.level !== null ? ` · Cấp ${session.level}` : ' · Tự chọn'}
                            </AppText>
                            <AppText variant="small">{formatWhen(session.playedAt, PROGRESS_TIME_ZONE)} · đúng {session.correctItems}/{session.totalItems}</AppText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <AppText variant="small" style={[styles.grade, { color: GRADE_COLORS[session.grade] }]}>{GRADE_LABELS[session.grade]}</AppText>
                            {session.expEarned > 0 ? <AppText variant="small">+{session.expEarned} EXP</AppText> : null}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.md },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { width: '48%', flexGrow: 1, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.wall, gap: 2 },
    tileValue: { fontFamily: fonts.extrabold, fontSize: 20 },
    tileNote: { fontSize: 12, lineHeight: 16 },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    passLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.danger },
    passLabel: { position: 'absolute', right: 0, top: -16, fontSize: 10, lineHeight: 14, color: colors.danger, fontFamily: fonts.semibold },
    column: { flex: 1, alignItems: 'center', gap: 4 },
    track: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
    bar: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
    barValue: { fontSize: 10, lineHeight: 14, fontFamily: fonts.semibold, color: colors.inkSoft },
    none: { color: colors.inkSoft },
    axis: { fontSize: 10, lineHeight: 14, color: colors.inkSoft, height: 16 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.wall },
    monthLabel: { fontFamily: fonts.bold, fontSize: 16 },
    weekRow: { flexDirection: 'row' },
    weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, color: colors.inkSoft, fontFamily: fonts.semibold },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    day: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.wall, borderRadius: 8 },
    daySelected: { borderColor: colors.sun },
    dayEmpty: { width: `${100 / 7}%`, aspectRatio: 1 },
    dayText: { fontFamily: fonts.semibold, fontSize: 13 },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.step },
    dot: { width: 10, height: 10, borderRadius: 5 },
    historyTitle: { fontFamily: fonts.semibold, color: colors.ink },
    grade: { fontFamily: fonts.bold },
});
