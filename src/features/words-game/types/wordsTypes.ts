export type SupportedLanguageCode = "vi" | "en" | "fr" | "ja" | "ko" | "zh" | "ru";

export interface LanguageOption {
  code: SupportedLanguageCode;
  label: string;
  nativeName: string;
}

export interface WordsPreferences {
  language: SupportedLanguageCode;
  groups: number;       // 1, 2 hoặc 3 từ mỗi lần xem
  hideTimer: boolean;   // Ẩn đồng hồ đếm ngược lúc nhớ
  prepTime: number;     // 0 (Không), 3, 5, 10 giây chuẩn bị
}

export type WordsGamePhase = "settings" | "prep" | "memorize" | "recall" | "result";

