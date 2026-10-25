import type { WordItem, WordLanguage } from "../types/wordTypes";
import viWords from "../data/words/vi.json";
import enWords from "../data/words/en.json";
import koWords from "../data/words/ko.json";
import jaWords from "../data/words/ja.json";
import zhWords from "../data/words/zh.json";
import thWords from "../data/words/th.json";

// Bản đồ từ điển đa ngôn ngữ (tách biệt hoàn toàn khỏi logic code)
export const LANGUAGE_WORD_BANKS: Record<WordLanguage, string[]> = {
    vi: viWords,
    en: enWords,
    ko: koWords,
    ja: jaWords,
    zh: zhWords,
    th: thWords,
};

// Cấu hình số từ xuất hiện theo từng cấp độ (chuẩn thi đấu Memory League)
export const WORDS_LEVEL_WORD_COUNTS: Record<number, number> = {
    1: 6,
    2: 10,
    3: 14,
    4: 18,
    5: 22,
    6: 26,
    7: 30,
    8: 35,
    9: 42,
    10: 50,
};

export const getWordCountForLevel = (level: number): number => {
    const safeLevel = Math.max(1, Math.min(10, level));
    return WORDS_LEVEL_WORD_COUNTS[safeLevel] ?? 6;
};

// Thuật toán xáo trộn Fisher-Yates để chọn ngẫu nhiên
export const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Hàm chọn ngẫu nhiên số lượng từ theo ngôn ngữ được chọn
export const generateWordsDeck = (count: number, language: WordLanguage = "vi"): WordItem[] => {
    const bank = LANGUAGE_WORD_BANKS[language] || LANGUAGE_WORD_BANKS.vi;
    if (!bank || bank.length === 0) return [];

    let pool: string[] = [];
    while (pool.length < count) {
        pool = pool.concat(shuffle(bank));
    }
    const selectedWords = pool.slice(0, count);

    return selectedWords.map((word, index) => ({
        id: `word-${index}-${word}`,
        word,
    }));
};
