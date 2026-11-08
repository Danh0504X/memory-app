import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';

// Khớp với GET/PATCH /api/profile của backend
export interface UserLevel {
    level: number;
    expIntoLevel: number;       // EXP đã có trong cấp hiện tại
    expForNextLevel: number;    // Tổng EXP của cấp hiện tại, đủ số này thì lên cấp
}

// Khớp với src/config/preferences.ts của backend
export const TRAINING_GOALS = ['language', 'names', 'exam', 'numbers', 'brain'] as const;
export type TrainingGoal = (typeof TRAINING_GOALS)[number];
export const DAILY_MINUTES_OPTIONS = [5, 15, 30] as const;
export type DailyMinutes = (typeof DAILY_MINUTES_OPTIONS)[number];

// unset: chưa trả lời cũng chưa bỏ qua, trang Hôm nay sẽ hỏi một lần
export interface TrainingPreferences {
    goals: TrainingGoal[];
    dailyMinutes: DailyMinutes | null;
    targetDate: string | null;  // "YYYY-MM-DD", chỉ có khi mục tiêu gồm "exam"
    status: 'unset' | 'answered' | 'skipped';
}

export interface PreferencesInput {
    goals: TrainingGoal[];
    dailyMinutes: DailyMinutes;
    targetDate: string | null;
}

export interface UserProfile {
    username: string;
    fullname: string | null;
    exp: number;
    level: UserLevel;
    streaks: number;            // Chuỗi ngày chơi hiện tại, về 0 khi đã bỏ trọn một ngày
    longestStreak: number;
    streakExpired: boolean;     // Đã có chuỗi nhưng vừa bị gián đoạn
    playedToday: boolean;
    preferences: TrainingPreferences;
}

export type ProfileResponse = ApiSuccessResponse<{
    profile: UserProfile;
    unavailableFields: string[];
}>;

export const profileApi = {
    getProfile: (): Promise<ProfileResponse> => {
        return apiClient.get('/profile/') as unknown as Promise<ProfileResponse>;
    },

    updateUsername: (username: string): Promise<ProfileResponse> => {
        return apiClient.patch('/profile/', { username }) as unknown as Promise<ProfileResponse>;
    },

    savePreferences: (preferences: PreferencesInput): Promise<ProfileResponse> => {
        return apiClient.put('/profile/preferences', preferences) as unknown as Promise<ProfileResponse>;
    },

    // Không muốn trả lời: backend ghi lại để không hỏi lại lần sau
    skipPreferences: (): Promise<ProfileResponse> => {
        return apiClient.post('/profile/preferences/skip') as unknown as Promise<ProfileResponse>;
    },
};
