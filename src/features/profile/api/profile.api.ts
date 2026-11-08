import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';

// Khớp với GET/PATCH /api/profile của backend
export interface UserLevel {
    level: number;
    expIntoLevel: number;       // EXP đã có trong cấp hiện tại
    expForNextLevel: number;    // Tổng EXP của cấp hiện tại, đủ số này thì lên cấp
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
};
