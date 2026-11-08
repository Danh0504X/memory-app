import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BlockState } from '@/features/dashboard/components/BlockState';
import { PeriodStats } from '@/features/dashboard/components/PeriodStats';
import { DailyMini } from '@/features/daily/components/DailyMini';
import { AccountLevel, StreakPanel } from '@/features/dashboard/components/StreakPanel';
import { useCatalog, useProfile, useRecentSessions } from '@/features/dashboard/hooks/useOverview';
import { PROGRESS_TIME_ZONE, formatWeekday } from '@/features/dashboard/utils/format';
import { ContinueTable } from '../components/ContinueTable';
import { DailyGoals } from '../components/DailyGoals';
import { MethodOfDay } from '../components/MethodOfDay';
import { dailyGoals, greet, lastWeekSummary, recommendGame, sessionsOfDay } from '../utils/today';
import '@/styles/app-screen.css';
import '@/features/shared-game/game.css';
import '../today.css';
import '@/features/daily/daily.css';

const timeZone = PROGRESS_TIME_ZONE;

const CURTAIN_STORAGE_KEY = 'memio_opened_curtains';

const getInitialOpenedCurtains = (): Record<string, boolean> => {
    try {
        const saved = sessionStorage.getItem(CURTAIN_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

// Trang chủ của người đã đăng nhập: việc nên làm hôm nay đứng trước, số liệu tóm tắt đứng sau.
// Trang Tiến độ (/dashboard) vẫn là nơi xem lại chi tiết.
export const TodayPage = () => {
    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();

    const [openedCurtains, setOpenedCurtains] = useState<Record<string, boolean>>(getInitialOpenedCurtains);

    const openCurtain = useCallback((key: string) => {
        setOpenedCurtains((prev) => {
            if (prev[key]) return prev;
            const next = { ...prev, [key]: true };
            try {
                sessionStorage.setItem(CURTAIN_STORAGE_KEY, JSON.stringify(next));
            } catch {
                // ignore
            }
            return next;
        });
    }, []);

    const sessions = recent.state.status === 'ready' ? recent.state.data : null;
    const hello = profile.state.status === 'ready' ? greet(profile.state.data, sessions, timeZone) : null;
    const recommended = recommendGame(sessions);
    const today = new Date();
    const date = formatWeekday(today, timeZone);

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash today page-col">
                <header className="today-hello" data-urgent={hello?.urgent ?? false}>
                    <img src="/profile-mascot.svg" alt="" className="today-hello__mascot" />
                    <div>
                        <h1>{hello?.title ?? 'Chào bạn'}</h1>
                        <p>{hello?.line ?? 'Đang tải việc hôm nay…'}</p>
                    </div>
                    <p className="today-hello__date">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
                </header>

                <div className="dash__grid today__grid">
                    <div className="span-8">
                        <BlockState request={catalog.state} onRetry={catalog.reload}>
                            {(games) => (
                                // Đợi lịch sử để gợi ý đúng trò vừa chơi, tránh bàn đổi trò khi lịch sử tải xong
                                <ContinueTable
                                    key={recent.state.status === 'loading' ? 'loading' : recommended}
                                    games={games}
                                    sessions={sessions}
                                    timeZone={timeZone}
                                    recommended={recommended}
                                />
                            )}
                        </BlockState>
                    </div>

                    <section className="panel span-4" aria-labelledby="goals-title">
                        <div className="panel__head">
                            <h2 id="goals-title">Mục tiêu hôm nay</h2>
                        </div>
                        <BlockState request={recent.state} onRetry={recent.reload}>
                            {(data) => <DailyGoals goals={dailyGoals(sessionsOfDay(data, timeZone), recommended)} />}
                        </BlockState>
                    </section>

                    {/* Chuỗi ngày và cấp tài khoản chung một khối, như cột bên của trang Tiến độ */}
                    <div
                        className="panel span-4 dash__aside curtain-card"
                        data-opened={openedCurtains.streak ? 'true' : undefined}
                        onMouseEnter={() => openCurtain('streak')}
                        onTouchStart={() => openCurtain('streak')}
                        onFocus={() => openCurtain('streak')}
                    >
                        <div className="card-curtain card-curtain--pink" aria-hidden="true">
                            <span className="card-curtain__title">Chuỗi ngày</span>
                        </div>
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

                    <section
                        className="panel span-4 curtain-card"
                        aria-labelledby="method-title"
                        data-opened={openedCurtains.method ? 'true' : undefined}
                        onMouseEnter={() => openCurtain('method')}
                        onTouchStart={() => openCurtain('method')}
                        onFocus={() => openCurtain('method')}
                    >
                        <div className="card-curtain card-curtain--blue" aria-hidden="true">
                            <span className="card-curtain__title">Phương pháp hôm nay</span>
                        </div>
                        <div className="panel__head">
                            <h2 id="method-title">Phương pháp hôm nay</h2>
                        </div>
                        <MethodOfDay />
                    </section>

                    <section
                        className="panel span-4 curtain-card"
                        aria-labelledby="daily-title"
                        data-opened={openedCurtains.daily ? 'true' : undefined}
                        onMouseEnter={() => openCurtain('daily')}
                        onTouchStart={() => openCurtain('daily')}
                        onFocus={() => openCurtain('daily')}
                    >
                        <div className="card-curtain card-curtain--yellow" aria-hidden="true">
                            <span className="card-curtain__title">Thử thách hôm nay</span>
                        </div>
                        <div className="panel__head">
                            <h2 id="daily-title">Thử thách hôm nay</h2>
                        </div>
                        <DailyMini />
                    </section>

                    <section className="panel span-12" aria-labelledby="week-title">
                        <div className="panel__head">
                            <h2 id="week-title">7 ngày qua</h2>
                            <Link to="/dashboard" viewTransition className="dash-link">
                                Xem tiến độ đầy đủ →
                            </Link>
                        </div>
                        <BlockState request={recent.state} onRetry={recent.reload}>
                            {(data) => <PeriodStats {...lastWeekSummary(data)} compareLabel="so với 7 ngày trước" />}
                        </BlockState>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default TodayPage;
