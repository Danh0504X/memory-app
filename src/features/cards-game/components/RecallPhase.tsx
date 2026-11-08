import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { usePhaseTimer } from "../hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RecallBoard } from "@/features/shared-game/components/RecallBoard";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import type { Card, Suit } from "../types/types";
import { isSameCard } from "../utils/cardUtils";
import { cardLabel, SUIT_LABELS, SUIT_SYMBOLS } from "../utils/cardLabels";
import { PlayingCard } from "./PlayingCard";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const HINTS = [
    { keys: ["Backspace"], label: "gỡ lá cuối" },
    { keys: ["Enter"], label: "nộp bài" },
];

export const RecallPhase = () => {
    const {
        cardsToMemorize,
        userRecall,
        deckCards,
        selectedSlotIndex,
        selectSlot,
        placeCard,
        removeCard,
        finishGame,
        phaseDeadline,
        rules,
        level,
        resetGame,
        pending,
        error,
    } = useGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishGame);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") finishGame();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [finishGame]);

    const total = cardsToMemorize.length;
    const filled = userRecall.filter(Boolean).length;
    // Bộ bài chia bốn hàng theo chất để tìm lá nhanh
    const groups = SUITS.map((suit) => ({
        label: `${SUIT_SYMBOLS[suit]} ${SUIT_LABELS[suit]}`,
        items: deckCards.filter((card) => card.suit === suit),
    })).filter((group) => group.items.length > 0);

    return (
        <div className="play">
            <GameHeader
                gameName="Thẻ bài"
                level={level}
                status={`Nhớ lại · đã xếp ${filled} trên ${total} lá`}
                progress={filled / total}
                timeLeft={timeLeft}
                timeLimit={rules?.recallLimitSec}
                actionLabel={pending === "submit" ? "Đang chấm..." : "Nộp bài"}
                actionBusy={pending === "submit"}
                onAction={finishGame}
                onReset={resetGame}
            />
            <RoundStatusBar pendingText={pending === "submit" ? "Đang chấm bài..." : null} error={error} />

            <RecallBoard<Card>
                slots={userRecall}
                selectedIndex={selectedSlotIndex}
                shape="card"
                unit="lá"
                onSelectSlot={selectSlot}
                onClearSlot={removeCard}
                deckTitle={`Bộ bài · ${deckCards.length} lá`}
                groups={groups}
                isUsed={(card) => userRecall.some((placed) => isSameCard(placed, card))}
                onPick={placeCard}
                keyOf={(card) => `${card.rank}${card.suit}`}
                labelOf={cardLabel}
                renderItem={(card) => <PlayingCard card={card} size="sm" />}
            />

            <PlayHints hints={HINTS} />
        </div>
    );
};
