import { useEffect } from "react";
import { useImagesGameStore } from "../store/imagesGameStore";
import { usePhaseTimer } from "@/features/shared-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RecallBoard } from "@/features/shared-game/components/RecallBoard";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import type { ImageCard } from "../types/imageTypes";
import { PhotoTile } from "./PhotoTile";

const HINTS = [
    { keys: ["Backspace"], label: "gỡ hình cuối" },
    { keys: ["Enter"], label: "nộp bài" },
];

export const ImagesRecallPhase = () => {
    const {
        imagesToMemorize,
        userRecall,
        shuffledDeck,
        selectedSlotIndex,
        phaseDeadline,
        rules,
        placeImage,
        removeImage,
        selectSlot,
        finishGame,
        resetGame,
        level,
        pending,
        error,
    } = useImagesGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishGame);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") finishGame();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [finishGame]);

    const total = imagesToMemorize.length;
    const filled = userRecall.filter(Boolean).length;
    // Số thứ tự trong bộ hình xáo trộn, để đọc tên cho trình đọc màn hình
    const labelOf = (image: ImageCard) => `hình ${shuffledDeck.findIndex((item) => item.id === image.id) + 1} trong bộ`;

    return (
        <div className="play">
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                daily={rules?.mode === "daily"}
                status={`Nhớ lại · đã xếp ${filled} trên ${total} hình`}
                progress={filled / total}
                timeLeft={timeLeft}
                timeLimit={rules?.recallLimitSec}
                actionLabel={pending === "submit" ? "Đang chấm..." : "Nộp bài"}
                actionBusy={pending === "submit"}
                onAction={finishGame}
                onReset={resetGame}
            />
            <RoundStatusBar pendingText={pending === "submit" ? "Đang chấm bài..." : null} error={error} />

            <RecallBoard<ImageCard>
                slots={userRecall}
                selectedIndex={selectedSlotIndex}
                shape="photo"
                unit="hình"
                // Bấm lại ô đang chọn thì bỏ chọn, như game thẻ bài
                onSelectSlot={(index) => selectSlot(index === selectedSlotIndex ? null : index)}
                onClearSlot={removeImage}
                deckTitle={`Bộ hình · ${shuffledDeck.length} hình`}
                groups={[{ items: shuffledDeck }]}
                isUsed={(image) => userRecall.some((item) => item?.id === image.id)}
                onPick={placeImage}
                keyOf={(image) => image.id}
                labelOf={labelOf}
                renderItem={(image, place) => (
                    <PhotoTile image={image} size={place === "slot" ? undefined : "md"} label="" />
                )}
            />

            <PlayHints hints={HINTS} />
        </div>
    );
};
