import { useEffect } from "react";
import { create } from "zustand";
import { useAuthStore } from "@/features/auth/store/authStore";
import { gamesApi, type GameCatalogItem, type GameName } from "../api/games.api";

interface GameCatalogState {
    games: GameCatalogItem[] | null;
    status: "idle" | "loading" | "ready" | "error";
    error: string | null;
    // Danh sách gắn với tài khoản đã tải nó (level đã mở khác nhau giữa các tài khoản)
    loadedFor: string | null;
    load: (userId: string | null, force?: boolean) => Promise<void>;
}

let inFlight: Promise<void> | null = null;

export const useGameCatalogStore = create<GameCatalogState>((set, get) => ({
    games: null,
    status: "idle",
    error: null,
    loadedFor: null,

    load: async (userId, force = false) => {
        const { status, loadedFor } = get();
        if (!force && status === "ready" && loadedFor === userId) return;
        if (inFlight) return inFlight;

        set({ status: "loading", error: null });
        inFlight = gamesApi
            .getGames()
            .then(({ data }) => set({ games: data.games, status: "ready", loadedFor: userId }))
            .catch((error: { message?: string }) =>
                set({ status: "error", error: error.message ?? "Không thể tải thông tin trò chơi. Vui lòng thử lại." }),
            )
            .finally(() => {
                inFlight = null;
            });
        return inFlight;
    },
}));

// Tải lại sau mỗi ván để level đã mở và số ván luôn khớp với backend
export const reloadGameCatalog = () => {
    const userId = useAuthStore.getState().user?._id ?? null;
    return useGameCatalogStore.getState().load(userId, true);
};

// Luật chơi và tiến độ của một game; tự tải lại khi đổi tài khoản
export const useGameCatalog = (gameName: GameName) => {
    const userId = useAuthStore((state) => state.user?._id ?? null);
    const games = useGameCatalogStore((state) => state.games);
    const status = useGameCatalogStore((state) => state.status);
    const error = useGameCatalogStore((state) => state.error);
    const loadedFor = useGameCatalogStore((state) => state.loadedFor);
    const load = useGameCatalogStore((state) => state.load);

    useEffect(() => {
        void load(userId);
    }, [load, userId]);

    return {
        // Chỉ trả danh sách của đúng tài khoản hiện tại, tránh hiện level của tài khoản trước
        game: loadedFor === userId ? (games?.find((item) => item.gameName === gameName) ?? null) : null,
        status,
        error,
        reload: () => load(userId, true),
    };
};
