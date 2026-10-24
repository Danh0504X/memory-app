import { useEffect, useRef } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/features/auth/store/authStore";

export type GameName = "card" | "image" | "number" | "word";

interface RecordGameSessionParams {
    gameName: GameName;
    score: number;
    time: number;
}

/**
 * Custom Hook dùng chung để tự động gửi kết quả ván đấu ngầm về Backend
 */
export const useRecordGameSession = ({
    gameName,
    score,
    time,
}: RecordGameSessionParams) => {
    const { user } = useAuthStore();
    const hasRecordedRef = useRef(false);

    useEffect(() => {
        // Tránh bị React StrictMode gọi 2 lần liên tiếp
        if (hasRecordedRef.current) return;
        hasRecordedRef.current = true;

        const userId = user?.id || "guest_player";

        apiClient
            .post("/game-sessions", {
                userId,
                gameName,
                time: Math.max(1, time || 30),
                score,
            })
            .then(() => {
                console.info(`✅ [${gameName}] Đã ghi nhận lịch sử ván đấu thành công!`);
            })
            .catch((err) => {
                console.error(`❌ [${gameName}] Lỗi khi gửi lịch sử game ngầm:`, err);
            });
    }, [user, gameName, score, time]);
};
