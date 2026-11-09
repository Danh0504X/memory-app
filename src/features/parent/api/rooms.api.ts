import { apiClient } from '@/lib/api-client';
import type { ApiSuccessResponse } from '@/types/auth.types';

export type RoomRole = 'parent' | 'child';
export type RoomItem = { code: string; label?: string; imageUrl?: string };
export type RoomView = {
    code: string; revision: number; role: RoomRole; state: 'waiting' | 'memorizing' | 'recalling' | 'round_result' | 'completed' | 'cancelled';
    phase: string; gameName: string; rules: { mode: string; gameLevel: number | null; totalItems: number; memorizeLimitSec: number; recallLimitSec: number };
    roundCount: number; roundIndex: number; parentReady: boolean; childJoined: boolean; childReady: boolean; serverNow: string;
    round: null | { memorizeEndsAt: string; recallEndsAt: string; items?: RoomItem[]; recallOptions?: RoomItem[];
        myAnswers?: (string | null)[]; result?: { outcome: RoomRole | 'draw'; parent: { correct: number | null; total: number; usedMs: number | null }; child: { correct: number | null; total: number; usedMs: number | null }; expected: RoomItem[] } };
    scores: Record<RoomRole, { wins: number; losses: number; draws: number; points: number; rank: number }>;
};
export type FamilyGame = { gameName: string; levels: { level: number; itemCount: number }[]; customItems: { min: number; max: number } | null;
    memorizeSecOptions: number[]; defaultMemorizeSec: number; recallSec: number; customTimeRange?: { min: number; max: number }; player: { unlockedLevel: number } };
export type CreateFamilyRoom = { gameName: string; roundCount: number; memorizeSec: number } & (
    { mode: 'level'; gameLevel: number } | { mode: 'custom'; itemCount: number; recallSec?: number }
);
const data = <T>(promise: Promise<ApiSuccessResponse<T>>) => promise.then((response) => response.data);
const post = (url: string, body?: unknown) => data(apiClient.post(url, body) as unknown as Promise<ApiSuccessResponse<RoomView>>);
export const roomsApi = {
    games: () => data(apiClient.get('/parent/games') as unknown as Promise<ApiSuccessResponse<{ games: FamilyGame[] }>>),
    create: (body: CreateFamilyRoom) => post('/family-rooms', body),
    get: (code: string) => data(apiClient.get(`/family-rooms/${encodeURIComponent(code)}`) as unknown as Promise<ApiSuccessResponse<RoomView>>),
    join: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/join`),
    ready: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/ready`),
    start: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/start`),
    recall: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/recall`),
    submit: (code: string, answers: (string | null)[]) => post(`/family-rooms/${encodeURIComponent(code)}/submit`, { answers }),
    next: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/next`),
    finish: (code: string) => post(`/family-rooms/${encodeURIComponent(code)}/finish`),
    points: () => data(apiClient.get('/family-rooms/points') as unknown as Promise<ApiSuccessResponse<{ points: number; sessions: { roomId: string; points: number; earnedAt: string }[] }>>),
};
