import type { LanguageOption } from "../types/wordsTypes";

// Ván chơi đi qua API dùng chung /api/game-sessions (store gọi gamesApi với gameName "word").
// Danh sách ngôn ngữ khớp backend (config/wordsRules.ts: SUPPORTED_LANGUAGES).
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Tiếng Việt", nativeName: "Tiếng Việt" },
  { code: "en", label: "English", nativeName: "English" },
  { code: "fr", label: "French", nativeName: "Français" },
  { code: "ja", label: "Japanese", nativeName: "日本語" },
  { code: "ko", label: "Korean", nativeName: "한국어" },
  { code: "zh", label: "Chinese", nativeName: "中文" },
  { code: "ru", label: "Russian", nativeName: "Русский" },
];
