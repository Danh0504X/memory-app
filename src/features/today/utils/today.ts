import type { TrainingPreferences, UserProfile } from '@/features/profile/api/profile.api';
import { goalGames, roundsPerDay } from './personalize';
import { GAME_META } from '@/features/dashboard/constants';
import { dayKey } from '@/features/dashboard/utils/format';
import type { DashboardSummary, GameId, GameSession } from '@/features/dashboard/types';

const DAY_MS = 24 * 60 * 60 * 1000;

const hourIn = (date: Date, timeZone: string) =>
    Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(date));

const partOfDay = (hour: number) => {
    if (hour < 11) return 'sáng';
    if (hour < 13) return 'trưa';
    if (hour < 18) return 'chiều';
    return 'tối';
};

export const sessionsOfDay = (sessions: GameSession[], timeZone: string, now = new Date()) => {
    const today = dayKey(now, timeZone);
    return sessions.filter((session) => dayKey(session.playedAt, timeZone) === today);
};

// Lời chào theo buổi, kèm một câu nói đúng tình hình hôm nay; buổi tối chưa chơi mà đang có chuỗi thì nhắc gấp
export const greet = (profile: UserProfile, sessions: GameSession[] | null, timeZone: string, now = new Date()) => {
    const hour = hourIn(now, timeZone);
    const title = `Chào buổi ${partOfDay(hour)}, ${profile.username}`;
    const today = sessions ? sessionsOfDay(sessions, timeZone, now).length : 0;

    if (profile.playedToday) {
        return {
            title,
            line: today
                ? `Hôm nay bạn đã chơi ${today} ván, chuỗi ${profile.streaks} ngày đang được giữ.`
                : `Hôm nay bạn đã luyện tập, chuỗi ${profile.streaks} ngày đang được giữ.`,
            urgent: false,
        };
    }
    if (sessions && sessions.length === 0) {
        return { title, line: 'Chơi ván đầu tiên để bắt đầu chuỗi ngày luyện tập.', urgent: false };
    }
    if (profile.streakExpired) {
        return { title, line: 'Chuỗi ngày vừa bị gián đoạn. Chơi 1 ván hôm nay để bắt đầu lại.', urgent: false };
    }
    if (profile.streaks > 0 && hour >= 18) {
        return {
            title,
            line: `Còn ${24 - hour} giờ nữa là hết ngày. Chơi 1 ván để giữ chuỗi ${profile.streaks} ngày.`,
            urgent: true,
        };
    }
    return {
        title,
        line:
            profile.streaks > 0
                ? `Chơi 1 ván hôm nay để giữ chuỗi ${profile.streaks} ngày.`
                : 'Chơi 1 ván hôm nay để bắt đầu chuỗi ngày luyện tập.',
        urgent: false,
    };
};

export interface DailyGoal {
    id: string;
    label: string;
    done: boolean;
    to: string;         // Nơi để làm mục tiêu này nếu chưa xong
    action: string;
}

// Ba mục tiêu nhỏ mỗi ngày, tính từ các ván đã chơi hôm nay (chưa có phần thưởng riêng ở backend).
// Có mục tiêu luyện tập thì số ván theo thời gian đã chọn, và ván cần đạt phải thuộc trò hợp mục tiêu.
export const dailyGoals = (
    today: GameSession[],
    recommended: GameId,
    preferences?: TrainingPreferences | null,
): DailyGoal[] => {
    const rounds = roundsPerDay(preferences);
    const preferred = goalGames(preferences);
    const route = GAME_META[recommended].route;

    return [
        rounds > 1
            ? {
                  id: 'play',
                  label: `Chơi ${rounds} ván hôm nay (${Math.min(today.length, rounds)}/${rounds})`,
                  done: today.length >= rounds,
                  to: route,
                  action: 'Chơi',
              }
            : {
                  id: 'play',
                  label: 'Chơi 1 ván để giữ chuỗi ngày',
                  done: today.length > 0,
                  to: route,
                  action: 'Chơi',
              },
        preferred.length > 0
            ? {
                  id: 'pass',
                  label: `Đạt 1 ván ${preferred.map((game) => GAME_META[game].label).join(' hoặc ')}`,
                  done: today.some((session) => preferred.includes(session.game) && session.grade !== 'fail'),
                  to: route,
                  action: 'Chơi',
              }
            : {
                  id: 'pass',
                  label: 'Đạt 1 ván (đúng từ 70%)',
                  done: today.some((session) => session.grade !== 'fail'),
                  to: route,
                  action: 'Chơi',
              },
        {
            id: 'daily',
            label: 'Chơi thử thách hôm nay',
            done: today.some((session) => session.daily),
            to: '/daily',
            action: 'Chơi',
        },
    ];
};

// Gom các ván giống cách backend tính (timeline.service): độ chính xác = tổng đúng / tổng số lá
const summarize = (sessions: GameSession[]): DashboardSummary => {
    const totalItems = sessions.reduce((sum, session) => sum + session.totalItems, 0);
    const levels = sessions.flatMap((session) => (session.level === null ? [] : [session.level]));
    return {
        played: sessions.length,
        accuracy: totalItems ? sessions.reduce((sum, session) => sum + session.correctItems, 0) / totalItems : null,
        bestLevel: levels.length ? Math.max(...levels) : null,
        perfectCount: sessions.filter((session) => session.grade === 'perfect').length,
        durationSec: sessions.reduce((sum, session) => sum + session.durationSec, 0),
    };
};

// 7 ngày gần nhất so với 7 ngày trước đó
export const lastWeekSummary = (sessions: GameSession[], now = new Date()) => {
    const weekAgo = now.getTime() - 7 * DAY_MS;
    const twoWeeksAgo = now.getTime() - 14 * DAY_MS;
    const current = sessions.filter((session) => session.playedAt.getTime() >= weekAgo);
    const previous = sessions.filter((session) => {
        const time = session.playedAt.getTime();
        return time >= twoWeeksAgo && time < weekAgo;
    });
    return { summary: summarize(current), previousSummary: summarize(previous) };
};

const dayOfYear = (now: Date) => Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / DAY_MS);

// Chọn một phần tử theo ngày: cả ngày giống nhau, hôm sau đổi
export const pickOfDay = <T,>(items: readonly T[], now = new Date()) => items[dayOfYear(now) % items.length];

export const TIPS = [
    'Chia dãy dài thành từng nhóm 3–4 lá, rồi nhớ mỗi nhóm như một hình.',
    'Hình càng lạ và có chuyển động càng dễ nhớ: hãy cho các lá làm một việc gì đó.',
    'Trước khi xếp lại, nhắm mắt kể lại câu chuyện một lượt.',
    'Đúng hết một dãy ngắn có ích hơn nhớ một dãy dài mà sai: đúng tất cả mới mở cấp mới.',
    'Luyện 10 phút mỗi ngày hiệu quả hơn một giờ mỗi tuần.',
    'Đi theo cùng một lộ trình trong căn phòng trí nhớ để không phải nghĩ lại vị trí.',
    'Xem lại phần đối chiếu sau mỗi ván để biết mình hay quên ở đoạn nào.',
    'Ngủ đủ giấc giúp não lưu lại những gì bạn vừa luyện.',
];
