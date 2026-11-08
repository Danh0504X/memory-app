import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createWordsSession,
  submitWordsSession,
  type CreateWordsSessionParams,
} from "../api/wordsApi";
import type {
  WordsGamePhase,
  WordsPreferences,
  WordsSession,
  WordsSessionResult,
} from "../types/wordsTypes";

type PendingAction = "start" | "recall" | "submit" | null;

interface StartOptions {
  memorizeSec: number;
  gameLevel: number;
}

interface WordsGameState {
  preferences: WordsPreferences;
  memorizeTime: number;
  selectedLevel: number | null;
  unlockedLevel: number;

  phase: WordsGamePhase;
  session: WordsSession | null;
  wordsToMemorize: string[];
  currentMemorizeIndex: number;
  userAnswers: Record<number, string>;
  phaseDeadline: number | null;
  result: WordsSessionResult | null;
  pending: PendingAction;
  error: string | null;

  setPreferences: (preferences: WordsPreferences) => void;
  setMemorizeTime: (time: number) => void;
  setSelectedLevel: (level: number | null) => void;
  startGame: (options?: StartOptions) => Promise<void>;
  beginMemorization: () => void;
  nextMemorizeWord: () => void;
  prevMemorizeWord: () => void;
  jumpMemorize: (index: number) => void;
  finishMemorize: () => void;
  setAnswer: (index: number, answer: string) => void;
  finishGame: () => Promise<void>;
  resetGame: () => void;
}

const DEFAULT_PREFERENCES: WordsPreferences = {
  language: "vi",
  groups: 1,
  hideTimer: false,
  prepTime: 0,
};

const deadlineIn = (seconds: number) => Date.now() + seconds * 1000;

export const useWordsGameStore = create<WordsGameState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      memorizeTime: 60,
      selectedLevel: null,
      unlockedLevel: 1,

      phase: "settings",
      session: null,
      wordsToMemorize: [],
      currentMemorizeIndex: 0,
      userAnswers: {},
      phaseDeadline: null,
      result: null,
      pending: null,
      error: null,

      setPreferences: (preferences) =>
        set({
          preferences: {
            ...preferences,
            groups: Math.max(1, Math.min(3, Math.round(preferences.groups || 1))),
          },
        }),

      setMemorizeTime: (time) => set({ memorizeTime: time }),
      setSelectedLevel: (level) => set({ selectedLevel: level }),

      startGame: async (options) => {
        const { preferences, memorizeTime, unlockedLevel, selectedLevel, pending } = get();
        if (pending !== null) return;

        set({ pending: "start", error: null });

        const targetLevel = options?.gameLevel ?? selectedLevel ?? unlockedLevel ?? 1;
        const targetMemorizeSec = options?.memorizeSec ?? memorizeTime ?? 60;

        try {
          const params: CreateWordsSessionParams = {
            level: targetLevel,
            language: preferences.language,
            memorizeSec: targetMemorizeSec,
            groups: preferences.groups,
            prepTime: preferences.prepTime,
          };

          const session = await createWordsSession(params);
          if (!session || !Array.isArray(session.words) || session.words.length === 0) {
            throw new Error("Không nhận được danh sách từ hợp lệ từ máy chủ.");
          }

          // Nếu có thời gian chuẩn bị (prepTime > 0), chuyển sang màn prep trước
          if (preferences.prepTime > 0) {
            set({
              session,
              wordsToMemorize: session.words,
              currentMemorizeIndex: 0,
              userAnswers: {},
              result: null,
              phase: "prep",
              phaseDeadline: deadlineIn(preferences.prepTime),
              pending: null,
            });
          } else {
            set({
              session,
              wordsToMemorize: session.words,
              currentMemorizeIndex: 0,
              userAnswers: {},
              result: null,
              phase: "memorize",
              phaseDeadline: deadlineIn(session.memorizeSec),
              pending: null,
            });
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Không thể tạo ván chơi mới";
          set({ error: msg, pending: null });
        }
      },

      beginMemorization: () => {
        const { session } = get();
        if (!session) return;
        set({
          phase: "memorize",
          phaseDeadline: deadlineIn(session.memorizeSec),
        });
      },

      nextMemorizeWord: () => {
        const { currentMemorizeIndex, wordsToMemorize, preferences } = get();
        const step = Math.max(1, preferences.groups || 1);
        if (currentMemorizeIndex + step < wordsToMemorize.length) {
          set({ currentMemorizeIndex: currentMemorizeIndex + step });
        }
      },

      prevMemorizeWord: () => {
        const { currentMemorizeIndex, preferences } = get();
        const step = Math.max(1, preferences.groups || 1);
        set({ currentMemorizeIndex: Math.max(0, currentMemorizeIndex - step) });
      },

      jumpMemorize: (index) => {
        const { wordsToMemorize } = get();
        if (index >= 0 && index < wordsToMemorize.length) {
          set({ currentMemorizeIndex: index });
        }
      },

      finishMemorize: () => {
        const { session, phase } = get();
        if (phase !== "memorize" && phase !== "prep") return;
        const recallSec = session?.recallSec || 240;

        set({
          phase: "recall",
          phaseDeadline: deadlineIn(recallSec),
        });
      },

      setAnswer: (index, answer) => {
        const { userAnswers } = get();
        set({
          userAnswers: {
            ...userAnswers,
            [index]: answer,
          },
        });
      },

      finishGame: async () => {
        const { session, userAnswers, phaseDeadline, pending, unlockedLevel } = get();
        if (!session || pending !== null) return;

        set({ pending: "submit", error: null });

        const timeSpent = phaseDeadline
          ? Math.max(1, session.recallSec - Math.max(0, Math.round((phaseDeadline - Date.now()) / 1000)))
          : session.recallSec;

        const answersList = session.words.map((_, i) => userAnswers[i] ?? null);

        try {
          const result = await submitWordsSession(session.sessionId, {
            answers: answersList,
            timeSpent,
          });

          if (!result || typeof result.score !== "number") {
            throw new Error("Không nhận được kết quả chấm bài từ máy chủ.");
          }

          // Cập nhật cấp độ mở khóa nếu người chơi vượt qua level hiện tại
          let newUnlocked = unlockedLevel;
          if (result.passed && result.unlockedNextLevel && result.unlockedNextLevel > unlockedLevel) {
            newUnlocked = result.unlockedNextLevel;
          }

          set({
            result,
            unlockedLevel: newUnlocked,
            phase: "result",
            phaseDeadline: null,
            pending: null,
          });
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : typeof err === "object" && err !== null && "message" in err
              ? String((err as { message?: unknown }).message)
              : "Lỗi khi chấm bài thi";
          set({ error: msg, pending: null });
        }
      },

      resetGame: () =>
        set({
          phase: "settings",
          session: null,
          wordsToMemorize: [],
          currentMemorizeIndex: 0,
          userAnswers: {},
          phaseDeadline: null,
          result: null,
          pending: null,
          error: null,
        }),
    }),
    {
      name: "memio_words_game_storage",
      partialize: (state) => ({
        preferences: state.preferences,
        memorizeTime: state.memorizeTime,
        unlockedLevel: state.unlockedLevel,
      }),
    }
  )
);

