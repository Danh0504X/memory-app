import { PROGRESS_TIME_ZONE, dayKey } from '@/features/dashboard/utils/format';
import type { DailyMinutes, PreferencesInput, TrainingGoal, TrainingPreferences } from '../api/profile.api';

export const GOAL_LABELS: Record<TrainingGoal, string> = {
    language: 'Học ngoại ngữ',
    names: 'Nhớ tên người mới gặp',
    exam: 'Ôn thi, học bài',
    numbers: 'Nhớ số và mã số',
    brain: 'Giữ đầu óc minh mẫn',
};

export const formatMinutes = (minutes: DailyMinutes) => `${minutes} phút`;

// Bản nháp của form: ngày thi để chuỗi rỗng khi chưa chọn, cho khớp với <input type="date">
export interface PreferencesDraft {
    goals: TrainingGoal[];
    dailyMinutes: DailyMinutes;
    targetDate: string;
}

export const toDraft = (preferences: TrainingPreferences | undefined): PreferencesDraft => ({
    goals: preferences?.goals ?? [],
    dailyMinutes: preferences?.dailyMinutes ?? 15,
    targetDate: preferences?.targetDate ?? '',
});

export const toInput = (draft: PreferencesDraft): PreferencesInput => ({
    goals: draft.goals,
    dailyMinutes: draft.dailyMinutes,
    targetDate: draft.goals.includes('exam') && draft.targetDate ? draft.targetDate : null,
});

// Khoảng ngày thi backend chấp nhận: từ hôm nay tới 3 năm sau
export const targetDateRange = (now = new Date()) => {
    const today = dayKey(now, PROGRESS_TIME_ZONE);
    return { min: today, max: `${Number(today.slice(0, 4)) + 3}${today.slice(4)}` };
};

const DAY_MS = 24 * 60 * 60 * 1000;
const keyToUtc = (key: string) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

// "15/03/2027, còn 127 ngày"
export const describeTargetDate = (targetDate: string, now = new Date()) => {
    const days = Math.round((keyToUtc(targetDate) - keyToUtc(dayKey(now, PROGRESS_TIME_ZONE))) / DAY_MS);
    const date = `${targetDate.slice(8, 10)}/${targetDate.slice(5, 7)}/${targetDate.slice(0, 4)}`;
    if (days > 0) return `${date}, còn ${days} ngày`;
    if (days === 0) return `${date}, là hôm nay`;
    return `${date}, đã qua`;
};
