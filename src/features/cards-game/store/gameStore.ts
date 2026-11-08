import { create } from "zustand";
import { persist } from "zustand/middleware";
import { gamesApi, type CompletedRound, type RoundRules, type StartedRound } from "@/features/shared-game/api/games.api";
import { synchronizeRoundCompletion } from "@/features/shared-game/completion";
import { clientDeadline } from "@/features/shared-game/utils/deadline";
import { useAuthStore } from "@/features/auth/store/authStore";
import { describeRoundError, isRoundClosed } from "@/features/shared-game/utils/roundErrors";
import type { Card, GamePhase } from "../types/types";
import { cardFromCode, cardToCode, isSameCard } from "../utils/cardUtils";

// Thao tác đang chờ backend trả lời; dùng để khoá nút và tránh gửi hai lần (bấm nút cùng lúc hết giờ)
type PendingAction = "start" | "recall" | "submit" | null;

export interface CardPreferences {
  hideTimer: boolean;
  // null: số lá theo cấp độ; số: ván tự chọn (không mở cấp mới, không tính kỷ lục)
  cardCount: number | null;
  groups: number;
}

interface StartOptions {
  memorizeSec: number;
  customCardCount: number | null;
  gameLevel: number; // bỏ qua khi chơi ván tự chọn
}

interface GameState {
  // Lưu giữa các lần mở trang
  preferences: CardPreferences;
  memorizeTime: number; // giây; phải là một lựa chọn backend cho phép
  // Level muốn chơi, chỉ giữ trong phiên; null: level cao nhất đã mở (tự lên khi mở level mới)
  selectedLevel: number | null;

  // Ván đang chơi; luật, đề và kết quả đều do backend quyết định
  phase: GamePhase;
  sessionId: string | null;
  rules: RoundRules | null;
  level: number | null; // level của ván hiện tại, null với ván tự chọn
  cardsToMemorize: Card[];
  userRecall: (Card | null)[];
  deckCards: Card[];
  currentMemorizeIndex: number;
  selectedSlotIndex: number | null;
  phaseDeadline: number | null;
  result: CompletedRound | null;
  pending: PendingAction;
  error: string | null;

  setPreferences: (preferences: CardPreferences) => void;
  setMemorizeTime: (time: number) => void;
  setSelectedLevel: (level: number | null) => void;
  startGame: (options: StartOptions) => Promise<void>;
  // Nạp một ván backend đã tạo (ván thường hoặc thử thách ngày) và chuyển sang phase ghi nhớ
  loadRound: (session: StartedRound) => void;
  nextMemorizeCard: () => void;
  prevMemorizeCard: () => void;
  finishMemorize: () => Promise<void>;
  placeCard: (card: Card) => void;
  removeCard: (slotIndex: number) => void;
  selectSlot: (index: number | null) => void;
  finishGame: () => Promise<void>;
  resetGame: () => void;
}

const DEFAULT_PREFERENCES: CardPreferences = { hideTimer: false, cardCount: null, groups: 1 };

const EMPTY_ROUND = {
  phase: "idle" as GamePhase,
  sessionId: null,
  rules: null,
  level: null,
  cardsToMemorize: [],
  userRecall: [],
  deckCards: [],
  currentMemorizeIndex: 0,
  selectedSlotIndex: null,
  phaseDeadline: null,
  result: null,
  pending: null,
};

// Đếm ngược theo đồng hồ máy người chơi, tính từ lúc nhận phản hồi, để không lệch khi giờ máy khác giờ server
let generation = 0;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,
      memorizeTime: 120,
      selectedLevel: null,
      ...EMPTY_ROUND,
      error: null,

      setPreferences: (preferences) =>
        set({
          preferences: {
            ...preferences,
            groups: Math.max(1, Math.min(5, Math.round(preferences.groups || 1))),
          },
        }),
      setMemorizeTime: (time) => set({ memorizeTime: time }),
      setSelectedLevel: (level) => set({ selectedLevel: level }),

      startGame: async ({ memorizeSec, customCardCount, gameLevel }) => {
        if (get().pending) return;
        const requestId = ++generation;
        set({ pending: "start", error: null });
        try {
          const { data } = await gamesApi.startRound({
            gameName: "card",
            memorizeSec,
            ...(customCardCount !== null ? { mode: "custom", itemCount: customCardCount } : { gameLevel }),
          });
          if (requestId === generation) get().loadRound(data.session);
        } catch (error) {
          if (requestId !== generation) return;
          set({ pending: null, error: describeRoundError(error, "start") });
        }
      },

      loadRound: (session) => {
        const cards = session.items.map((item) => cardFromCode(item.code));
        set({
          ...EMPTY_ROUND,
          error: null,
          phase: "memorize",
          sessionId: session.sessionId,
          rules: session.rules,
          level: session.rules.gameLevel,
          cardsToMemorize: cards,
          userRecall: Array(cards.length).fill(null),
          phaseDeadline: clientDeadline(session.memorizeDeadline, session.serverNow),
        });
      },

      nextMemorizeCard: () => {
        const { currentMemorizeIndex, cardsToMemorize, preferences } = get();
        const step = preferences.groups || 1;
        if (currentMemorizeIndex + step < cardsToMemorize.length) {
          set({ currentMemorizeIndex: currentMemorizeIndex + step });
        }
      },

      prevMemorizeCard: () => {
        const { currentMemorizeIndex, preferences } = get();
        const step = preferences.groups || 1;
        set({ currentMemorizeIndex: Math.max(0, currentMemorizeIndex - step) });
      },

      // Gọi khi người chơi bấm "đã nhớ xong" hoặc khi hết giờ ghi nhớ
      finishMemorize: async () => {
        const { sessionId, pending, phase } = get();
        if (!sessionId || pending || phase !== "memorize") return;
        set({ pending: "recall", error: null });
        try {
          const { data } = await gamesApi.startRecall(sessionId);
          if (get().sessionId !== sessionId) return;
          set({
            phase: "recall",
            deckCards: data.session.recallOptions.map((item) => cardFromCode(item.code)),
            selectedSlotIndex: null,
            phaseDeadline: clientDeadline(data.session.recallDeadline, data.session.serverNow),
            pending: null,
          });
        } catch (error) {
          if (get().sessionId !== sessionId) return;
          const message = describeRoundError(error, "recall");
          set(isRoundClosed(error) ? { ...EMPTY_ROUND, error: message } : { pending: null, error: message });
        }
      },

      placeCard: (card) => {
        const { userRecall, selectedSlotIndex, pending } = get();
        if (pending || userRecall.some((placed) => isSameCard(placed, card))) return;

        const targetIndex = selectedSlotIndex ?? userRecall.findIndex((placed) => placed === null);
        if (targetIndex === -1) return;

        const newUserRecall = [...userRecall];
        newUserRecall[targetIndex] = card;
        set({ userRecall: newUserRecall, selectedSlotIndex: null });
      },

      removeCard: (slotIndex) => {
        if (get().pending) return;
        const newUserRecall = [...get().userRecall];
        newUserRecall[slotIndex] = null;
        set({ userRecall: newUserRecall });
      },

      selectSlot: (index) => {
        const { selectedSlotIndex } = get();
        set({ selectedSlotIndex: index === selectedSlotIndex ? null : index });
      },

      // Gọi khi người chơi nộp bài hoặc khi hết giờ nhớ lại; backend chấm và trả phần thưởng
      finishGame: async () => {
        const { sessionId, pending, phase, userRecall } = get();
        if (!sessionId || pending || phase !== "recall") return;
        set({ pending: "submit", error: null });
        try {
          const answers = userRecall.map((card) => (card ? cardToCode(card) : null));
          const { data } = await gamesApi.submitRound(sessionId, answers);
          if (get().sessionId !== sessionId) return;
          set({ phase: "result", result: data.session, phaseDeadline: null, pending: null });
          // Trang hồ sơ và level đã mở cần số liệu mới sau mỗi ván
          synchronizeRoundCompletion(data.session.sessionId);
        } catch (error) {
          if (get().sessionId !== sessionId) return;
          const message = describeRoundError(error, "submit");
          set(isRoundClosed(error) ? { ...EMPTY_ROUND, error: message } : { pending: null, error: message });
        }
      },

      // Thoát ván: backend tự xoá ván chưa nộp sau một thời gian
      resetGame: () => { generation++; set({ ...EMPTY_ROUND, error: null }); },
    }),
    {
      name: "cards-game-storage",
      // Chỉ lưu tuỳ chọn; ván đang chơi và level giờ do backend giữ
      version: 1,
      partialize: (state) => ({ preferences: state.preferences, memorizeTime: state.memorizeTime }),
      // Bản cũ lưu cả ván đang chơi và level vào localStorage: chỉ giữ lại tuỳ chọn.
      // Modal cũ luôn lưu cardCount thành một số nên không phải người chơi chủ động chọn ván tự chọn:
      // đặt lại về null để không bị kẹt ở chế độ không mở được cấp mới.
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<Pick<GameState, "preferences" | "memorizeTime">>;
        return {
          preferences: { ...DEFAULT_PREFERENCES, ...old.preferences, cardCount: null },
          memorizeTime: typeof old.memorizeTime === "number" ? old.memorizeTime : 120,
        };
      },
    },
  ),
);

useAuthStore.subscribe((state, previous) => {
  if (state.user?._id !== previous.user?._id) useGameStore.getState().resetGame();
});
