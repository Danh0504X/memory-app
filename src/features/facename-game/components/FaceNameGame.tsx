import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameSettingsPhase } from "./FaceNameSettingsPhase";
import { FaceNameMemorizePhase } from "./FaceNameMemorizePhase";
import { FaceNameRecallPhase } from "./FaceNameRecallPhase";
import { FaceNameResultPhase } from "./FaceNameResultPhase";
import "@/features/shared-game/game.css";

export const FaceNameGame = () => {
  const { phase, initialize, isLoading } = useFaceNameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (phase === "loading-faces" && isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#f8fbf8]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--color-brand)]" aria-label="Đang tải ván chơi" />
          <p className="text-sm font-semibold text-[#3d4a5c]">Đang chuẩn bị ván chơi...</p>
        </div>
      </div>
    );
  }

  if (phase === "memorize") return <FaceNameMemorizePhase />;
  if (phase === "recall" || phase === "submitting") return <FaceNameRecallPhase />;
  if (phase === "result") return <FaceNameResultPhase />;

  return <FaceNameSettingsPhase />;
};
