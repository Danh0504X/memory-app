import { useEffect } from "react";
import { useImagesGameStore } from "../store/imagesGameStore";
import { usePhaseTimer } from "@/features/cards-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { MemorizeStage } from "@/features/shared-game/components/MemorizeStage";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import { PhotoBack, PhotoTile } from "./PhotoTile";

const HINTS = [
    { keys: ["←", "→"], label: "chuyển hình" },
    { keys: ["Space"], label: "về hình đầu" },
    { keys: ["Enter"], label: "đã nhớ xong" },
];

export const ImagesMemorizePhase = () => {
    const {
        imagesToMemorize,
        currentMemorizeIndex,
        nextMemorizeCard,
        prevMemorizeCard,
        finishMemorize,
        phaseDeadline,
        rules,
        level,
        resetGame,
        preferences,
        pending,
        error,
    } = useImagesGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishMemorize);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevMemorizeCard();
            else if (e.key === "ArrowRight") nextMemorizeCard();
            else if (e.key === " ") {
                e.preventDefault();
                useImagesGameStore.setState({ currentMemorizeIndex: 0 });
            } else if (e.key === "Enter") finishMemorize();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [prevMemorizeCard, nextMemorizeCard, finishMemorize]);

    const total = imagesToMemorize.length;
    const groupSize = Math.max(1, preferences.groups || 1);
    const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
    const bigSize = groupSize <= 3 ? "lg" : "md";

    return (
        <div className="play">
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                status={`Ghi nhớ thứ tự · đang xem hình ${shownTo} trên ${total}`}
                progress={shownTo / total}
                timeLeft={preferences.hideTimer ? undefined : timeLeft}
                timeLimit={rules?.memorizeLimitSec}
                actionLabel={pending === "recall" ? "Đang chuyển..." : "Đã nhớ xong"}
                actionBusy={pending === "recall"}
                onAction={finishMemorize}
                onReset={resetGame}
            />
            <RoundStatusBar
                pendingText={pending === "recall" ? "Đang chuẩn bị phần nhớ lại..." : null}
                error={error}
            />

            <MemorizeStage
                items={imagesToMemorize}
                index={currentMemorizeIndex}
                groupSize={groupSize}
                unit="Hình"
                onJump={(index) => useImagesGameStore.setState({ currentMemorizeIndex: index })}
                onPrev={prevMemorizeCard}
                onNext={nextMemorizeCard}
                keyOf={(image) => image.id}
                renderBig={(image, index) => <PhotoTile image={image} size={bigSize} label={`Hình thứ ${index + 1}`} />}
                renderMini={(image, index, seen) =>
                    seen ? <PhotoTile image={image} size="xs" label={`Hình ${index + 1}`} /> : <PhotoBack size="xs" />
                }
            />

            <PlayHints hints={HINTS} />
        </div>
    );
};
