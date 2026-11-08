import { create } from "zustand";
import type {
  GamePhase,
  GameStats,
  LevelConfig,
  Person,
  RoundSubmissionResult,
} from "../types";
import {
  fetchFaceNameSetup,
  startFaceNameRecall,
  startLevelRound,
  startFreeRound,
  submitFaceNameRound,
} from "../api/faceNameApi";
import { preloadImages } from "../utils/preloadImages";
import { synchronizeRoundCompletion } from "../../shared-game/completion.ts";

const emptyStats = (): GameStats => ({ unlockedLevel: 1, bestScores: {}, totalRounds: 0, totalAccuracies: [], completedLevels: [] });
let requestGeneration = 0;

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
  finishMemorize: () => Promise<void>;
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
  stats: emptyStats(),

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
    const generation = ++requestGeneration;
    set({ isLoading: true, errorMessage: null, stats: emptyStats() });
    try {
      const { levels, stats } = await fetchFaceNameSetup();
      if (generation !== requestGeneration) return;
      set({ levels, stats, isLoading: false });
    } catch {
      if (generation !== requestGeneration) return;
      set({ isLoading: false, errorMessage: "Không thể tải cấp độ. Kiểm tra kết nối rồi thử lại." });
    }
  },

  setPhase: (phase) => set({ phase, errorMessage: null }),

  clearError: () => set({ errorMessage: null }),

  startLevelGame: async (levelId: number) => {
    const generation = ++requestGeneration;
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startLevelRound(levelId);
      const imageUrls = data.people.map((p) => p.imageUrl);

      const now = Date.now();
      await preloadImages(imageUrls);
      if (generation !== requestGeneration) return;

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
        memorizeDeadline: Date.parse(data.memorizeDeadline),
        recallDeadline: null,
        result: null,
        isSubmitting: false,
        phase: "memorize",
      });
    } catch (err: unknown) {
      if (generation !== requestGeneration) return;
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
    const generation = ++requestGeneration;
    set({ isLoading: true, phase: "loading-faces", errorMessage: null });
    try {
      const data = await startFreeRound(faceCount, memorizeSeconds, recallSeconds);
      const imageUrls = data.people.map((p) => p.imageUrl);

      const now = Date.now();
      await preloadImages(imageUrls);
      if (generation !== requestGeneration) return;

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
        memorizeDeadline: Date.parse(data.memorizeDeadline),
        recallDeadline: null,
        result: null,
        isSubmitting: false,
        phase: "memorize",
      });
    } catch (err: unknown) {
      if (generation !== requestGeneration) return;
      set({
        isLoading: false,
        phase: "home",
        errorMessage: (err && typeof err === "object" && "message" in err ? String(err.message) : "") || "Không thể khởi tạo ván tự do. Vui lòng kiểm tra lại thiết lập.",
      });
    }
  },

  finishMemorize: async () => {
    const { memorizePeople, phase } = get();
    if (phase !== "memorize" || get().isLoading) return;

    const roundId = get().currentRoundId!;
    set({ isLoading: true, errorMessage: null });
    try {
      const recalled = await startFaceNameRecall(roundId);
      if (get().currentRoundId !== roundId) return;
      set({ recallPeople: shuffleArray(memorizePeople), memorizeDeadline: null,
        recallDeadline: Date.parse(recalled.recallDeadline), phase: "recall", isLoading: false });
    } catch {
      if (get().currentRoundId === roundId) set({ isLoading: false, errorMessage: "Không thể chuyển sang nhớ lại. Bấm Đã nhớ xong để thử lại." });
    }
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

      if (get().currentRoundId !== currentRoundId) return;
      synchronizeRoundCompletion(currentRoundId);
      // Display the result immediately; the next initialization reloads server progress.
      const prevStats = get().stats;
      const newAccuracies = [...prevStats.totalAccuracies, result.accuracy];
      const newTotalRounds = prevStats.totalRounds + 1;
      const newUnlockedLevel = result.unlockedLevel ?? prevStats.unlockedLevel;
      const newBestScores = { ...prevStats.bestScores };
      const newCompletedLevels = [...prevStats.completedLevels];

      if (result.mode === "level" && result.levelId) {
        const currentBest = newBestScores[result.levelId] ?? -999;
        newBestScores[result.levelId] = Math.max(currentBest, result.score);

        if (result.isPassed) {
          if (!newCompletedLevels.includes(result.levelId)) {
            newCompletedLevels.push(result.levelId);
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

      set({
        result,
        stats: updatedStats,
        isSubmitting: false,
        phase: "result", errorMessage: null,
      });
    } catch (err: unknown) {
      if (get().currentRoundId !== currentRoundId) return;
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
    requestGeneration++;
    set({
      isLoading: false,
      isSubmitting: false,
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

