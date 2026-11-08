export interface Person {
  id: number;
  name: string;
  imageUrl: string;
}

export interface LevelConfig {
  levelId: number;
  faceCount: number;
  memorizeSeconds: number;
  recallSeconds: number;
  nameType: string;
  unlockThreshold: number;
}

export interface AnswerResultItem {
  personId: number;
  name: string;
  answer: string;
  isCorrect: boolean;
  isBlank: boolean;
}

export interface RoundSubmissionResult {
  roundId: string;
  mode: "level" | "free";
  levelId?: number;
  score: number;
  maxScore: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  blankCount: number;
  isPassed: boolean;
  timeUsedSeconds: number;
  nextLevelUnlocked: boolean;
  results: AnswerResultItem[];
}

export interface GameStats {
  unlockedLevel: number;
  bestScores: Record<number, number>;
  totalRounds: number;
  totalAccuracies: number[];
  completedLevels: number[];
}

export type GamePhase =
  | "home"
  | "level-select"
  | "free-config"
  | "loading-faces"
  | "memorize"
  | "recall"
  | "submitting"
  | "result";

