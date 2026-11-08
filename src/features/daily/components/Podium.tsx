import { formatClock } from '@/features/dashboard/utils/format';
import type { LeaderboardEntry } from '../api/daily.api';
import { Avatar } from './Avatar';

// Thứ tự trên bục: hạng 2 bên trái, hạng 1 ở giữa (cao nhất), hạng 3 bên phải
const PLACES = [2, 1, 3] as const;

// Bục vinh danh ba người đứng đầu; chỗ chưa có ai thì để trống
export const Podium = ({ entries, unit }: { entries: LeaderboardEntry[]; unit: string }) => (
    <ol className="podium" aria-label="Ba người đứng đầu">
        {PLACES.map((place) => {
            const entry = entries.find((item) => item.rank === place);
            return (
                <li key={place} className="podium__place" data-place={place} data-me={entry?.isMe ?? false}>
                    {entry ? (
                        <>
                            <Avatar name={entry.username} size={place === 1 ? 56 : 44} />
                            <span className="podium__name">
                                {entry.username}
                                {entry.isMe && ' (bạn)'}
                            </span>
                            <span className="podium__score">
                                {entry.correctItems}/{entry.totalItems} {unit} · {formatClock(entry.durationSec)}
                            </span>
                        </>
                    ) : (
                        <span className="podium__empty">Còn trống</span>
                    )}
                    <span className="podium__step" aria-hidden="true">
                        {place}
                    </span>
                    <span className="sr-only">Hạng {place}</span>
                </li>
            );
        })}
    </ol>
);
