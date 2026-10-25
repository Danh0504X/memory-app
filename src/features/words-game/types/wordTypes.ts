export type WordLanguage = "vi" | "en" | "ko" | "ja" | "zh" | "th";

export type GamePhase = "idle" | "memorize" | "recall" | "result";

export interface WordItem {
    id: string;
    word: string;
}

export interface WordPreferences {
    language: WordLanguage;
    groups: number; // 1, 2, 3...
    hideTimer: boolean;
    prepTime: number; // 0, 3, 5, 10, 20
}
