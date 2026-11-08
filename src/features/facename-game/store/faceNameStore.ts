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
  selectedLevel: number | null;
  memorizeTime: number;
  currentMemorizeIndex: number;
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
  setMemorizeTime: (sec: number) => void;
  setSelectedLevel: (level: number | null) => void;
  nextMemorizePerson: () => void;
  prevMemorizePerson: () => void;
  setMemorizeIndex: (index: number) => void;
  startLevelGame: (levelId: number, customMemorizeSec?: number) => Promise<void>;
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
  selectedLevel: null,
  memorizeTime: 60,
  currentMemorizeIndex: 0,
  settings: {
    faceCount: 6,
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

  setMemorizeTime: (sec) => set({ memorizeTime: sec }),
  setSelectedLevel: (level) => set({ selectedLevel: level }),
  setMemorizeIndex: (index) => set({ currentMemorizeIndex: index }),
  nextMemorizePerson: () => {
    const { currentMemorizeIndex, memorizePeople } = get();
    if (currentMemorizeIndex < memorizePeople.length - 1) {
      set({ currentMemorizeIndex: currentMemorizeIndex + 1 });
    }
  },
  prevMemorizePerson: () => {
    const { currentMemorizeIndex } = get();
    if (currentMemorizeIndex > 0) {
      set({ currentMemorizeIndex: currentMemorizeIndex - 1 });
    }
  },

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
            faceCount: 6,
            memorizeSeconds: 60,
            recallSeconds: 120,
            nameType: "Tên phổ biến",
            unlockThreshold: 4 / 6,
          },
          {
            levelId: 2,
            faceCount: 8,
            memorizeSeconds: 60,
            recallSeconds: 150,
            nameType: "Tên phổ biến",
            unlockThreshold: 6 / 8,
          },
          {
            levelId: 3,
            faceCount: 10,
            memorizeSeconds: 60,
            recallSeconds: 180,
            nameType: "Tên đa dạng (Việt + Quốc tế)",
            unlockThreshold: 7 / 10,
          },
          {
            levelId: 4,
            faceCount: 12,
            memorizeSeconds: 60,
            recallSeconds: 180,
            nameType: "Tên đa dạng (Việt + Quốc tế)",
            unlockThreshold: 8 / 12,
          },
          {
            levelId: 5,
            faceCount: 14,
            memorizeSeconds: 60,
            recallSeconds: 210,
            nameType: "Tên quốc tế",
            unlockThreshold: 10 / 14,
          },
          {
            levelId: 6,
            faceCount: 16,
            memorizeSeconds: 60,
            recallSeconds: 210,
            nameType: "Tên quốc tế phong phú",
            unlockThreshold: 11 / 16,
          },
          {
            levelId: 7,
            faceCount: 18,
            memorizeSeconds: 60,
            recallSeconds: 240,
            nameType: "Tên quốc tế phong phú",
            unlockThreshold: 12 / 18,
          },
          {
            levelId: 8,
            faceCount: 22,
            memorizeSeconds: 60,
            recallSeconds: 240,
            nameType: "Tên quốc tế thử thách",
            unlockThreshold: 15 / 22,
          },
          {
            levelId: 9,
            faceCount: 26,
            memorizeSeconds: 60,
            recallSeconds: 270,
            nameType: "Tên quốc tế dễ nhầm lẫn",
            unlockThreshold: 18 / 26,
          },
          {
            levelId: 10,
            faceCount: 30,
            memorizeSeconds: 60,
            recallSeconds: 300,
            nameType: "Tên quốc tế dễ nhầm lẫn",
            unlockThreshold: 20 / 30,
          },
        ],
      });
    }
  },

  setPhase: (phase) => set({ phase, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  startLevelGame: async (levelId: number, customMemorizeSec?: number) => {
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startLevelRound(levelId);
      const imageUrls = data.people.map((p) => p.imageUrl);

      // Preload all face images before starting memorize countdown
      await preloadImages(imageUrls);

      const now = Date.now();
      const memSec = customMemorizeSec ?? data.settings.memorizeSeconds;
      set({
        isLoading: false,
        currentRoundId: data.roundId,
        currentMode: "level",
        currentLevelId: levelId,
        currentMemorizeIndex: 0,
        settings: {
          ...data.settings,
          memorizeSeconds: memSec,
        },
        memorizePeople: data.people,
        recallPeople: [],
        userAnswers: {},
        roundStartTime: now,
        memorizeDeadline: now + memSec * 1000,
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
          if (result.levelId >= newUnlockedLevel && result.levelId < 10) {
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
    if (currentLevelId && currentLevelId < 10) {
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

