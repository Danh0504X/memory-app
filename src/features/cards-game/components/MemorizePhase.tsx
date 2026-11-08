import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { usePhaseTimer } from "../hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { MemorizeStage } from "@/features/shared-game/components/MemorizeStage";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import { CardBack, PlayingCard } from "./PlayingCard";

const HINTS = [
  { keys: ["←", "→"], label: "lật lá" },
  { keys: ["Space"], label: "về lá đầu" },
  { keys: ["Enter"], label: "đã nhớ xong" },
];

export const MemorizePhase = () => {
  const {
    cardsToMemorize,
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
  } = useGameStore();
  const { timeLeft } = usePhaseTimer(phaseDeadline, finishMemorize);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevMemorizeCard();
      else if (e.key === "ArrowRight") nextMemorizeCard();
      else if (e.key === " ") {
        e.preventDefault();
        useGameStore.setState({ currentMemorizeIndex: 0 });
      } else if (e.key === "Enter") finishMemorize();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMemorizeCard, nextMemorizeCard, finishMemorize]);

  const total = cardsToMemorize.length;
  const groupSize = Math.max(1, Math.min(5, preferences.groups || 1));
  const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
  const bigSize = groupSize <= 3 ? "lg" : "md";

  return (
    <div className="play">
      <GameHeader
        gameName="Thẻ bài"
        level={level}
        status={`Ghi nhớ thứ tự · đang xem lá ${shownTo} trên ${total}`}
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
        items={cardsToMemorize}
        index={currentMemorizeIndex}
        groupSize={groupSize}
        unit="Lá"
        onJump={(index) => useGameStore.setState({ currentMemorizeIndex: index })}
        onPrev={prevMemorizeCard}
        onNext={nextMemorizeCard}
        keyOf={(card) => `${card.rank}${card.suit}`}
        renderBig={(card) => <PlayingCard card={card} size={bigSize} />}
        renderMini={(card, _index, seen) => (seen ? <PlayingCard card={card} size="xs" /> : <CardBack size="xs" />)}
      />

      <PlayHints hints={HINTS} />
    </div>
  );
};
