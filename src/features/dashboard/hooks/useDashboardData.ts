import { prefetchQuery } from '@/lib/queryCache';
import { dashboardApi } from '../api/dashboard.api';
import { toPeriodBucket } from '../utils/format';
import { prefetchDashboardBase, useRequest } from './useOverview';
import type { DashboardSummary, DateRange, GameFilter, Period, PeriodBucket } from '../types';

export interface DashboardData {
    buckets: PeriodBucket[];
    summary: DashboardSummary;
    previousSummary: DashboardSummary;
    range: DateRange;
    timeZone: string;   // Múi giờ backend dùng để chia kỳ và tính chuỗi ngày
}

const loadTimeline = async (period: Period, game: GameFilter): Promise<DashboardData> => {
    const { data: { timeline } } = await dashboardApi.getTimeline(period, game);
    return {
        buckets: timeline.buckets.map((bucket) => toPeriodBucket(bucket, period, timeline.timeZone)),
        summary: timeline.summary,
        previousSummary: timeline.previousSummary,
        range: { start: new Date(timeline.range.start), end: new Date(timeline.range.end) },
        timeZone: timeline.timeZone,
    };
};

// Mỗi cặp kỳ/trò một loader cố định, để bộ nhớ đệm và effect không coi là loader mới sau mỗi lần render
const loaders = new Map<string, () => Promise<DashboardData>>();
const timelineQuery = (period: Period, game: GameFilter) => {
    const key = `timeline:${period}:${game}`;
    if (!loaders.has(key)) loaders.set(key, () => loadTimeline(period, game));
    return { key, loader: loaders.get(key)! };
};

// Thẻ thống kê, biểu đồ và bảng lịch sử dùng cùng khoảng thời gian và bộ lọc do backend tính,
// nên các con số luôn khớp nhau.
export const useDashboardData = (period: Period, game: GameFilter) => {
    const { key, loader } = timelineQuery(period, game);
    return useRequest(key, loader, 'Không thể tải tiến độ. Vui lòng thử lại.');
};

// Tải trước mọi thứ trang Tiến độ cần ở lần mở đầu (tuần, tất cả các trò)
export const prefetchDashboard = () => {
    prefetchDashboardBase();
    const { key, loader } = timelineQuery('week', 'all');
    prefetchQuery(key, loader);
};
