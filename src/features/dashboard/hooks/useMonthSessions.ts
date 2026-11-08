import { dashboardApi } from '../api/dashboard.api';
import { monthRange, type MonthRef } from '../utils/calendar';
import { toGameSession } from './useGameHistory';
import { useRequest } from './useOverview';
import type { GameSession } from '../types';

// Tối đa 10 trang × 50 ván cho một tháng: quá mức người chơi thật, chỉ để không lặp vô hạn nếu API lỗi cursor
const MAX_PAGES = 10;

const loadMonth = async (ref: MonthRef): Promise<GameSession[]> => {
    const { from, to } = monthRange(ref);
    const sessions: GameSession[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = await dashboardApi.getHistory({ from, to, limit: 50, cursor });
        sessions.push(...data.items.map(toGameSession));
        cursor = data.nextCursor ?? undefined;
        if (!cursor) break;
    }
    return sessions;
};

// Mỗi tháng một loader cố định để bộ nhớ đệm và effect không coi là loader mới sau mỗi lần render
const loaders = new Map<string, () => Promise<GameSession[]>>();

// Các ván của một tháng cho lịch luyện tập; tháng đã xem được giữ trong bộ nhớ đệm chung
export const useMonthSessions = (ref: MonthRef) => {
    const key = `month:${ref.year}-${ref.month}`;
    if (!loaders.has(key)) loaders.set(key, () => loadMonth(ref));
    return useRequest(key, loaders.get(key)!, 'Không tải được lịch luyện tập.');
};
