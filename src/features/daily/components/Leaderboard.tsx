import { formatClock } from '@/features/dashboard/utils/format';
import type { DailyChallengeView, LeaderboardEntry } from '../api/daily.api';
import { Avatar } from './Avatar';
import { Podium } from './Podium';

const Row = ({ entry, unit }: { entry: LeaderboardEntry; unit: string }) => (
    <tr data-me={entry.isMe}>
        <td className="board__rank">{entry.rank}</td>
        <th scope="row">
            <span className="board__name">
                <Avatar name={entry.username} size={28} />
                {entry.username}
                {entry.isMe && <span className="board__you">bạn</span>}
            </span>
        </th>
        <td className="num">
            {entry.correctItems}/{entry.totalItems} {unit}
        </td>
        <td className="num">{formatClock(entry.durationSec)}</td>
    </tr>
);

// Bục cho ba người đầu, bảng cho những người tiếp theo; người chơi ngoài top vẫn thấy hàng của mình ở cuối
export const Leaderboard = ({ view, unit }: { view: DailyChallengeView; unit: string }) => {
    const { leaderboard } = view;
    const rest = leaderboard.filter((entry) => entry.rank > 3);
    const mine = view.me?.entry;
    const mineHidden = mine && !leaderboard.some((entry) => entry.isMe);

    if (leaderboard.length === 0) {
        return (
            <div className="board__empty">
                <p>Chưa có ai hoàn thành thử thách hôm nay.</p>
                <p>Hãy là người đầu tiên lên bục!</p>
            </div>
        );
    }

    return (
        <>
            <Podium entries={leaderboard.slice(0, 3)} unit={unit} />
            {(rest.length > 0 || mineHidden) && (
                <table className="board">
                    <thead>
                        <tr>
                            <th scope="col">Hạng</th>
                            <th scope="col">Người chơi</th>
                            <th scope="col" className="num">
                                Đúng
                            </th>
                            <th scope="col" className="num">
                                Thời gian
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rest.map((entry) => (
                            <Row key={entry.rank} entry={entry} unit={unit} />
                        ))}
                        {mineHidden && (
                            <>
                                <tr className="board__gap" aria-hidden="true">
                                    <td colSpan={4}>⋯</td>
                                </tr>
                                <Row entry={mine} unit={unit} />
                            </>
                        )}
                    </tbody>
                </table>
            )}
        </>
    );
};
