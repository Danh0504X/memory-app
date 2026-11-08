import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  gamesApi,
  type CompletedRound,
  type RoundRules,
  type StartedRound,
} from "@/features/shared-game/api/games.api";
import { synchronizeRoundCompletion } from "@/features/shared-game/completion";
import { clientDeadline } from "@/features/shared-game/utils/deadline";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  describeRoundError,
  isRoundClosed,
} from "@/features/shared-game/utils/roundErrors";
import type {
  WordsGamePhase,
  WordsPreferences,
  SupportedLanguageCode,
} from "../types/wordsTypes";

type PendingAction = "start" | "recall" | "submit" | null;

interface StartOptions {
  memorizeSec?: number;
  gameLevel?: number;
  customWordCount?: number | null;
  language?: SupportedLanguageCode;
}

interface WordsGameState {
  preferences: WordsPreferences;
  memorizeTime: number;
  selectedLevel: number | null;

  phase: WordsGamePhase;
  sessionId: string | null;
  rules: RoundRules | null;
  level: number | null;
  wordsToMemorize: string[];
  currentMemorizeIndex: number;
  userAnswers: Record<number, string>;
  phaseDeadline: number | null;
  result: CompletedRound | null;
  pending: PendingAction;
  error: string | null;

  setPreferences: (preferences: WordsPreferences) => void;
  setMemorizeTime: (time: number) => void;
  setSelectedLevel: (level: number | null) => void;
  startGame: (options?: StartOptions) => Promise<void>;
  loadRound: (session: StartedRound) => void;
  beginMemorization: () => void;
  nextMemorizeWord: () => void;
  prevMemorizeWord: () => void;
  jumpMemorize: (index: number) => void;
  finishMemorize: () => Promise<void>;
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

const EMPTY_ROUND = {
  phase: "settings" as WordsGamePhase,
  sessionId: null,
  rules: null,
  level: null,
  wordsToMemorize: [],
  currentMemorizeIndex: 0,
  userAnswers: {},
  phaseDeadline: null,
  result: null,
  pending: null,
};

let generation = 0;

export const useWordsGameStore = create<WordsGameState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      memorizeTime: 60,
      selectedLevel: null,
      ...EMPTY_ROUND,
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
        if (get().pending) return;
        const requestId = ++generation;
        set({ pending: "start", error: null });

        const { preferences, memorizeTime, selectedLevel } = get();
        const targetMemorizeSec = options?.memorizeSec ?? memorizeTime ?? 60;
        const targetLevel = options?.gameLevel ?? selectedLevel ?? 1;
        const customCount = options?.customWordCount ?? null;
        const language = options?.language ?? preferences.language ?? "vi";

        try {
          const { data } = await gamesApi.startRound({
            gameName: "word",
            memorizeSec: targetMemorizeSec,
            language,
            ...(customCount !== null
              ? { mode: "custom", itemCount: customCount }
              : { gameLevel: targetLevel }),
          });

          if (requestId === generation) {
            get().loadRound(data.session);
          }
        } catch (error) {
          if (requestId !== generation) return;
          set({ pending: null, error: describeRoundError(error, "start") });
        }
      },

      loadRound: (session: StartedRound) => {
        const words = session.items.map((item) => item.label || item.code);
        const deadline = clientDeadline(session.memorizeDeadline, session.serverNow);
        const { preferences } = get();

        if (preferences.prepTime > 0) {
          set({
            ...EMPTY_ROUND,
            error: null,
            phase: "prep",
            sessionId: session.sessionId,
            rules: session.rules,
            level: session.rules.gameLevel,
            wordsToMemorize: words,
            userAnswers: {},
            phaseDeadline: Date.now() + preferences.prepTime * 1000,
          });
        } else {
          set({
            ...EMPTY_ROUND,
            error: null,
            phase: "memorize",
            sessionId: session.sessionId,
            rules: session.rules,
            level: session.rules.gameLevel,
            wordsToMemorize: words,
            userAnswers: {},
            phaseDeadline: deadline,
          });
        }
      },

      beginMemorization: () => {
        const { rules, phase } = get();
        if (phase !== "prep") return;
        const memorizeLimitSec = rules?.memorizeLimitSec || 60;
        set({
          phase: "memorize",
          phaseDeadline: Date.now() + memorizeLimitSec * 1000,
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

      finishMemorize: async () => {
        const { sessionId, pending, phase } = get();
        if (!sessionId || pending || (phase !== "memorize" && phase !== "prep")) return;
        set({ pending: "recall", error: null });

        try {
          const { data } = await gamesApi.startRecall(sessionId);
          if (get().sessionId !== sessionId) return;

          set({
            phase: "recall",
            phaseDeadline: clientDeadline(data.session.recallDeadline, data.session.serverNow),
            pending: null,
          });
        } catch (error) {
          if (get().sessionId !== sessionId) return;
          const message = describeRoundError(error, "recall");
          set(
            isRoundClosed(error)
              ? { ...EMPTY_ROUND, error: message }
              : { pending: null, error: message }
          );
        }
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
        const { sessionId, pending, phase, wordsToMemorize, userAnswers } = get();
        if (!sessionId || pending || phase !== "recall") return;
        set({ pending: "submit", error: null });

        try {
          const answers = wordsToMemorize.map((_, i) => userAnswers[i]?.trim() || null);
          const { data } = await gamesApi.submitRound(sessionId, answers);
          if (get().sessionId !== sessionId) return;

          set({
            phase: "result",
            result: data.session,
            phaseDeadline: null,
            pending: null,
          });

          synchronizeRoundCompletion(data.session.sessionId);
        } catch (error) {
          if (get().sessionId !== sessionId) return;
          const message = describeRoundError(error, "submit");
          set(
            isRoundClosed(error)
              ? { ...EMPTY_ROUND, error: message }
              : { pending: null, error: message }
          );
        }
      },

      resetGame: () => {
        generation++;
        set({ ...EMPTY_ROUND, error: null });
      },
    }),
    {
      name: "memio_words_game_storage",
      partialize: (state) => ({
        preferences: state.preferences,
        memorizeTime: state.memorizeTime,
      }),
    }
  )
);

useAuthStore.subscribe((state, previous) => {
  if (state.user?._id !== previous.user?._id) {
    useWordsGameStore.getState().resetGame();
  }
});
