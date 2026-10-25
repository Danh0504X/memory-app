import { create } from "zustand";
import type { GamePhase, WordItem, WordPreferences } from "../types/wordTypes";
import { generateWordsDeck, getWordCountForLevel } from "../utils/wordUtils";

interface WordsGameState {
    phase: GamePhase;
    level: number;
    memorizeTime: number;
    recallTime: number;
    wordsToMemorize: WordItem[];
    userRecallWords: string[];
    currentMemorizeIndex: number;
    lastPlayTime: number;
    phaseDeadline: number | null;
    preferences: WordPreferences;

    setLevel: (level: number) => void;
    setMemorizeTime: (time: number) => void;
    setRecallTime: (time: number) => void;
    setPreferences: (prefs: Partial<WordPreferences>) => void;
    startGame: () => void;
    nextMemorizeWord: () => void;
    prevMemorizeWord: () => void;
    setMemorizeIndex: (index: number) => void;
    finishMemorize: () => void;
    updateUserWord: (index: number, value: string) => void;
    setUserRecallWords: (words: string[]) => void;
    finishGame: () => void;
    resetGame: () => void;
}

export const useWordsGameStore = create<WordsGameState>((set, get) => ({
    phase: "idle",
    level: 1,
    memorizeTime: 60,
    recallTime: 240, // 4 phút cho giai đoạn gõ từ
    wordsToMemorize: [],
    userRecallWords: [],
    currentMemorizeIndex: 0,
    lastPlayTime: 0,
    phaseDeadline: null,
    preferences: {
        language: "vi",
        groups: 1,
        hideTimer: false,
        prepTime: 5,
    },

    setLevel: (level) => set({ level: Math.max(1, level) }),
    setMemorizeTime: (time) => set({ memorizeTime: time }),
    setRecallTime: (time) => set({ recallTime: time }),
    setPreferences: (prefs) =>
        set((state) => ({
            preferences: { ...state.preferences, ...prefs },
        })),

    startGame: () => {
        const { level, memorizeTime, preferences } = get();
        const count = getWordCountForLevel(level);
        const selectedWords = generateWordsDeck(count, preferences.language);

        set({
            phase: "memorize",
            wordsToMemorize: selectedWords,
            userRecallWords: Array(count).fill(""),
            currentMemorizeIndex: 0,
            phaseDeadline: Date.now() + memorizeTime * 1000,
        });
    },

    nextMemorizeWord: () => {
        const { currentMemorizeIndex, wordsToMemorize, preferences } = get();
        const step = preferences.groups > 0 ? preferences.groups : 1;
        const nextIndex = Math.min(wordsToMemorize.length - 1, currentMemorizeIndex + step);
        set({ currentMemorizeIndex: nextIndex });
    },

    prevMemorizeWord: () => {
        const { currentMemorizeIndex, preferences } = get();
        const step = preferences.groups > 0 ? preferences.groups : 1;
        const prevIndex = Math.max(0, currentMemorizeIndex - step);
        set({ currentMemorizeIndex: prevIndex });
    },

    setMemorizeIndex: (index) => set({ currentMemorizeIndex: index }),

    finishMemorize: () => {
        const { recallTime } = get();
        set({
            phase: "recall",
            phaseDeadline: Date.now() + recallTime * 1000,
        });
    },

    updateUserWord: (index, value) => {
        const { userRecallWords } = get();
        const updated = [...userRecallWords];
        updated[index] = value;
        set({ userRecallWords: updated });
    },

    setUserRecallWords: (words) => set({ userRecallWords: words }),

    finishGame: () => {
        const { phaseDeadline, recallTime } = get();
        const remainingSeconds = phaseDeadline
            ? Math.max(0, Math.round((phaseDeadline - Date.now()) / 1000))
            : 0;
        const timeSpent = Math.max(1, recallTime - remainingSeconds);

        set({
            phase: "result",
            phaseDeadline: null,
            lastPlayTime: timeSpent,
        });
    },

    resetGame: () => set({
        phase: "idle",
        wordsToMemorize: [],
        userRecallWords: [],
        currentMemorizeIndex: 0,
        phaseDeadline: null,
    }),
}));
