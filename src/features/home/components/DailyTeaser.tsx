import { useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useReveal } from '@/lib/useReveal';
import { GAME_META } from '@/features/dashboard/constants';
import { Avatar } from '@/features/daily/components/Avatar';
import { CalendarPage } from '@/features/daily/components/CalendarPage';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import '@/features/daily/daily.css';

const delay = (d: number) => ({ '--d': d }) as CSSProperties;

// Trang giới thiệu (khách): mời tham gia thử thách ngày. Số liệu hôm nay lấy từ API; chưa tải được thì chỉ hiện lời mời.
export const DailyTeaser = () => {
    const root = useRef<HTMLElement>(null);
    useReveal(root);
    const daily = useDailyChallenge();
    const view = daily.state.status === 'ready' ? daily.state.data : null;
    const meta = view ? GAME_META[view.challenge.gameName] : null;

    return (
        <section className="dteaser" ref={root} aria-labelledby="dteaser-title">
            <div className="dteaser__inner page-col" data-visual={view !== null}>
                <div className="dteaser__copy">
                    <h2 id="dteaser-title" className="text-title">
                        <span data-reveal="line"><span>Mỗi ngày</span></span>
                        <span data-reveal="line" style={delay(1)}><span>một thử thách mới</span></span>
                    </h2>
                    <p className="text-lead" data-reveal style={delay(2)}>
                        Cả cộng đồng Memio cùng nhớ một đề. Mỗi người một lượt, ai nhớ đúng nhiều và nhanh hơn sẽ đứng đầu
                        bảng xếp hạng.
                    </p>
                    {view && meta && (
                        // Hiện sau khi tải xong, lúc useReveal đã chạy: không gắn data-reveal kẻo dòng này bị ẩn mãi
                        <p className="dteaser__today">
                            Hôm nay: <strong>{meta.label} · {view.challenge.totalItems} {meta.unit}</strong> ·{' '}
                            {view.challenge.players} người đã chơi
                        </p>
                    )}
                    <div className="dteaser__actions" data-reveal style={delay(4)}>
                        {/* Đăng nhập xong quay lại đúng trang thử thách */}
                        <Link to="/login" state={{ from: { pathname: '/daily' } }} viewTransition className="btn btn--brand">
                            Tham gia thử thách
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <Link to="/daily#how" viewTransition className="btn btn--quiet">
                            Giới thiệu
                        </Link>
                    </div>
                </div>

                <div className="dteaser__visual" data-reveal style={delay(2)}>
                    {view && (
                        <CalendarPage
                            date={view.challenge.date}
                            gameName={view.challenge.gameName}
                            totalItems={view.challenge.totalItems}
                            size="lg"
                        />
                    )}
                    {view && view.leaderboard.length > 0 && (
                        <ol className="dteaser__top" aria-label="Dẫn đầu hôm nay">
                            {view.leaderboard.slice(0, 3).map((entry) => (
                                <li key={entry.rank}>
                                    <span className="dteaser__rank">{entry.rank}</span>
                                    <Avatar name={entry.username} size={30} />
                                    <span className="dteaser__name">{entry.username}</span>
                                    <span className="dteaser__score">
                                        {entry.correctItems}/{entry.totalItems}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            </div>
        </section>
    );
};
