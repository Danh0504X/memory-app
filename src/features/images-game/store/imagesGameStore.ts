import { create } from "zustand";
import {
  gamesApi,
  type CompletedRound,
  type RoundRules,
  type StartedRound,
} from "@/features/shared-game/api/games.api";
import { notifyGameSessionRecorded } from "@/features/shared-game/events";
import { reloadGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import {
  describeRoundError,
  isRoundClosed,
} from "@/features/shared-game/utils/roundErrors";
import type { ImageCard, GamePhase } from "../types/imageTypes";
import { imageFromView, preloadImages } from "../utils/imageUtils";

// Thao tác đang chờ backend trả lời; dùng để khoá nút và tránh gửi hai lần (bấm nút cùng lúc hết giờ)
type PendingAction = "start" | "recall" | "submit" | null;

export interface ImagesPreferences {
  groups: number;
  hideTimer: boolean;
  prepTime: number;
  imageCount: number | null;
}

interface ImagesGameState {
  preferences: ImagesPreferences;
  memorizeTime: number; // giây; phải là một lựa chọn backend cho phép
  // Level muốn chơi, chỉ giữ trong phiên; null: level cao nhất đã mở (tự lên khi mở level mới)
  selectedLevel: number | null;

  // Ván đang chơi; luật, đề và kết quả đều do backend quyết định
  phase: GamePhase;
  sessionId: string | null;
  rules: RoundRules | null;
  level: number | null;
  imagesToMemorize: ImageCard[];
  userRecall: (ImageCard | null)[];
  shuffledDeck: ImageCard[];
  currentMemorizeIndex: number;
  selectedSlotIndex: number | null;
  phaseDeadline: number | null;
  result: CompletedRound | null;
  pending: PendingAction;
  error: string | null;

  setPreferences: (preferences: ImagesPreferences) => void;
  setMemorizeTime: (time: number) => void;
  setSelectedLevel: (level: number | null) => void;
  startGame: (
    memorizeSec: number,
    gameLevel: number,
    customImageCount: number | null,
  ) => Promise<void>;
  // Nạp một ván backend đã tạo (ván thường hoặc thử thách ngày), tải trước ảnh rồi chuyển sang phase ghi nhớ
  loadRound: (session: StartedRound) => Promise<void>;
  nextMemorizeCard: () => void;
  prevMemorizeCard: () => void;
  finishMemorize: () => Promise<void>;
  placeImage: (image: ImageCard) => void;
  removeImage: (slotIndex: number) => void;
  selectSlot: (index: number | null) => void;
  finishGame: () => Promise<void>;
  resetGame: () => void;
}

const EMPTY_ROUND = {
  phase: "idle" as GamePhase,
  sessionId: null,
  rules: null,
  level: null,
  imagesToMemorize: [],
  userRecall: [],
  shuffledDeck: [],
  currentMemorizeIndex: 0,
  selectedSlotIndex: null,
  phaseDeadline: null,
  result: null,
  pending: null,
};

// Đếm ngược theo đồng hồ máy người chơi, tính từ lúc nhận phản hồi, để không lệch khi giờ máy khác giờ server
const deadlineIn = (seconds: number) => Date.now() + seconds * 1000;

export const useImagesGameStore = create<ImagesGameState>((set, get) => ({
  preferences: {
    groups: 1,
    hideTimer: false,
    prepTime: 20,
    imageCount: null,
  },
  memorizeTime: 60,
  selectedLevel: null,
  ...EMPTY_ROUND,
  error: null,

  setPreferences: (preferences) => set({ preferences }),
  setMemorizeTime: (time) => set({ memorizeTime: time }),
  setSelectedLevel: (level) => set({ selectedLevel: level }),

  startGame: async (memorizeSec, gameLevel, customImageCount) => {
    if (get().pending) return;
    set({ pending: "start", error: null });
    try {
      const { data } = await gamesApi.startRound({
        gameName: "image",
        memorizeSec,
        ...(customImageCount !== null
          ? { mode: "custom", itemCount: customImageCount }
          : { gameLevel }),
      });
      await get().loadRound(data.session);
    } catch (error) {
      set({ pending: null, error: describeRoundError(error, "start") });
    }
  },

  loadRound: async (session) => {
    const images = session.items.map(imageFromView);
    // Nút bắt đầu vẫn ở trạng thái chờ trong lúc tải ảnh; phần lệch giờ do tải ảnh nằm trong thời gian bù trễ của backend
    await preloadImages(images.map((image) => image.imageUrl));
    set({
      ...EMPTY_ROUND,
      error: null,
      phase: "memorize",
      sessionId: session.sessionId,
      rules: session.rules,
      level: session.rules.gameLevel,
      imagesToMemorize: images,
      userRecall: Array(images.length).fill(null),
      phaseDeadline: deadlineIn(session.rules.memorizeLimitSec),
    });
  },

  nextMemorizeCard: () => {
    const { currentMemorizeIndex, imagesToMemorize, preferences } = get();
    const step = preferences.groups || 1;
    if (currentMemorizeIndex + step < imagesToMemorize.length) {
      set({ currentMemorizeIndex: currentMemorizeIndex + step });
    }
  },

  prevMemorizeCard: () => {
    const { currentMemorizeIndex, preferences } = get();
    const step = preferences.groups || 1;
    set({ currentMemorizeIndex: Math.max(0, currentMemorizeIndex - step) });
  },

  // Gọi khi người chơi bấm "đã nhớ xong" hoặc khi hết giờ ghi nhớ; backend trả các ảnh đã xáo thứ tự
  finishMemorize: async () => {
    const { sessionId, pending, phase } = get();
    if (!sessionId || pending || phase !== "memorize") return;
    set({ pending: "recall", error: null });
    try {
      const { data } = await gamesApi.startRecall(sessionId);
      set({
        phase: "recall",
        shuffledDeck: data.session.recallOptions.map(imageFromView),
        selectedSlotIndex: null,
        phaseDeadline: deadlineIn(data.session.rules.recallLimitSec),
        pending: null,
      });
    } catch (error) {
      const message = describeRoundError(error, "recall");
      set(
        isRoundClosed(error)
          ? { ...EMPTY_ROUND, error: message }
          : { pending: null, error: message },
      );
    }
  },

  placeImage: (image) => {
    const { userRecall, selectedSlotIndex, pending } = get();
    if (pending || userRecall.some((placed) => placed?.id === image.id)) return;

    const targetIndex =
      selectedSlotIndex ?? userRecall.findIndex((placed) => placed === null);
    if (targetIndex === -1) return;

    const newUserRecall = [...userRecall];
    newUserRecall[targetIndex] = image;
    set({ userRecall: newUserRecall, selectedSlotIndex: null });
  },

  removeImage: (slotIndex) => {
    if (get().pending) return;
    const newUserRecall = [...get().userRecall];
    newUserRecall[slotIndex] = null;
    set({ userRecall: newUserRecall });
  },

  selectSlot: (index) => set({ selectedSlotIndex: index }),

  // Gọi khi người chơi nộp bài hoặc khi hết giờ nhớ lại; backend chấm và trả phần thưởng
  finishGame: async () => {
    const { sessionId, pending, phase, userRecall } = get();
    if (!sessionId || pending || phase !== "recall") return;
    set({ pending: "submit", error: null });
    try {
      const { data } = await gamesApi.submitRound(
        sessionId,
        userRecall.map((image) => image?.id ?? null),
      );
      set({
        phase: "result",
        result: data.session,
        phaseDeadline: null,
        pending: null,
      });
      // Trang hồ sơ và level đã mở cần số liệu mới sau mỗi ván
      notifyGameSessionRecorded();
      void reloadGameCatalog();
    } catch (error) {
      const message = describeRoundError(error, "submit");
      set(
        isRoundClosed(error)
          ? { ...EMPTY_ROUND, error: message }
          : { pending: null, error: message },
      );
    }
  },

  // Thoát ván: backend tự xoá ván chưa nộp sau một thời gian
  resetGame: () => set({ ...EMPTY_ROUND, error: null }),
}));
