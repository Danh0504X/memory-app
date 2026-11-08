import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useGameStore } from "../store/gameStore";
import { SettingsPhase } from "./SettingsPhase";
import { MemorizePhase } from "./MemorizePhase";
import { RecallPhase } from "./RecallPhase";
import { ResultPhase } from "./ResultPhase";
import "@/features/shared-game/game.css";

export const CardsGame = () => {
    const isLoading = useAuthStore((state) => state.isLoading);
    const phase = useGameStore((state) => state.phase);

    // Chờ biết là khách hay đã đăng nhập để tải đúng level đã mở
    if (isLoading) {
        return (
            <div className="grid min-h-dvh place-items-center">
                <LoaderCircle size={28} className="animate-spin text-[var(--color-brand)]" aria-label="Đang tải" />
            </div>
        );
    }

    if (phase === "memorize") return <MemorizePhase />;
    if (phase === "recall") return <RecallPhase />;
    if (phase === "result") return <ResultPhase />;
    return <SettingsPhase />;
};
