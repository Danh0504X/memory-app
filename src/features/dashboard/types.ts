// Trùng tên game ở backend
export type { GameName as GameId } from '@/features/shared-game/registry';
import type { GameName as GameId } from '@/features/shared-game/registry';

export type Period = 'week' | 'month';
export type GameFilter = 'all' | GameId;
export type ChartMetric = 'accuracy' | 'played';
export type ResultGrade = 'perfect' | 'pass' | 'fail';

// Một ván đã hoàn thành trong bảng lịch sử
export interface GameSession {
    id: string;
    game: GameId;
    playedAt: Date;
    level: number | null;   // null với ván tự chọn số lượng và ván thử thách ngày
    daily: boolean;         // Ván thử thách ngày
    totalItems: number;     // Số thẻ/hình phải ghi nhớ
    correctItems: number;   // Số thẻ/hình nhớ đúng
    accuracy: number;       // 0..1
    grade: ResultGrade;     // Do backend chấm
    durationSec: number;    // Thời gian ghi nhớ + nhớ lại
    expEarned: number;
}

export interface GameStats {
    played: number;
    accuracy: number | null;    // 0..1, null khi không có ván nào
}

// Một cột trên trục thời gian: một tuần hoặc một tháng
export interface PeriodBucket {
    key: string;
    label: string;          // Nhãn ngắn trên trục X
    fullLabel: string;      // Nhãn đầy đủ trong tooltip và bảng
    byGame: Record<GameId, GameStats>;
}

export interface DashboardSummary {
    played: number;
    accuracy: number | null;
    bestLevel: number | null;
    perfectCount: number;
    durationSec: number;
}

export interface DateRange {
    start: Date;
    end: Date;  // Không bao gồm
}
