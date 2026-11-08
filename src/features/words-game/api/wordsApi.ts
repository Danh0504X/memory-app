import { apiClient } from "@/lib/api-client";
import type {
  WordLevelConfig,
  LanguageOption,
  WordsSession,
  WordsSessionResult,
  SupportedLanguageCode,
} from "../types/wordsTypes";

export const DEFAULT_WORDS_LEVELS: readonly WordLevelConfig[] = [
  { level: 1, itemCount: 6, requiredScore: 4, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 4 / 6 },
  { level: 2, itemCount: 10, requiredScore: 7, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 7 / 10 },
  { level: 3, itemCount: 14, requiredScore: 10, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 10 / 14 },
  { level: 4, itemCount: 18, requiredScore: 12, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 12 / 18 },
  { level: 5, itemCount: 22, requiredScore: 15, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 15 / 22 },
  { level: 6, itemCount: 26, requiredScore: 18, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 18 / 26 },
  { level: 7, itemCount: 30, requiredScore: 20, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 20 / 30 },
  { level: 8, itemCount: 35, requiredScore: 24, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 24 / 35 },
  { level: 9, itemCount: 42, requiredScore: 28, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 28 / 42 },
  { level: 10, itemCount: 50, requiredScore: 34, memorizeSeconds: 60, recallSeconds: 240, unlockThreshold: 34 / 50 },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "vi", label: "Tiếng Việt", nativeName: "Tiếng Việt" },
  { code: "en", label: "English", nativeName: "English" },
  { code: "fr", label: "French", nativeName: "Français" },
  { code: "ja", label: "Japanese", nativeName: "日本語" },
  { code: "ko", label: "Korean", nativeName: "한국어" },
  { code: "zh", label: "Chinese", nativeName: "中文" },
  { code: "ru", label: "Russian", nativeName: "Русский" },
];

export interface CreateWordsSessionParams {
  level: number;
  language: SupportedLanguageCode;
  memorizeSec?: number;
  groups?: number;
  prepTime?: number;
}

export interface SubmitWordsSessionParams {
  answers: (string | null)[];
  timeSpent: number;
}

/**
 * Helper bóc tách payload dữ liệu an toàn.
 * Hỗ trợ cả trường hợp apiClient trả về response.data (do interceptor)
 * lẫn trường hợp AxiosResponse truyền thống hoặc dữ liệu đã bóc sẵn.
 */
function unwrapPayload<T>(res: unknown): T {
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>;
    // Trường hợp 1: AxiosResponse bọc { data: { status, data: T } }
    if (obj.data && typeof obj.data === "object" && "data" in (obj.data as Record<string, unknown>)) {
      return (obj.data as Record<string, unknown>).data as T;
    }
    // Trường hợp 2: Interceptor trả về { status: "success", data: T }
    if ("data" in obj && obj.data !== undefined) {
      return obj.data as T;
    }
    // Trường hợp 3: res đã chính là T
    return res as T;
  }
  return res as T;
}

export const fetchWordsLevels = async (): Promise<{
  levels: readonly WordLevelConfig[];
  languages: LanguageOption[];
}> => {
  try {
    const res = await apiClient.get("/words/levels");
    const data = unwrapPayload<{ levels: WordLevelConfig[]; languages: LanguageOption[] }>(res);
    if (data?.levels?.length) {
      return data;
    }
  } catch (error) {
    console.warn("⚠️ [WordsApi] Không thể tải levels từ backend, dùng cấu hình mặc định:", error);
  }
  return {
    levels: DEFAULT_WORDS_LEVELS,
    languages: SUPPORTED_LANGUAGES,
  };
};

export const createWordsSession = async (
  params: CreateWordsSessionParams
): Promise<WordsSession> => {
  const res = await apiClient.post("/words/sessions", params);
  const session = unwrapPayload<WordsSession>(res);
  if (!session || !Array.isArray(session.words) || session.words.length === 0) {
    throw new Error("Máy chủ không trả về danh sách từ hợp lệ.");
  }
  return session;
};

export const submitWordsSession = async (
  sessionId: string,
  params: SubmitWordsSessionParams
): Promise<WordsSessionResult> => {
  const res = await apiClient.post(`/words/sessions/${sessionId}/submit`, params);
  const result = unwrapPayload<WordsSessionResult>(res);
  if (!result || typeof result.score !== "number") {
    throw new Error("Không nhận được kết quả chấm điểm từ máy chủ.");
  }
  return result;
};

