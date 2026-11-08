import type { CompletedRound, StartedRound, RecallRound, ItemView, RoundRules } from "@/features/shared-game/api/games.api";

export type { CompletedRound, StartedRound, RecallRound, ItemView, RoundRules };

export type SupportedLanguageCode = "vi" | "en" | "fr" | "ja" | "ko" | "zh" | "ru";

export interface WordLevelConfig {
  level: number;
  itemCount: number;
  requiredScore: number;
  memorizeSeconds: number;
  recallSeconds: number;
  unlockThreshold: number;
}

export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
  nativeName: string;
}

export interface WordsPreferences {
  language: SupportedLanguageCode;
  groups: number;       // 1, 2 hoặc 3 từ mỗi lần xem
  hideTimer: boolean;   // Ẩn đồng hồ đếm ngược lúc nhớ
  prepTime: number;     // 0 (Không), 3, 5, 10 giây chuẩn bị
}

export interface WordsSession {
  sessionId: string;
  level: number;
  language: SupportedLanguageCode;
  words: string[];
  totalWords: number;
  requiredScore: number;
  memorizeSec: number;
  recallSec: number;
  groups: number;
  prepTime: number;
  expiresAt: number;
}

export interface WordItemReview {
  index: number;
  expected: string;
  answer: string | null;
  correct: boolean;
}

export interface WordsSessionResult {
  sessionId: string;
  level: number;
  language: SupportedLanguageCode;
  score: number;
  totalWords: number;
  requiredScore: number;
  passed: boolean;
  accuracy: number;
  timeSpent: number;
  unlockedNextLevel: number | null;
  review: WordItemReview[];
}

export type WordsGamePhase = "settings" | "prep" | "memorize" | "recall" | "result";

