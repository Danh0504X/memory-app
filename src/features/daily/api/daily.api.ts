import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';
import type { GameName, StartedRound } from '@/features/shared-game/api/games.api';

// Khớp với GET /api/daily-challenge và POST /api/daily-challenge/start của backend.
// Ngày giờ trong JSON là chuỗi ISO.

export interface DailyChallenge {
    date: string;           // "YYYY-MM-DD" theo giờ Việt Nam
    gameName: GameName;
    totalItems: number;
    memorizeLimitSec: number;
    recallLimitSec: number;
    passAccuracy: number;
    players: number;        // Số người đã hoàn thành hôm nay
    endsAt: string;         // Lúc đổi đề (00:00 hôm sau)
}

export interface LeaderboardEntry {
    rank: number;
    username: string;
    correctItems: number;
    totalItems: number;
    accuracy: number;
    memorizeSec: number;
    recallSec: number;
    durationSec: number;
    isMe: boolean;
}

// not-played: chưa dùng lượt · playing: đang chơi dở, còn hạn · completed: đã có kết quả · missed: bỏ dở, hết hạn
export type MyChallengeStatus = 'not-played' | 'playing' | 'completed' | 'missed';

export interface DailyChallengeView {
    challenge: DailyChallenge;
    leaderboard: LeaderboardEntry[];
    // null với khách
    me: { status: MyChallengeStatus; sessionId: string | null; entry: LeaderboardEntry | null } | null;
}

export const dailyApi = {
    get: (): Promise<ApiSuccessResponse<DailyChallengeView>> =>
        apiClient.get('/daily-challenge') as unknown as Promise<ApiSuccessResponse<DailyChallengeView>>,

    // Dùng lượt chơi hôm nay; còn đang ghi nhớ dở thì backend trả lại đúng ván đó
    start: (): Promise<ApiSuccessResponse<{ session: StartedRound }>> =>
        apiClient.post('/daily-challenge/start') as unknown as Promise<ApiSuccessResponse<{ session: StartedRound }>>,
};
