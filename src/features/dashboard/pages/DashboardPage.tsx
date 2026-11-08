import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import type { UserProfile } from '@/features/profile/api/profile.api';
import { AccuracyChart } from '../components/AccuracyChart';
import { BlockState } from '../components/BlockState';
import { GameHistoryTable } from '../components/GameHistoryTable';
import { LevelLadder } from '../components/LevelLadder';
import { PeriodStats } from '../components/PeriodStats';
import { RecentGames } from '../components/RecentGames';
import { SegmentedControl } from '../components/SegmentedControl';
import { AccountLevel, StreakPanel } from '../components/StreakPanel';
import { GAME_IDS, GAME_META } from '../constants';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCatalog, useProfile, useRecentSessions } from '../hooks/useOverview';
import { PROGRESS_TIME_ZONE, dayKey, describePeriod } from '../utils/format';
import type { GameId, GameSession, Period } from '../types';
import '@/styles/app-screen.css';

const PERIOD_OPTIONS = [
    { value: 'week', label: 'Theo tuần' },
    { value: 'month', label: 'Theo tháng' },
] as const;

const GAME_OPTIONS = GAME_IDS.map((id) => ({ value: id, label: GAME_META[id].label }));

// Lời chào nói luôn một sự thật của hôm nay, lấy từ dữ liệu (chuỗi ngày và số ván hôm nay)
const greeting = (profile: UserProfile, sessions: GameSession[] | null, timeZone: string) => {
    const name = profile.username;
    const today = dayKey(new Date(), timeZone);
    const playedToday = sessions?.filter((session) => dayKey(session.playedAt, timeZone) === today).length ?? 0;

    if (profile.playedToday) {
        return {
            title: playedToday
                ? `Chào ${name}, hôm nay bạn đã chơi ${playedToday} ván.`
                : `Chào ${name}, hôm nay bạn đã luyện tập rồi.`,
            finding: `Chuỗi ${profile.streaks} ngày đang được giữ. Chơi thêm để lên cấp nhanh hơn.`,
        };
    }
    if (sessions && sessions.length === 0) {
        return {
            title: `Chào ${name}, cùng chơi ván đầu tiên nhé.`,
            finding: 'Mỗi ván chỉ vài phút. Chơi mỗi ngày để bắt đầu chuỗi ngày luyện tập.',
        };
    }
    return {
        title: `Chào ${name}, hôm nay bạn chưa chơi ván nào.`,
        finding: profile.streakExpired
            ? 'Chuỗi ngày vừa bị gián đoạn. Chơi 1 ván hôm nay để bắt đầu chuỗi mới.'
            : profile.streaks > 0
              ? `Chơi 1 ván hôm nay để giữ chuỗi ${profile.streaks} ngày.`
              : 'Chơi 1 ván hôm nay để bắt đầu chuỗi ngày luyện tập.',
    };
};

export const DashboardPage = () => {
    const [period, setPeriod] = useState<Period>('week');
    const [chartGame, setChartGame] = useState<GameId | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const historyRef = useRef<HTMLElement>(null);

    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();
    const timeline = useDashboardData(period, 'all');

    const timeZone = timeline.state.status === 'ready' ? timeline.state.data.timeZone : PROGRESS_TIME_ZONE;
    const sessions = recent.state.status === 'ready' ? recent.state.data : null;
    const hello = profile.state.status === 'ready' ? greeting(profile.state.data, sessions, timeZone) : null;

    // Nút chính: chơi tiếp trò vừa chơi gần nhất, chưa chơi thì bắt đầu bằng trò hình (dễ nhất)
    const nextGame: GameId = sessions?.[0]?.game ?? 'image';
    const hasPlayed = sessions ? sessions.length > 0 : true;

    // Biểu đồ mặc định hiện trò được chơi nhiều hơn trong khoảng đang xem
    const buckets = timeline.state.status === 'ready' ? timeline.state.data.buckets : [];
    const playedBy = (game: GameId) => buckets.reduce((sum, bucket) => sum + bucket.byGame[game].played, 0);
    const shownGame: GameId = chartGame ?? (playedBy('card') > playedBy('image') ? 'card' : 'image');
    const passAccuracy =
        catalog.state.status === 'ready'
            ? (catalog.state.data.find((game) => game.gameName === shownGame)?.passAccuracy ?? 0.7)
            : 0.7;

    const periodText = timeline.state.status === 'ready' ? describePeriod(period, buckets.length) : null;

    useEffect(() => {
        if (showHistory) historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [showHistory]);

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash page-col">
                <header className="dash__head">
                    <div>
                        <h1>{hello?.title ?? 'Tiến độ của bạn'}</h1>
                        {hello && <p>{hello.finding}</p>}
                    </div>
                    <Link to={GAME_META[nextGame].route} viewTransition className="btn btn--brand">
                        {hasPlayed ? `Chơi tiếp: ${GAME_META[nextGame].label}` : 'Chơi ván đầu tiên'}
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </header>

                <div className="dash__grid">
                    <section className="panel span-9 panel--ladder" aria-labelledby="ladder-title">
                        <div className="panel__head">
                            <h2 id="ladder-title">Đường lên cấp</h2>
                        </div>
                        <BlockState request={catalog.state} onRetry={catalog.reload}>
                            {(games) => <LevelLadder games={games} sessions={sessions ?? []} />}
                        </BlockState>
                    </section>

                    {/* Chuỗi ngày và cấp tài khoản chung một khối, ngăn bằng đường mảnh, để cao bằng thang cấp độ */}
                    <div className="panel span-3 dash__aside">
                        <section aria-labelledby="streak-title">
                            <div className="panel__head">
                                <h2 id="streak-title">Chuỗi ngày</h2>
                            </div>
                            <BlockState request={profile.state} onRetry={profile.reload}>
                                {(data) => <StreakPanel profile={data} sessions={sessions} timeZone={timeZone} />}
                            </BlockState>
                        </section>
                        <section aria-labelledby="account-title">
                            <div className="panel__head">
                                <h2 id="account-title">Cấp tài khoản</h2>
                            </div>
                            <BlockState request={profile.state} onRetry={profile.reload}>
                                {(data) => <AccountLevel profile={data} />}
                            </BlockState>
                        </section>
                    </div>

                    <section className="panel span-12" aria-labelledby="stats-title">
                        <div className="panel__head">
                            <h2 id="stats-title">{periodText?.label ?? 'Số liệu luyện tập'}</h2>
                            <SegmentedControl label="Khoảng thời gian" options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />
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

                    <section className="panel span-6 panel--chart" aria-labelledby="chart-title">
                        <div className="panel__head">
                            <h2 id="chart-title">Độ chính xác</h2>
                            <SegmentedControl label="Trò chơi" options={GAME_OPTIONS} value={shownGame} onChange={setChartGame} />
                        </div>
                        <div className="panel__card">
                            <BlockState request={timeline.state} onRetry={timeline.reload}>
                                {(data) => <AccuracyChart buckets={data.buckets} game={shownGame} passAccuracy={passAccuracy} />}
                            </BlockState>
                        </div>
                    </section>

                    <section className="panel span-6" aria-labelledby="recent-title">
                        <div className="panel__head">
                            <h2 id="recent-title">Ván gần đây</h2>
                        </div>
                        <BlockState request={recent.state} onRetry={recent.reload}>
                            {(data) => <RecentGames sessions={data} timeZone={timeZone} />}
                        </BlockState>
                        {timeline.state.status === 'ready' && timeline.state.data.summary.played > 0 && (
                            <button
                                type="button"
                                className="dash-link panel__foot"
                                aria-expanded={showHistory}
                                aria-controls="history"
                                onClick={() => setShowHistory((open) => !open)}
                            >
                                {showHistory
                                    ? 'Ẩn toàn bộ lịch sử'
                                    : `Xem toàn bộ ${timeline.state.data.summary.played} ván trong ${periodText?.label}`}
                            </button>
                        )}
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
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;
