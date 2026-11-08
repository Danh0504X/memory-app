import { GAME_META } from '@/features/dashboard/constants';
import { PROGRESS_TIME_ZONE } from '@/features/dashboard/utils/format';
import type { GameName } from '@/features/shared-game/api/games.api';

interface CalendarPageProps {
    date: string;           // "YYYY-MM-DD" của thử thách
    gameName: GameName;
    totalItems: number;
    size?: 'sm' | 'md' | 'lg';
}

// "2026-11-08" → Date lúc 12:00 trưa ngày đó theo giờ Việt Nam (không lệch ngày khi đổi múi giờ)
const noonOf = (date: string) => new Date(`${date}T12:00:00+07:00`);

// Tờ lịch của ngày: mỗi ngày xé một tờ, mỗi tờ một đề mới. Hai tờ phía sau làm thành xấp lịch.
export const CalendarPage = ({ date, gameName, totalItems, size = 'md' }: CalendarPageProps) => {
    const day = noonOf(date);
    const weekday = new Intl.DateTimeFormat('vi-VN', { timeZone: PROGRESS_TIME_ZONE, weekday: 'long' }).format(day);
    const meta = GAME_META[gameName];

    return (
        <div className="calpage" data-size={size} role="img" aria-label={`Thử thách ngày ${date}: ${meta.label}, ${totalItems} ${meta.unit}`}>
            <div className="calpage__sheet" aria-hidden="true">
                <p className="calpage__top">{weekday.charAt(0).toUpperCase() + weekday.slice(1)}</p>
                <p className="calpage__day">{date.slice(8, 10)}</p>
                <p className="calpage__month">Tháng {Number(date.slice(5, 7))}</p>
                <p className="calpage__game">
                    {meta.label} · {totalItems} {meta.unit}
                </p>
            </div>
        </div>
    );
};
