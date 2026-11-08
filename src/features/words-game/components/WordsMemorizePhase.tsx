import { useEffect } from "react";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { MemorizeStage } from "@/features/shared-game/components/MemorizeStage";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import { usePhaseTimer } from "@/features/shared-game/hooks/usePhaseTimer";
import { useWordsGameStore } from "../store/wordsGameStore";
import { WordCard } from "./WordCard";

const HINTS = [
  { keys: ["←", "→"], label: "lật từ" },
  { keys: ["Space"], label: "về từ đầu" },
  { keys: ["Enter"], label: "đã nhớ xong" },
];

export const WordsMemorizePhase = () => {
  const {
    rules,
    level,
    wordsToMemorize,
    currentMemorizeIndex,
    nextMemorizeWord,
    prevMemorizeWord,
    jumpMemorize,
    finishMemorize,
    phaseDeadline,
    preferences,
    resetGame,
    pending,
    error,
  } = useWordsGameStore();

  const { timeLeft } = usePhaseTimer(phaseDeadline, () => void finishMemorize());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevMemorizeWord();
      } else if (e.key === "ArrowRight") {
        nextMemorizeWord();
      } else if (e.key === " ") {
        e.preventDefault();
        jumpMemorize(0);
      } else if (e.key === "Enter") {
        void finishMemorize();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMemorizeWord, nextMemorizeWord, jumpMemorize, finishMemorize]);

  const total = wordsToMemorize.length;
  const groupSize = Math.max(1, Math.min(3, preferences.groups || 1));
  const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
  const bigSize = groupSize <= 2 ? "lg" : "md";

  return (
    <div className="play">
      <GameHeader
        gameName="Ghi nhớ từ"
        level={level ?? 1}
        daily={rules?.mode === "daily"}
        status={`Ghi nhớ thứ tự · đang xem từ ${shownTo} trên ${total}`}
        progress={total > 0 ? shownTo / total : 0}
        timeLeft={preferences.hideTimer ? undefined : timeLeft}
        timeLimit={rules?.memorizeLimitSec}
        actionLabel={pending === "recall" ? "Đang chuyển..." : "Đã nhớ xong"}
        actionBusy={pending === "recall"}
        onAction={() => void finishMemorize()}
        onReset={resetGame}
      />

      <RoundStatusBar
        pendingText={pending === "recall" ? "Đang chuẩn bị phần nhớ lại..." : null}
        error={error}
      />

      <MemorizeStage
        items={wordsToMemorize}
        index={currentMemorizeIndex}
        groupSize={groupSize}
        unit="Từ"
        onJump={jumpMemorize}
        onPrev={prevMemorizeWord}
        onNext={nextMemorizeWord}
        keyOf={(word, index) => `${word}-${index}`}
        renderBig={(word, index) => (
          <WordCard word={word} index={index + 1} size={bigSize} />
        )}
        renderMini={(word, index, seen) =>
          seen ? (
            <WordCard word={word} index={index + 1} size="xs" />
          ) : (
            <WordCard size="xs" isBack />
          )
        }
      />

      <PlayHints hints={HINTS} />
    </div>
  );
};
