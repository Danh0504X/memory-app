import { GAME_META } from '../constants';
import { useGameHistory } from '../hooks/useGameHistory';
import { formatClock, formatDateTime, formatPercent } from '../utils/format';
import { GradePill } from './GradePill';
import type { DateRange, GameFilter } from '../types';

interface GameHistoryTableProps {
    range: DateRange;
    game: GameFilter;
    total: number;  // Tổng số ván trong khoảng thời gian, lấy từ thống kê
}

// Bảng đầy đủ các ván trong khoảng thời gian đang xem, tải thêm từng trang
export const GameHistoryTable = ({ range, game, total }: GameHistoryTableProps) => {
    const { sessions, nextCursor, status, error, loadMore } = useGameHistory(
        range.start.toISOString(),
        range.end.toISOString(),
        game,
    );

    if (status === 'loading' && sessions.length === 0) return <p className="dash-note">Đang tải…</p>;
    if (sessions.length === 0 && status !== 'error') {
        return <p className="dash-note">Chưa có ván chơi nào trong khoảng thời gian này.</p>;
    }

    return (
        <>
            <div className="table-scroll">
                <table className="history">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Trò chơi</th>
                            <th className="num">Cấp</th>
                            <th className="num">Nhớ đúng</th>
                            <th className="num">Độ chính xác</th>
                            <th className="num">Thời lượng</th>
                            <th className="num">EXP</th>
                            <th>Kết quả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.map((session) => (
                            <tr key={session.id}>
                                <td className="muted">{formatDateTime(session.playedAt)}</td>
                                <td>
                                    <span className="history__game">
                                        <span style={{ backgroundColor: GAME_META[session.game].color }} aria-hidden="true" />
                                        {GAME_META[session.game].label}
                                    </span>
                                </td>
                                <td className="num">{session.level ?? <span className="muted">Tự chọn</span>}</td>
                                <td className="num">{session.correctItems}/{session.totalItems}</td>
                                <td className="num">{formatPercent(session.accuracy)}</td>
                                <td className="num">{formatClock(session.durationSec)}</td>
                                <td className="num">+{session.expEarned}</td>
                                <td><GradePill grade={session.grade} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {error && <p role="alert" className="dash-note dash-note--error">{error}</p>}

            {nextCursor && (
                <button type="button" onClick={() => void loadMore()} disabled={status === 'loading'} className="dash-more">
                    {status === 'loading' ? 'Đang tải…' : error ? 'Thử lại' : `Xem thêm (${Math.max(total - sessions.length, 0)} ván)`}
                </button>
            )}
        </>
    );
};
