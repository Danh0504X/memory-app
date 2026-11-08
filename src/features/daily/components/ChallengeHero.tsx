import { Link } from 'react-router-dom';
import { AlertCircle, LoaderCircle, Play } from 'lucide-react';
import { GAME_META } from '@/features/dashboard/constants';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import type { DailyChallengeView } from '../api/daily.api';
import { useCountdown, useStartDaily } from '../hooks/useDailyChallenge';
import { CalendarPage } from './CalendarPage';

interface ChallengeHeroProps {
    view: DailyChallengeView;
    onChanged: () => void;  // Tải lại: hết ngày (đề mới) hoặc bắt đầu thất bại vì trạng thái đã đổi
}

// Phần đầu trang thử thách: bàn xanh với tờ lịch hôm nay, luật chơi, đồng hồ đổi đề và một nút theo trạng thái lượt chơi
export const ChallengeHero = ({ view, onChanged }: ChallengeHeroProps) => {
    const { start, starting, error } = useStartDaily(onChanged);
    const countdown = useCountdown(view.challenge.endsAt, onChanged);
    const { challenge, me } = view;
    const meta = GAME_META[challenge.gameName];

    let action;
    if (!me) {
        action = (
            <Link to="/login" state={{ from: { pathname: '/daily' } }} viewTransition className="btn btn--sun">
                Đăng nhập để tham gia
            </Link>
        );
    } else if (me.status === 'completed' && me.entry) {
        action = (
            <Link to={{ hash: 'board' }} className="btn btn--sun">
                Bạn đứng hạng {me.entry.rank} · Xem bảng xếp hạng
            </Link>
        );
    } else if (me.status === 'missed') {
        action = <p className="dhero__note">Bạn đã dùng lượt hôm nay nhưng chưa nộp bài. Hẹn bạn ngày mai nhé.</p>;
    } else {
        action = (
            <button type="button" className="btn btn--sun" onClick={() => void start()} disabled={starting}>
                {starting ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
                {starting ? 'Đang chia bài...' : me.status === 'playing' ? 'Chơi tiếp' : 'Tham gia ngay'}
            </button>
        );
    }

    return (
        <section className="dhero" aria-labelledby="daily-title">
            <div className="dhero__copy">
                <h1 id="daily-title">Thử thách hôm nay</h1>
                <p className="dhero__lead">
                    Mỗi ngày một đề mới cho tất cả mọi người. Chỉ có một lượt, nên hãy nhớ thật kỹ trước khi bắt đầu.
                </p>
                <ul className="dhero__facts">
                    <li>
                        {meta.label} · {challenge.totalItems} {meta.unit}
                    </li>
                    <li>Ghi nhớ {formatSeconds(challenge.memorizeLimitSec)}</li>
                    <li>Nhớ lại {formatSeconds(challenge.recallLimitSec)}</li>
                </ul>
                <div className="dhero__actions">
                    {action}
                    <Link to={{ hash: 'how' }} className="dhero__how">
                        Cách chơi
                    </Link>
                </div>
                {me?.status === 'not-played' && <p className="dhero__note">Bấm tham gia là ván được tính, kể cả khi bạn bỏ dở.</p>}
                {error && (
                    <p role="alert" className="dhero__error">
                        <AlertCircle size={18} aria-hidden="true" />
                        {error}
                    </p>
                )}
                <p className="dhero__clock">
                    Đề mới sau <span className="dhero__time">{countdown}</span> · {challenge.players} người đã chơi
                </p>
            </div>

            <CalendarPage date={challenge.date} gameName={challenge.gameName} totalItems={challenge.totalItems} size="lg" />
        </section>
    );
};
