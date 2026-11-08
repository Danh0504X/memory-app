import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/auth.types";

// Kiểu dữ liệu khớp với backend: GET /api/games và luồng /api/game-sessions.
// Ngày giờ trong JSON là chuỗi ISO.
import type { GameName } from "../registry";
export type { GameName } from "../registry";
// daily: ván thử thách ngày, chỉ tạo qua /api/daily-challenge/start
export type RoundMode = "level" | "custom" | "daily";
export type RoundResult = "perfect" | "pass" | "fail";
export type RecordKey = "bestLevel" | "fastestMemorize";

export interface GameCatalogItem {
  gameName: GameName;
  maxLevel: number;
  levels: { level: number; itemCount: number; recallSec?: number; requiredScore?: number }[];
  customItems: { min: number; max: number } | null; // null: game không có chế độ tự chọn
  memorizeSecOptions: number[];
  defaultMemorizeSec: number;
  recallSec: number;
  passAccuracy: number;
  unlockOn: "pass" | "perfect";
  wrongAnswerPenalty?: number;
  customTimeRange?: { min: number; max: number };
  // null với khách chưa chơi ván nào; khách đã chơi chỉ có level đã mở (giữ tạm), bestLevel luôn null
  player: {
    unlockedLevel: number;
    bestLevel: number | null;
    played: number;
  } | null;
}

// Một item (lá bài hoặc hình) như backend gửi xuống; backend chỉ lưu code
export interface ItemView {
  code: string;
  imageUrl?: string;
  label?: string;
}

export interface RoundRules {
  mode: RoundMode;
  gameLevel: number | null; // null với ván tự chọn số lượng
  totalItems: number;
  memorizeLimitSec: number;
  recallLimitSec: number;
  passAccuracy: number;
  requiredScore?: number;
  wrongAnswerPenalty?: number;
  language?: string;
}

interface RoundBase {
  sessionId: string;
  gameName: GameName;
  status: "memorizing" | "recalling" | "completed" | "expired";
  rules: RoundRules;
  serverNow?: string;
}

export interface StartedRound extends RoundBase {
  items: ItemView[];
  memorizeDeadline: string;
}

export interface RecallRound extends RoundBase {
  recallOptions: ItemView[];
  recallDeadline: string;
}

export interface RoundRewards {
  exp: {
    total: number;
    breakdown: {
      round: number;
      perfectBonus: number;
      firstGameOfDayBonus: number;
      newRecordBonus: number;
    };
  };
  newRecords: RecordKey[];
  unlockedLevel: { before: number; after: number };
  userLevel: { before: number; after: number };
  streak: { currentStreak: number; longestStreak: number };
}

export interface CompletedRound extends RoundBase {
  startedAt: string;
  completedAt: string;
  result: {
    score?: number;
    maxScore?: number;
    correctItems: number;
    totalItems: number;
    accuracy: number;
    result: RoundResult;
    memorizeSec: number;
    recallSec: number;
    perItem: {
      expected: ItemView;
      answer: ItemView | null;
      correct: boolean;
    }[];
  };
  rewards: RoundRewards | null; // null với ván của khách: không có EXP, kỷ lục hay streak
  unlockedLevel?: { before: number; after: number } | null;
}

export interface StartRoundRequest {
  gameName: GameName;
  mode?: RoundMode;
  // Bỏ trống: backend chọn level cao nhất đã mở. Chỉ chọn được level đã mở (chơi lại level cũ)
  gameLevel?: number;
  itemCount?: number; // Chỉ dùng khi mode = "custom"
  memorizeSec?: number;
  recallSec?: number;
  language?: string;
}

type SessionResponse<T> = ApiSuccessResponse<{ session: T }>;

export const gamesApi = {
  getCompletedRound: async (sessionId: string): Promise<CompletedRound> => {
    const response = await apiClient.get(`/game-sessions/${encodeURIComponent(sessionId)}`, {
      headers: { "Cache-Control": "no-cache" },
    }) as unknown as SessionResponse<CompletedRound>;
    const round = response.data.session;
    if (round.status !== "completed" || round.sessionId !== sessionId) {
      throw new Error("The completed result is not available yet");
    }
    return round;
  },
  // Luật chơi của từng game, kèm level đã mở nếu đã đăng nhập
  getGames: (): Promise<ApiSuccessResponse<{ games: GameCatalogItem[] }>> => {
    return apiClient.get("/games") as unknown as Promise<
      ApiSuccessResponse<{ games: GameCatalogItem[] }>
    >;
  },

  // Bước 1: backend chốt luật và sinh đề
  startRound: (
    body: StartRoundRequest,
  ): Promise<SessionResponse<StartedRound>> => {
    return apiClient.post("/game-sessions", body) as unknown as Promise<
      SessionResponse<StartedRound>
    >;
  },

  // Bước 2: chuyển sang nhớ lại, nhận các lựa chọn
  startRecall: (sessionId: string): Promise<SessionResponse<RecallRound>> => {
    return apiClient.post(
      `/game-sessions/${sessionId}/recall`,
    ) as unknown as Promise<SessionResponse<RecallRound>>;
  },

  // Bước 3: nộp bài theo vị trí (null là bỏ trống), nhận kết quả và phần thưởng
  submitRound: (
    sessionId: string,
    answers: (string | null)[],
  ): Promise<SessionResponse<CompletedRound>> => {
    return apiClient.post(`/game-sessions/${sessionId}/submit`, {
      answers,
    }) as unknown as Promise<SessionResponse<CompletedRound>>;
  },
};
