import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PreferencesDialog } from '@/features/profile/components/PreferencesDialog';
import { Header } from '@/components/layout/Header';
import mascot from '@/assets/memio/mascot.svg';
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

// Trang chủ của người đã đăng nhập: việc nên làm hôm nay đứng trước, số liệu tóm tắt đứng sau.
// Trang Tiến độ (/dashboard) vẫn là nơi xem lại chi tiết.
export const TodayPage = () => {
    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();

    const sessions = recent.state.status === 'ready' ? recent.state.data : null;
    const hello = profile.state.status === 'ready' ? greet(profile.state.data, sessions, timeZone) : null;
    const recommended = recommendGame(sessions);
    const today = new Date();
    const date = formatWeekday(today, timeZone);
    // Tài khoản chưa trả lời cũng chưa bỏ qua câu hỏi mục tiêu thì hỏi một lần ở đây
    const [askedGoals, setAskedGoals] = useState(false);
    const askGoals = !askedGoals && profile.state.status === 'ready' && profile.state.data.preferences?.status === 'unset';

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash today page-col">
                <header className="today-hello" data-urgent={hello?.urgent ?? false}>
                    <img src={mascot} alt="" className="today-hello__mascot" />
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
                    <div className="panel span-4 dash__aside">
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

                    <section className="panel span-4" aria-labelledby="method-title">
                        <div className="panel__head">
                            <h2 id="method-title">Phương pháp hôm nay</h2>
                        </div>
                        <MethodOfDay />
                    </section>

                    <section className="panel span-4" aria-labelledby="daily-title">
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

            {askGoals && <PreferencesDialog onDone={() => setAskedGoals(true)} />}
        </div>
    );
};

export default TodayPage;
