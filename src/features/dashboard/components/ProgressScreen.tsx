import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { ease, enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { Chips } from '@/features/shared-game/components/Chips';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { GAME_ICONS } from '@/features/shared-game/gameIcons';
import { GAME_IDS, GAME_META } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { useGameHistory } from '../hooks/useGameHistory';
import { useMonthSessions } from '../hooks/useMonthSessions';
import { useCatalog } from '../hooks/useOverview';
import type { DashboardSummary, GameFilter, GameId, GameSession, Period, PeriodBucket } from '../types';
import { intensity, monthGrid, monthOf, sameMonth, shiftMonth, summarizeDay, type CalendarDay, type MonthRef } from '../utils/calendar';
import { PROGRESS_TIME_ZONE, dayKey, describePeriod, formatPercent, formatTotalDuration, formatWhen } from '../utils/format';

const PERIODS: { value: Period; label: string }[] = [
    { value: 'week', label: 'Theo tuần' },
    { value: 'month', label: 'Theo tháng' },
];
const GAME_FILTERS: { value: GameFilter; label: string }[] = [{ value: 'all', label: 'Tất cả' }, ...GAME_IDS.map((id) => ({ value: id, label: GAME_META[id].label }))];
const GRADES = {
    perfect: { label: 'Hoàn hảo', color: colors.brandDeep, bg: colors.mint },
    pass: { label: 'Đạt', color: '#1864ab', bg: colors.sky },
    fail: { label: 'Chưa đạt', color: colors.danger, bg: colors.dangerTint },
} as const;
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HEAT = [colors.white, '#cdebd6', '#7fc68f', colors.brand];
const CHART_HEIGHT = 140;

// Trang Tiến độ: số liệu theo kỳ (backend tính), biểu đồ độ chính xác từng trò, lịch luyện tập và toàn bộ lịch sử
export function ProgressScreen() {
    const [period, setPeriod] = useState<Period>('week');
    const [historyGame, setHistoryGame] = useState<GameFilter>('all');
    const [historyKey, setHistoryKey] = useState(0);
    const timeline = useDashboardData(period, 'all');
    const catalog = useCatalog();
    const { reload: reloadTimeline } = timeline;
    const reloadAll = () => {
        timeline.refresh();
        catalog.refresh();
        setHistoryKey((key) => key + 1);
    };

    useEffect(
        () =>
            onGameSessionRecorded(() => {
                reloadTimeline();
                setHistoryKey((key) => key + 1);
            }),
        [reloadTimeline],
    );

    return (
        <ScrollView style={{ backgroundColor: colors.wall }} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={timeline.refreshing || catalog.refreshing} onRefresh={reloadAll} tintColor={colors.brand} />}>
            <Chips accessibilityLabel="Khoảng thời gian" options={PERIODS} value={period} onChange={setPeriod} />

            <BlockState request={timeline.state} onRetry={reloadTimeline}>
                {(data) => {
                    const { label, compareLabel } = describePeriod(period, data.buckets.length);
                    return (
                        <>
                            <Animated.View entering={enterUp(0)} style={{ gap: spacing.sm }}>
                                <AppText style={styles.section}>{label}</AppText>
                                <SummaryTiles summary={data.summary} previous={data.previousSummary} compareLabel={compareLabel} />
                            </Animated.View>
                            <Animated.View entering={enterUp(1)}>
                                <Panel title="Độ chính xác">
                                    <AccuracyChart
                                        buckets={data.buckets}
                                        passAccuracyOf={(game) =>
                                            catalog.state.status === 'ready' ? (catalog.state.data.find((item) => item.gameName === game)?.passAccuracy ?? 0.7) : 0.7
                                        }
                                    />
                                </Panel>
                            </Animated.View>
                        </>
                    );
                }}
            </BlockState>

            <Panel title="Lịch luyện tập">
                <PracticeCalendar />
            </Panel>

            <View style={{ gap: spacing.sm }}>
                <AppText style={styles.section}>Lịch sử ván chơi</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.bleedContent}>
                    <Chips accessibilityLabel="Lọc theo trò" options={GAME_FILTERS} value={historyGame} onChange={setHistoryGame} />
                </ScrollView>
                <History key={`${historyGame}-${historyKey}`} game={historyGame} />
            </View>
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
            <Tile tint="#e3f4e6" label="Ván đã chơi" value={String(summary.played)} note={playedDelta === 0 ? 'bằng kỳ trước' : `${playedDelta > 0 ? '+' : ''}${playedDelta} ${compareLabel}`} />
            <Tile tint={colors.sky} label="Chính xác" value={formatPercent(summary.accuracy)} note={accuracyDelta === null ? undefined : `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta} điểm % ${compareLabel}`} />
            <Tile tint="#fff3cf" label="Ván hoàn hảo" value={String(summary.perfectCount)} note={summary.bestLevel ? `cấp cao nhất ${summary.bestLevel}` : undefined} />
            <Tile tint="#fff0e6" label="Thời gian luyện" value={formatTotalDuration(summary.durationSec)} />
        </View>
    );
}

function Tile({ tint, label, value, note }: { tint: string; label: string; value: string; note?: string }) {
    return (
        <View style={[styles.tile, { backgroundColor: tint }]}>
            <AppText style={styles.tileValue}>{value}</AppText>
            <AppText style={styles.tileLabel}>{label}</AppText>
            {note ? <AppText style={styles.tileNote}>{note}</AppText> : null}
        </View>
    );
}

// Một trò, một chuỗi cột: kỳ hiện tại màu của trò, các kỳ trước màu nhạt.
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
        <View style={{ gap: spacing.md }}>
            <View style={styles.gameSwitch}>
                {GAME_IDS.map((id) => {
                    const Icon = GAME_ICONS[id];
                    const active = id === game;
                    return (
                        <Pressable
                            key={id}
                            onPress={() => setChosen(id)}
                            accessibilityRole="button"
                            accessibilityLabel={GAME_META[id].label}
                            accessibilityState={{ selected: active }}
                            style={[styles.gameDot, { backgroundColor: active ? GAME_META[id].color : GAME_META[id].tint }]}
                        >
                            <Icon color={active ? colors.white : GAME_META[id].color} size={20} strokeWidth={2.4} />
                        </Pressable>
                    );
                })}
            </View>
            <AppText style={styles.chartTitle}>{GAME_META[game].label}</AppText>
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
                                        <GrowBar key={game} index={index} height={Math.max(2, CHART_HEIGHT * accuracy - 16)} color={index === current ? GAME_META[game].color : GAME_META[game].tint} />
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
                                    style={styles.dayCell}
                                >
                                    <View style={[styles.day, { backgroundColor: HEAT[intensity(cell.sessions.length)] }, selected?.key === cell.key && styles.daySelected]}>
                                        <AppText style={[styles.dayText, intensity(cell.sessions.length) >= 2 && { color: colors.white }]}>{cell.day}</AppText>
                                    </View>
                                </Pressable>
                            ) : (
                                <View key={`empty-${index}`} style={styles.dayCell} />
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
        <AppText variant="small" style={{ color: colors.ink, fontFamily: fonts.semibold }}>
            {played === 0 ? `${date}: không chơi ván nào.` : `${date}: ${played} ván · chính xác ${formatPercent(accuracy)} · ${minutes} phút`}
        </AppText>
    );
}

// Toàn bộ lịch sử, mới nhất trước, 10 ván mỗi lần tải (GET /api/game-sessions có cursor)
function History({ game }: { game: GameFilter }) {
    const { sessions, nextCursor, status, error, loadMore } = useGameHistory(game);

    if (status === 'loading' && sessions.length === 0) return <ActivityIndicator color={colors.brand} />;
    if (sessions.length === 0 && status !== 'error') return <AppText variant="body">Chưa có ván nào. Chơi một ván để bắt đầu theo dõi tiến độ.</AppText>;

    return (
        <View style={{ gap: spacing.sm }}>
            {sessions.length > 0 ? (
                <View style={styles.group}>
                    {sessions.map((session, i) => (
                        <HistoryRow key={session.id} session={session} divider={i > 0} />
                    ))}
                </View>
            ) : null}
            {error ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{error}</AppText> : null}
            {nextCursor || error ? (
                <Button title={error ? 'Thử lại' : 'Xem thêm'} variant="secondary" loading={status === 'loading'} onPress={() => void loadMore()} />
            ) : null}
        </View>
    );
}

function HistoryRow({ session, divider }: { session: GameSession; divider: boolean }) {
    const meta = GAME_META[session.game];
    const Icon = GAME_ICONS[session.game];
    const grade = GRADES[session.grade];
    return (
        <View
            style={[styles.historyRow, divider && styles.divider]}
            accessibilityLabel={`${meta.label}, ${formatWhen(session.playedAt, PROGRESS_TIME_ZONE)}, đúng ${session.correctItems}/${session.totalItems}, ${grade.label}`}
        >
            <View style={[styles.historyIcon, { backgroundColor: meta.color }]}>
                <Icon color={colors.white} size={16} strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
                <AppText style={styles.historyTitle} numberOfLines={1}>
                    {meta.label}
                    <AppText variant="small">{session.daily ? ' · Thử thách' : session.level !== null ? ` · Cấp ${session.level}` : ' · Tự chọn'}</AppText>
                </AppText>
                <AppText variant="small">{formatWhen(session.playedAt, PROGRESS_TIME_ZONE)} · {session.correctItems}/{session.totalItems}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <AppText style={[styles.grade, { color: grade.color, backgroundColor: grade.bg }]}>{grade.label}</AppText>
                {session.expEarned > 0 ? <AppText style={styles.exp}>+{session.expEarned} EXP</AppText> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
    section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { width: '48%', flexGrow: 1, padding: spacing.md, borderRadius: radius * 1.25, gap: 2 },
    tileValue: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.ink, fontVariant: ['tabular-nums'] },
    tileLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
    tileNote: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.inkSoft },
    gameSwitch: { flexDirection: 'row', justifyContent: 'space-between' },
    gameDot: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    chartTitle: { fontFamily: fonts.bold, color: colors.ink },
    chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    passLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.danger },
    passLabel: { position: 'absolute', right: 0, top: -16, fontSize: 10, lineHeight: 14, color: colors.danger, fontFamily: fonts.semibold },
    column: { flex: 1, alignItems: 'center', gap: 4 },
    track: { width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
    bar: { width: '70%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
    barValue: { fontSize: 10, lineHeight: 14, fontFamily: fonts.semibold, color: colors.inkSoft },
    none: { color: colors.inkSoft },
    axis: { fontSize: 10, lineHeight: 14, color: colors.inkSoft, height: 16 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.wall },
    monthLabel: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
    weekRow: { flexDirection: 'row' },
    weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, color: colors.inkSoft, fontFamily: fonts.semibold },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
    day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 2, borderColor: colors.step },
    daySelected: { borderColor: colors.sunDeep },
    dayText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
    bleed: { marginHorizontal: -spacing.lg },
    bleedContent: { paddingHorizontal: spacing.lg },
    group: { borderRadius: radius * 1.25, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 4, borderBottomColor: colors.edge, overflow: 'hidden' },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12 },
    divider: { borderTopWidth: 1, borderTopColor: colors.step },
    historyIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    historyTitle: { fontFamily: fonts.bold, color: colors.ink },
    grade: { fontFamily: fonts.bold, fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
    exp: { fontFamily: fonts.bold, fontSize: 12, color: colors.sunDeep },
});
