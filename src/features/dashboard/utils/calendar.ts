import type { GameSession } from '../types';
import { dayKey } from './format';

export interface MonthRef {
    year: number;
    month: number;  // 1..12
}

const pad = (value: number) => String(value).padStart(2, '0');

export const monthOf = (key: string): MonthRef => ({ year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) });

export const shiftMonth = ({ year, month }: MonthRef, by: number): MonthRef => {
    const index = year * 12 + (month - 1) + by;
    return { year: Math.floor(index / 12), month: (index % 12) + 1 };
};

export const sameMonth = (a: MonthRef, b: MonthRef) => a.year === b.year && a.month === b.month;

// Mốc đầu và cuối tháng theo giờ Việt Nam (múi giờ backend dùng để tính ngày chơi), dạng ISO để gọi API lịch sử
export const monthRange = (ref: MonthRef) => {
    const next = shiftMonth(ref, 1);
    return {
        from: new Date(`${ref.year}-${pad(ref.month)}-01T00:00:00+07:00`).toISOString(),
        to: new Date(`${next.year}-${pad(next.month)}-01T00:00:00+07:00`).toISOString(),
    };
};

export interface CalendarDay {
    key: string;        // "YYYY-MM-DD"
    day: number;
    sessions: GameSession[];
}

// Lưới tháng bắt đầu từ thứ Hai; ô trống đầu tháng là null
export const monthGrid = (ref: MonthRef, sessions: GameSession[], timeZone: string): (CalendarDay | null)[] => {
    const byDay = new Map<string, GameSession[]>();
    for (const session of sessions) {
        const key = dayKey(session.playedAt, timeZone);
        byDay.set(key, [...(byDay.get(key) ?? []), session]);
    }

    const daysInMonth = new Date(Date.UTC(ref.year, ref.month, 0)).getUTCDate();
    const firstWeekday = new Date(Date.UTC(ref.year, ref.month - 1, 1)).getUTCDay(); // 0 là Chủ nhật
    const leading = (firstWeekday + 6) % 7;

    const cells: (CalendarDay | null)[] = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
        const key = `${ref.year}-${pad(ref.month)}-${pad(day)}`;
        cells.push({ key, day, sessions: byDay.get(key) ?? [] });
    }
    return cells;
};

// Đậm nhạt theo số ván trong ngày: 0, 1, 2–3, từ 4
export const intensity = (count: number) => (count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : 3);

// Gom một nhóm ván: số ván, độ chính xác (tổng đúng / tổng số lá, giống backend), số phút
export const summarizeDay = (sessions: GameSession[]) => {
    const totalItems = sessions.reduce((sum, session) => sum + session.totalItems, 0);
    const correct = sessions.reduce((sum, session) => sum + session.correctItems, 0);
    return {
        played: sessions.length,
        accuracy: totalItems ? correct / totalItems : null,
        minutes: Math.round(sessions.reduce((sum, session) => sum + session.durationSec, 0) / 60),
    };
};
