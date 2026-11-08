import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useImagesGameStore } from "../store/imagesGameStore";
import { ImagesSettingsPhase } from "./ImagesSettingsPhase";
import { ImagesMemorizePhase } from "./ImagesMemorizePhase";
import { ImagesRecallPhase } from "./ImagesRecallPhase";
import { ImagesResultPhase } from "./ImagesResultPhase";
import "@/features/shared-game/game.css";

export const ImagesGame = () => {
    const isLoading = useAuthStore((state) => state.isLoading);
    const phase = useImagesGameStore((state) => state.phase);

    // Chờ biết là khách hay đã đăng nhập để tải đúng level đã mở
    if (isLoading) {
        return (
            <div className="grid min-h-dvh place-items-center">
                <LoaderCircle size={28} className="animate-spin text-[var(--color-brand)]" aria-label="Đang tải" />
            </div>
        );
    }

    if (phase === "memorize") return <ImagesMemorizePhase />;
    if (phase === "recall") return <ImagesRecallPhase />;
    if (phase === "result") return <ImagesResultPhase />;
    return <ImagesSettingsPhase />;
};
