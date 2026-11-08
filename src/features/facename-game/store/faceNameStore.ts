import { create } from "zustand";
import type {
  GamePhase,
  GameStats,
  LevelConfig,
  Person,
  RoundSubmissionResult,
} from "../types";
import {
  fetchLevels,
  startLevelRound,
  startFreeRound,
  submitFaceNameRound,
} from "../api/faceNameApi";
import { preloadImages } from "../utils/preloadImages";

const STATS_STORAGE_KEY = "facename_trainer_stats_v1";

const getStoredStats = (): GameStats => {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        unlockedLevel: parsed.unlockedLevel || 1,
        bestScores: parsed.bestScores || {},
        totalRounds: parsed.totalRounds || 0,
        totalAccuracies: parsed.totalAccuracies || [],
        completedLevels: parsed.completedLevels || [],
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return {
    unlockedLevel: 1,
    bestScores: {},
    totalRounds: 0,
    totalAccuracies: [],
    completedLevels: [],
  };
};

const saveStats = (stats: GameStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore quota/storage errors
  }
};

const shuffleArray = <T>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = temp;
  }
  return copy;
};

interface FaceNameState {
  phase: GamePhase;
  levels: LevelConfig[];
  stats: GameStats;

  currentRoundId: string | null;
  currentMode: "level" | "free";
  currentLevelId: number | null;
  settings: {
    faceCount: number;
    memorizeSeconds: number;
    recallSeconds: number;
  };
  memorizePeople: Person[];
  recallPeople: Person[];
  userAnswers: Record<number, string>;

  // Timers and deadlines
  memorizeDeadline: number | null;
  recallDeadline: number | null;
  roundStartTime: number | null;

  result: RoundSubmissionResult | null;
  isSubmitting: boolean;
  isLoading: boolean;
  errorMessage: string | null;

  // Actions
  initialize: () => Promise<void>;
  setPhase: (phase: GamePhase) => void;
  startLevelGame: (levelId: number) => Promise<void>;
  startFreeGame: (
    faceCount: number,
    memorizeSeconds: number,
    recallSeconds: number,
  ) => Promise<void>;
  finishMemorize: () => void;
  updateAnswer: (personId: number, answer: string) => void;
  submitCurrentRound: () => Promise<void>;
  retryCurrentRound: () => Promise<void>;
  goToNextLevel: () => Promise<void>;
  goHome: () => void;
  clearError: () => void;
}

export const useFaceNameStore = create<FaceNameState>((set, get) => ({
  phase: "home",
  levels: [],
  stats: getStoredStats(),

  currentRoundId: null,
  currentMode: "level",
  currentLevelId: 1,
  settings: {
    faceCount: 5,
    memorizeSeconds: 60,
    recallSeconds: 120,
  },
  memorizePeople: [],
  recallPeople: [],
  userAnswers: {},

  memorizeDeadline: null,
  recallDeadline: null,
  roundStartTime: null,

  result: null,
  isSubmitting: false,
  isLoading: false,
  errorMessage: null,

  initialize: async () => {
    try {
      const levels = await fetchLevels();
      set({ levels, stats: getStoredStats() });
    } catch {
      // Fallback default levels if offline/network error
      set({
        levels: [
          {
            levelId: 1,
            faceCount: 5,
            memorizeSeconds: 60,
            recallSeconds: 120,
            nameType: "Tên phổ biến",
            unlockThreshold: 0.7,
          },
          {
            levelId: 2,
            faceCount: 8,
            memorizeSeconds: 60,
            recallSeconds: 150,
            nameType: "Tên phổ biến",
            unlockThreshold: 0.7,
          },
          {
            levelId: 3,
            faceCount: 12,
            memorizeSeconds: 60,
            recallSeconds: 180,
            nameType: "Tên đa dạng",
            unlockThreshold: 0.7,
          },
          {
            levelId: 4,
            faceCount: 20,
            memorizeSeconds: 60,
            recallSeconds: 240,
            nameType: "Tên quốc tế",
            unlockThreshold: 0.7,
          },
          {
            levelId: 5,
            faceCount: 30,
            memorizeSeconds: 60,
            recallSeconds: 240,
            nameType: "Tên quốc tế dễ nhầm lẫn",
            unlockThreshold: 0.7,
          },
        ],
      });
    }
  },

  setPhase: (phase) => set({ phase, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  startLevelGame: async (levelId: number) => {
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startLevelRound(levelId);
      const imageUrls = data.people.map((p) => p.imageUrl);

      // Preload all face images before starting memorize countdown
      await preloadImages(imageUrls);

      const now = Date.now();
      set({
        isLoading: false,
        currentRoundId: data.roundId,
        currentMode: "level",
        currentLevelId: levelId,
        settings: data.settings,
        memorizePeople: data.people,
        recallPeople: [],
        userAnswers: {},
        roundStartTime: now,
        memorizeDeadline: now + data.settings.memorizeSeconds * 1000,
        recallDeadline: null,
        result: null,
        isSubmitting: false,
        phase: "memorize",
      });
    } catch (err: any) {
      set({
        isLoading: false,
        phase: "home",
        errorMessage: err?.message || "Không thể khởi tạo ván chơi. Vui lòng thử lại.",
      });
    }
  },

  startFreeGame: async (
    faceCount: number,
    memorizeSeconds: number,
    recallSeconds: number,
  ) => {
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startFreeRound(faceCount, memorizeSeconds, recallSeconds);
      const imageUrls = data.people.map((p) => p.imageUrl);

      // Preload all face images before starting memorize countdown
      await preloadImages(imageUrls);

      const now = Date.now();
      set({
        isLoading: false,
        currentRoundId: data.roundId,
        currentMode: "free",
        currentLevelId: null,
        settings: data.settings,
        memorizePeople: data.people,
        recallPeople: [],
        userAnswers: {},
        roundStartTime: now,
        memorizeDeadline: now + data.settings.memorizeSeconds * 1000,
        recallDeadline: null,
        result: null,
        isSubmitting: false,
        phase: "memorize",
      });
    } catch (err: any) {
      set({
        isLoading: false,
        phase: "home",
        errorMessage: err?.message || "Không thể khởi tạo ván tự do. Vui lòng kiểm tra lại thiết lập.",
      });
    }
  },

  finishMemorize: () => {
    const { memorizePeople, settings, phase } = get();
    if (phase !== "memorize") return;

    // Shuffle the faces for recall phase, keeping each face's id and image
    const shuffled = shuffleArray(memorizePeople);
    const now = Date.now();

    set({
      recallPeople: shuffled,
      memorizeDeadline: null,
      recallDeadline: now + settings.recallSeconds * 1000,
      phase: "recall",
    });
  },

  updateAnswer: (personId: number, answer: string) => {
    set((state) => ({
      userAnswers: {
        ...state.userAnswers,
        [personId]: answer,
      },
    }));
  },

  submitCurrentRound: async () => {
    const { currentRoundId, userAnswers, memorizePeople, roundStartTime, isSubmitting, phase } = get();
    if (isSubmitting || phase !== "recall" || !currentRoundId) return;

    set({ isSubmitting: true, phase: "submitting" });

    try {
      // Build answers array for all people in the round
      const answersList = memorizePeople.map((p) => ({
        personId: p.id,
        answer: userAnswers[p.id] || "",
      }));

      const timeUsedSeconds = roundStartTime ? Math.round((Date.now() - roundStartTime) / 1000) : 0;

      const result = await submitFaceNameRound(currentRoundId, answersList, timeUsedSeconds);

      // Update stats and localStorage
      const prevStats = get().stats;
      const newAccuracies = [...prevStats.totalAccuracies, result.accuracy];
      const newTotalRounds = prevStats.totalRounds + 1;
      let newUnlockedLevel = prevStats.unlockedLevel;
      const newBestScores = { ...prevStats.bestScores };
      const newCompletedLevels = [...prevStats.completedLevels];

      if (result.mode === "level" && result.levelId) {
        const currentBest = newBestScores[result.levelId] ?? -999;
        newBestScores[result.levelId] = Math.max(currentBest, result.score);

        if (result.isPassed) {
          if (!newCompletedLevels.includes(result.levelId)) {
            newCompletedLevels.push(result.levelId);
          }
          if (result.levelId >= newUnlockedLevel && result.levelId < 5) {
            newUnlockedLevel = result.levelId + 1;
          }
        }
      }

      const updatedStats: GameStats = {
        unlockedLevel: newUnlockedLevel,
        bestScores: newBestScores,
        totalRounds: newTotalRounds,
        totalAccuracies: newAccuracies,
        completedLevels: newCompletedLevels,
      };

      saveStats(updatedStats);

      set({
        result,
        stats: updatedStats,
        isSubmitting: false,
        phase: "result",
      });
    } catch (err: any) {
      set({
        isSubmitting: false,
        phase: "recall",
        errorMessage: err?.message || "Lỗi khi nộp bài. Vui lòng thử lại.",
      });
    }
  },

  retryCurrentRound: async () => {
    const { currentMode, currentLevelId, settings, startLevelGame, startFreeGame } = get();
    if (currentMode === "level" && currentLevelId) {
      await startLevelGame(currentLevelId);
    } else {
      await startFreeGame(settings.faceCount, settings.memorizeSeconds, settings.recallSeconds);
    }
  },

  goToNextLevel: async () => {
    const { currentLevelId, startLevelGame } = get();
    if (currentLevelId && currentLevelId < 5) {
      await startLevelGame(currentLevelId + 1);
    }
  },

  goHome: () => {
    set({
      phase: "home",
      result: null,
      memorizePeople: [],
      recallPeople: [],
      userAnswers: {},
      currentRoundId: null,
      memorizeDeadline: null,
      recallDeadline: null,
      errorMessage: null,
    });
  },
}));

