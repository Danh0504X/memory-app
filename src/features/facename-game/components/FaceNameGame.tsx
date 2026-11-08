import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Loader2 } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameSettingsPhase } from "./FaceNameSettingsPhase";
import { FaceNameMemorizePhase } from "./FaceNameMemorizePhase";
import { FaceNameRecallPhase } from "./FaceNameRecallPhase";
import { FaceNameResultPhase } from "./FaceNameResultPhase";
import "@/features/shared-game/game.css";
import "../facename.css";

export const FaceNameGame = () => {
  const { phase, initialize, isLoading, goHome } = useFaceNameStore();
  const userId = useAuthStore((state) => state.user?._id ?? null);

  useEffect(() => {
    goHome();
    void initialize();
    return goHome;
  }, [initialize, goHome, userId]);

  if (phase === "loading-faces" && isLoading) {
    return (
      <div className="face-loading" role="status">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" aria-label="Đang tải ván chơi" />
          <h1 className="text-lg font-semibold">Đang chuẩn bị ván chơi...</h1>
        </div>
      </div>
    );
  }

  if (phase === "memorize") return <FaceNameMemorizePhase />;
  if (phase === "recall" || phase === "submitting") return <FaceNameRecallPhase />;
  if (phase === "result") return <FaceNameResultPhase />;

  return <FaceNameSettingsPhase />;
};
