import { useAuthStore } from "@/features/auth/store/authStore";
import { useImagesGameStore } from "../store/imagesGameStore";
import { ImagesSettingsPhase } from "./ImagesSettingsPhase";
import { ImagesMemorizePhase } from "./ImagesMemorizePhase";
import { ImagesRecallPhase } from "./ImagesRecallPhase";
import { ImagesResultPhase } from "./ImagesResultPhase";

export const ImagesGame = () => {
    const isLoading = useAuthStore((state) => state.isLoading);
    const phase = useImagesGameStore((state) => state.phase);

    // Chờ biết là khách hay đã đăng nhập để tải đúng level đã mở
    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center bg-[#f5faf7]">Đang tải...</div>;
    }

    let content = null;
    if (phase === "idle") content = <ImagesSettingsPhase />;
    if (phase === "memorize") content = <ImagesMemorizePhase />;
    if (phase === "recall") content = <ImagesRecallPhase />;
    if (phase === "result") content = <ImagesResultPhase />;

    return (
        <div className="min-h-screen bg-[#f5faf7]">
            {content}
        </div>
    );
};
