import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AccuracyChart } from '../components/AccuracyChart';
import { BlockState } from '../components/BlockState';
import { GameHistoryTable } from '../components/GameHistoryTable';
import { LevelLadder } from '../components/LevelLadder';
import { PeriodStats } from '../components/PeriodStats';
import { MonthView } from '../components/PracticeCalendar';
import { SegmentedControl } from '../components/SegmentedControl';
import { GAME_IDS, GAME_META } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCatalog, useProfile, useRecentSessions } from '../hooks/useOverview';
import { monthOf, sameMonth, shiftMonth } from '../utils/calendar';
import { PROGRESS_TIME_ZONE, dayKey, describePeriod, formatPercent } from '../utils/format';
import type { DashboardSummary, GameId, Period } from '../types';
import '@/styles/app-screen.css';
import '../progress.css';

const PERIOD_OPTIONS = [
    { value: 'week', label: 'Theo tuần' },
    { value: 'month', label: 'Theo tháng' },
] as const;

const GAME_OPTIONS = GAME_IDS.map((id) => ({ value: id, label: GAME_META[id].label }));

// Câu phát hiện dưới tiêu đề: một điều đáng chú ý nhất của kỳ đang xem, luôn nói rõ so với kỳ nào
const describeFinding = (summary: DashboardSummary, previous: DashboardSummary, label: string, compareLabel: string) => {
    const before = compareLabel.replace('so với ', '');
    if (summary.played === 0) return `Chưa có ván nào trong ${label}. Chơi một ván để bắt đầu theo dõi tiến bộ.`;
    const base = `${label.charAt(0).toUpperCase() + label.slice(1)}: ${summary.played} ván, đúng ${formatPercent(summary.accuracy)}`;
    if (summary.accuracy === null || previous.accuracy === null || previous.played === 0) {
        return `${base}. Chưa có ván nào trong ${before} để so sánh.`;
    }
    const change = Math.round(summary.accuracy * 100) - Math.round(previous.accuracy * 100);
    if (change === 0) return `${base}, bằng ${before}.`;
    return `${base}, ${change > 0 ? 'cao' : 'thấp'} hơn ${before} ${Math.abs(change)} điểm.`;
};

// Tiến độ trả lời một câu: "Tôi có đang tiến bộ không?" Việc nên làm hôm nay nằm ở trang chủ,
// cấp tài khoản và huy hiệu ở trang Hồ sơ; trang này chỉ nhìn lại.
export const DashboardPage = () => {
    const [period, setPeriod] = useState<Period>('week');
    const [chartGame, setChartGame] = useState<GameId | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const historyRef = useRef<HTMLElement>(null);

    const todayKey = dayKey(new Date(), PROGRESS_TIME_ZONE);
    const currentMonth = monthOf(todayKey);
    const [month, setMonth] = useState(currentMonth);
    const [selected, setSelected] = useState(todayKey);

    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();
    const timeline = useDashboardData(period, 'all');

    const timeZone = timeline.state.status === 'ready' ? timeline.state.data.timeZone : PROGRESS_TIME_ZONE;
    const buckets = timeline.state.status === 'ready' ? timeline.state.data.buckets : [];
    const periodText = timeline.state.status === 'ready' ? describePeriod(period, buckets.length) : null;
    const finding =
        timeline.state.status === 'ready' && periodText
            ? describeFinding(timeline.state.data.summary, timeline.state.data.previousSummary, periodText.label, periodText.compareLabel)
            : 'Đang tải số liệu…';

    // Biểu đồ mặc định hiện trò được chơi nhiều hơn; chỉ vẽ khi có ít nhất 2 kỳ có ván, ít hơn thì không có gì để so
    const playedBy = (game: GameId) => buckets.reduce((sum, bucket) => sum + bucket.byGame[game].played, 0);
    const shownGame: GameId = chartGame ?? GAME_IDS.reduce((best, game) => playedBy(game) > playedBy(best) ? game : best, GAME_IDS[0]);
    const periodsPlayed = buckets.filter((bucket) => bucket.byGame[shownGame].played > 0).length;
    const passAccuracy =
        catalog.state.status === 'ready'
            ? (catalog.state.data.find((game) => game.gameName === shownGame)?.passAccuracy ?? 0.7)
            : 0.7;

    useEffect(() => {
        if (showHistory) historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [showHistory]);

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash progress page-col">
                <header className="dash__head">
                    <div>
                        <h1>Tiến độ</h1>
                        <p className="progress__finding">{finding}</p>
                    </div>
                    <SegmentedControl label="Khoảng thời gian" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
                </header>

                <div className="dash__grid">
                    <MonthView
                        key={`${month.year}-${month.month}`}
                        month={month}
                        isCurrentMonth={sameMonth(month, currentMonth)}
                        todayKey={todayKey}
                        selected={selected}
                        onSelect={setSelected}
                        onMonth={(by) => setMonth((current) => shiftMonth(current, by))}
                        profile={profile.state.status === 'ready' ? profile.state.data : null}
                        timeZone={timeZone}
                    />

                    <section className="panel span-12" aria-labelledby="stats-title">
                        <div className="panel__head">
                            <h2 id="stats-title">{periodText?.label ?? 'Số liệu luyện tập'}</h2>
                            {timeline.state.status === 'ready' && timeline.state.data.summary.played > 0 && (
                                <button
                                    type="button"
                                    className="dash-link"
                                    aria-expanded={showHistory}
                                    aria-controls="history"
                                    onClick={() => setShowHistory((open) => !open)}
                                >
                                    {showHistory ? 'Ẩn lịch sử' : `Xem toàn bộ ${timeline.state.data.summary.played} ván`}
                                </button>
                            )}
                        </div>
                        <BlockState request={timeline.state} onRetry={timeline.reload}>
                            {(data) => (
                                <PeriodStats
                                    summary={data.summary}
                                    previousSummary={data.previousSummary}
                                    compareLabel={describePeriod(period, data.buckets.length).compareLabel}
                                />
                            )}
                        </BlockState>
                    </section>

                    {showHistory && timeline.state.status === 'ready' && (
                        <section id="history" ref={historyRef} className="panel span-12" aria-labelledby="history-title">
                            <div className="panel__head">
                                <h2 id="history-title">Toàn bộ lịch sử · {periodText?.label}</h2>
                            </div>
                            <GameHistoryTable
                                key={`${period}-${timeline.state.data.range.start.toISOString()}`}
                                range={timeline.state.data.range}
                                game="all"
                                total={timeline.state.data.summary.played}
                            />
                        </section>
                    )}

                    <section className="panel span-8 panel--chart" aria-labelledby="chart-title">
                        <div className="panel__head">
                            <h2 id="chart-title">Độ chính xác</h2>
                            <SegmentedControl label="Trò chơi" options={GAME_OPTIONS} value={shownGame} onChange={setChartGame} />
                        </div>
                        <BlockState request={timeline.state} onRetry={timeline.reload}>
                            {(data) =>
                                periodsPlayed >= 2 ? (
                                    <div className="panel__card">
                                        <AccuracyChart buckets={data.buckets} game={shownGame} passAccuracy={passAccuracy} />
                                    </div>
                                ) : (
                                    <div className="progress__nochart">
                                        <p>
                                            Cần chơi {GAME_META[shownGame].label} trong ít nhất 2 {period === 'week' ? 'tuần' : 'tháng'} để
                                            thấy đường tiến bộ.
                                        </p>
                                        <p className="dash-muted">
                                            Hiện có {periodsPlayed} {period === 'week' ? 'tuần' : 'tháng'} có ván trong {periodText?.label}.
                                        </p>
                                    </div>
                                )
                            }
                        </BlockState>
                    </section>

                    <section className="panel span-4" aria-labelledby="ladder-title">
                        <div className="panel__head">
                            <h2 id="ladder-title">Đường lên cấp</h2>
                        </div>
                        <BlockState request={catalog.state} onRetry={catalog.reload}>
                            {(games) => (
                                <LevelLadder games={games} sessions={recent.state.status === 'ready' ? recent.state.data : []} />
                            )}
                        </BlockState>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
