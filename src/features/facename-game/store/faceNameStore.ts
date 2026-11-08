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
    set({ isLoading: true, errorMessage: null });
    try {
      const levels = await fetchLevels();
      set({ levels, stats: getStoredStats(), isLoading: false });
    } catch {
      set({ isLoading: false, errorMessage: "Không thể tải cấp độ. Kiểm tra kết nối rồi thử lại." });
    }
  },

  setPhase: (phase) => set({ phase, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  startLevelGame: async (levelId: number) => {
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startLevelRound(levelId);
      const imageUrls = data.people.map((p) => p.imageUrl);

      const now = Date.now();
      await preloadImages(imageUrls);

      const memSec = data.settings.memorizeSeconds;
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
    } catch (err: unknown) {
      set({
        isLoading: false,
        phase: "home",
        errorMessage: (err && typeof err === "object" && "message" in err ? String(err.message) : "") || "Không thể khởi tạo ván chơi. Vui lòng thử lại.",
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

      const now = Date.now();
      await preloadImages(imageUrls);

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
    } catch (err: unknown) {
      set({
        isLoading: false,
        phase: "home",
        errorMessage: (err && typeof err === "object" && "message" in err ? String(err.message) : "") || "Không thể khởi tạo ván tự do. Vui lòng kiểm tra lại thiết lập.",
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
    } catch (err: unknown) {
      set({
        isSubmitting: false,
        phase: "recall",
        errorMessage: (err && typeof err === "object" && "message" in err ? String(err.message) : "") || "Lỗi khi nộp bài. Vui lòng thử lại.",
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

