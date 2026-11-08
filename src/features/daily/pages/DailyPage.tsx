import { Header } from '@/components/layout/Header';
import { BlockState } from '@/features/dashboard/components/BlockState';
import { GAME_META } from '@/features/dashboard/constants';
import { useHashScroll } from '@/lib/useHashScroll';
import { ChallengeHero } from '../components/ChallengeHero';
import { HowItWorks } from '../components/HowItWorks';
import { Leaderboard } from '../components/Leaderboard';
import { MyResult } from '../components/MyResult';
import { useDailyChallenge } from '../hooks/useDailyChallenge';
import '@/styles/app-screen.css';
import '../daily.css';

// Thử thách ngày: mọi người cùng một đề, mỗi người một lượt, xếp hạng theo số đúng rồi tới thời gian.
// Khách xem được bảng xếp hạng và luật chơi; muốn chơi phải đăng nhập.
export const DailyPage = () => {
    const daily = useDailyChallenge();
    const view = daily.state.status === 'ready' ? daily.state.data : null;
    useHashScroll();

    return (
        <div className="min-h-svh">
            <Header />

            <main className="dash daily page-col">
                <BlockState request={daily.state} onRetry={daily.reload}>
                    {(data) => <ChallengeHero view={data} onChanged={daily.reload} />}
                </BlockState>

                <div className="dash__grid daily__grid">
                    <section id="board" className="panel daily__board" aria-labelledby="board-title">
                        <div className="panel__head">
                            <h2 id="board-title">Bảng xếp hạng hôm nay</h2>
                            {view && <span className="dash-muted">{view.challenge.players} người đã chơi</span>}
                        </div>
                        <BlockState request={daily.state} onRetry={daily.reload}>
                            {(data) => <Leaderboard view={data} unit={GAME_META[data.challenge.gameName].unit} />}
                        </BlockState>
                    </section>

                    <aside className="panel daily__side" aria-label="Thành tích của bạn">
                        <BlockState request={daily.state} onRetry={daily.reload}>
                            {(data) => <MyResult view={data} />}
                        </BlockState>
                    </aside>
                </div>

                <HowItWorks challenge={view?.challenge ?? null} />
            </main>
        </div>
    );
};

export default DailyPage;
