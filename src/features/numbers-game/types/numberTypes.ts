import type { CompletedRound } from '@/features/shared-game/api/games.api';

export type NumberMode = 'practice' | 'challenge';
export type NumberPhase = 'memorizing' | 'preparing_recall' | 'recalling' | 'completed';
export type NumberAnswers = (string | null)[];
export interface NumberSettings {
    mode: NumberMode;
    level?: number;
    digitCount?: number;
    memorizeSeconds?: number;
    recallSeconds?: number;
    prepareRecall: boolean;
}
export interface NumberSession {
    completedRound?: CompletedRound;
    id: string;
    mode: NumberMode;
    level: number | null;
    prepareRecall: boolean;
    digitCount: number;
    memorizeSeconds: number;
    recallSeconds: number;
    phase: NumberPhase;
    revision: number;
    startedAt: string;
    memorizeEndsAt: string;
    recallStartedAt: string | null;
    recallEndsAt: string | null;
    completedAt: string | null;
    completionReason: 'submitted' | 'timeout' | null;
    memorizeUsedMs: number | null;
    serverNow: string;
    digits?: string[];
    answers?: NumberAnswers;
    result?: {
        score: number; accuracy: number; correctCount: number; wrongCount: number;
        blankCount: number; total: number; memorizeUsedMs: number | null;
        completionReason: 'submitted' | 'timeout';
    };
    comparison?: { index: number; expected: string; actual: string | null; status: 'correct' | 'wrong' | 'blank' }[];
}
export interface TodayChallengeStatus {
    played: boolean;
    score?: number;
    correctCount?: number;
    digitCount?: number;
    accuracy?: number;
    memorizeUsedMs?: number | null;
    phase?: NumberPhase;
}
export interface NumberProgress {
    unlockedLevel: number;
    digitCounts: number[];
    todayChallenge?: TodayChallengeStatus;
}
export interface NumberPreferences { groups: string; hideTimer: boolean; prepTime: number }
