import { Link } from 'react-router-dom';
import { AlertCircle, LoaderCircle, Play } from 'lucide-react';
import { BlockState } from '@/features/dashboard/components/BlockState';
import { GAME_META } from '@/features/dashboard/constants';
import type { DailyChallengeView } from '../api/daily.api';
import { useCountdown, useDailyChallenge, useStartDaily } from '../hooks/useDailyChallenge';
import { Avatar } from './Avatar';
import { CalendarPage } from './CalendarPage';

const MiniBody = ({ view, onChanged }: { view: DailyChallengeView; onChanged: () => void }) => {
    const { start, starting, error } = useStartDaily(onChanged);
    const countdown = useCountdown(view.challenge.endsAt, onChanged);
    const { challenge, me, leaderboard } = view;
    const meta = GAME_META[challenge.gameName];
    const status = me?.status ?? 'not-played';
    const top = leaderboard.slice(0, 3);

    return (
        <>
            <div className="dmini">
                <CalendarPage date={challenge.date} gameName={challenge.gameName} totalItems={challenge.totalItems} size="sm" />
                <div className="dmini__info">
                    <p className="dmini__game">
                        {meta.label} · {challenge.totalItems} {meta.unit}
                    </p>
                    {me?.entry ? (
                        <p className="dmini__rank">
                            Bạn đứng <strong>hạng {me.entry.rank}</strong> trên {challenge.players} người
                        </p>
                    ) : (
                        <p className="dmini__meta">{challenge.players} người đã chơi</p>
                    )}
                    {top.length > 0 && (
                        <p className="dmini__top">
                            <span className="dmini__faces" aria-hidden="true">
                                {top.map((entry) => (
                                    <Avatar key={entry.rank} name={entry.username} size={26} />
                                ))}
                            </span>
                            <span>Dẫn đầu: {top[0].username}</span>
                        </p>
                    )}
                    <p className="dmini__meta">Đề mới sau {countdown?.slice(0, 5).replace(':', ' giờ ')} phút</p>
                </div>
            </div>

            <div className="dmini__actions">
                {status === 'not-played' || status === 'playing' ? (
                    <button type="button" className="goals__go dmini__join" onClick={() => void start()} disabled={starting}>
                        {starting ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                        {status === 'playing' ? 'Chơi tiếp' : 'Tham gia'}
                    </button>
                ) : (
                    <Link to="/daily" viewTransition className="goals__go">
                        Xem bảng xếp hạng
                    </Link>
                )}
                <Link to="/daily#how" viewTransition className="dash-link">
                    Giới thiệu
                </Link>
            </div>
            {error && (
                <p role="alert" className="dmini__error">
                    <AlertCircle size={16} aria-hidden="true" />
                    {error}
                </p>
            )}
        </>
    );
};

// Khối thử thách trên trang chủ: tờ lịch hôm nay, hạng của bạn, người dẫn đầu và hai nút Tham gia / Giới thiệu
export const DailyMini = () => {
    const daily = useDailyChallenge();
    return (
        <BlockState request={daily.state} onRetry={daily.reload}>
            {(view) => <MiniBody view={view} onChanged={daily.reload} />}
        </BlockState>
    );
};
