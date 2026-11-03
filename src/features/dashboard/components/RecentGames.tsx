import { Link } from 'react-router-dom';
import { GAME_META } from '../constants';
import { formatClock, formatWhen } from '../utils/format';
import { GradePill } from './GradePill';
import type { GameSession } from '../types';

const SHOWN = 5;

// 5 ván mới nhất; bảng đầy đủ nằm ở mục "Toàn bộ lịch sử" bên dưới
export const RecentGames = ({ sessions, timeZone }: { sessions: GameSession[]; timeZone: string }) => {
    if (sessions.length === 0) {
        return (
            <div className="dash-empty">
                <p>Chưa có ván nào. Ván đầu tiên chỉ mất khoảng 2 phút.</p>
                <Link to={GAME_META.image.route} viewTransition className="dash-link">
                    Chơi ván đầu tiên →
                </Link>
            </div>
        );
    }

    return (
        <ul className="recent">
            {sessions.slice(0, SHOWN).map((session) => {
                const meta = GAME_META[session.game];
                return (
                    <li key={session.id} className="recent__row">
                        <span className="recent__dot" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                        <span className="recent__main">
                            <span className="recent__title">
                                {meta.label} · {session.level ? `Cấp ${session.level}` : 'Tự chọn'}
                            </span>
                            <span className="recent__sub">
                                {session.correctItems}/{session.totalItems} {meta.unit} · {formatClock(session.durationSec)}
                            </span>
                        </span>
                        <span className="recent__side">
                            <GradePill grade={session.grade} />
                            <span className="recent__when">{formatWhen(session.playedAt, timeZone)}</span>
                        </span>
                    </li>
                );
            })}
        </ul>
    );
};
