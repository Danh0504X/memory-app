import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';
import type { UserProfile } from '@/features/profile/api/profile.api';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';

export type ParentLink = { state: 'none' | 'pending' | 'verified'; fullname?: string; maskedEmail?: string };
export type ParentOverview = {
    child: { username: string; avatarUrl: string | null; profile: UserProfile };
    summary: { games: number; practiceDays: number; accuracy: number | null; recordedPracticeSeconds: number; lastPlayedAt: string | null;
        byGame: { gameName: string; games: number; correct: number; total: number }[] };
    progress: { gameName: string; unlockedLevel: number; stats: { played: number; totalCorrect: number; totalItems: number } }[];
    ageGroup: string | null;
};
export type ParentReport = {
    period: 'day' | 'week'; date: string; incomplete: boolean; timeZone: string;
    summary: ParentOverview['summary']; previousSummary: ParentOverview['summary'];
    activities: { gameName: string; completedAt: string; correctItems: number; totalItems: number; durationSec: number }[];
    comment: { observation: string; evidence: string; trend: string; suggestion: string };
    suggestions: { title: string; reason: string; steps: string[]; question: string; gameName: string }[];
};
const data = <T>(promise: Promise<ApiSuccessResponse<T>>) => promise.then((response) => response.data);

export const parentApi = {
    link: () => data(apiClient.get('/parent/link') as unknown as Promise<ApiSuccessResponse<ParentLink>>),
    register: (body: { fullname: string; email: string; password: string; confirmPassword: string }) =>
        data(apiClient.post('/parent/register', body) as unknown as Promise<ApiSuccessResponse<ParentLink>>),
    resend: () => data(apiClient.post('/parent/resend') as unknown as Promise<ApiSuccessResponse<{ maskedEmail: string }>>),
    inspect: (token: string) => data(apiClient.post('/parent/verify/inspect', { token }) as unknown as Promise<ApiSuccessResponse<{ valid: boolean }>>),
    verify: (token: string) => data(apiClient.post('/parent/verify/confirm', { token }) as unknown as Promise<ApiSuccessResponse<{ verified: boolean }>>),
    overview: () => data(apiClient.get('/parent/overview') as unknown as Promise<ApiSuccessResponse<ParentOverview>>),
    games: () => data(apiClient.get('/parent/games') as unknown as Promise<ApiSuccessResponse<{ games: GameCatalogItem[] }>>),
    report: (period: 'day' | 'week', date: string) =>
        data(apiClient.get('/parent/report', { params: { period, date } }) as unknown as Promise<ApiSuccessResponse<ParentReport>>),
    ageGroup: (ageGroup: string | null) => data(apiClient.patch('/parent/age-group', { ageGroup }) as unknown as Promise<ApiSuccessResponse<{ ageGroup: string | null }>>),
    password: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
        data(apiClient.patch('/parent/password', body) as unknown as Promise<ApiSuccessResponse<{ changed: boolean }>>),
};
