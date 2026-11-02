import { useAuthStore } from "@/features/auth/store/authStore";
import { useGameStore } from "../store/gameStore";
import { SettingsPhase } from "./SettingsPhase";
import { MemorizePhase } from "./MemorizePhase";
import { RecallPhase } from "./RecallPhase";
import { ResultPhase } from "./ResultPhase";

export const CardsGame = () => {
    const isLoading = useAuthStore((state) => state.isLoading);
    const phase = useGameStore((state) => state.phase);

    // Chờ biết là khách hay đã đăng nhập để tải đúng level đã mở
    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center bg-[#f5faf7]">Đang tải...</div>;
    }

    let content = null;
    if (phase === "idle") content = <SettingsPhase />;
    else if (phase === "memorize") content = <MemorizePhase />;
    else if (phase === "recall") content = <RecallPhase />;
    else if (phase === "result") content = <ResultPhase />;

    return (
        <div className="min-h-screen bg-[#f5faf7]">
            {content}
        </div>
    );
};
