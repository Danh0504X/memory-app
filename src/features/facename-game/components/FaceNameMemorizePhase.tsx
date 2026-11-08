import { usePhaseTimer } from "@/features/shared-game/hooks/usePhaseTimer";
import { useEffect } from "react";
import { useFaceNameStore } from "../store/faceNameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { MemorizeStage } from "@/features/shared-game/components/MemorizeStage";
import type { Person } from "../types";
import memioMark from "@/assets/memio/Logo/Memio.svg";

const HINTS = [
  { keys: ["←", "→"], label: "chuyển người" },
  { keys: ["Space"], label: "về người đầu" },
  { keys: ["Enter"], label: "đã nhớ xong" },
];

export const FaceNameMemorizePhase = () => {
  const {
    memorizePeople,
    settings,
    memorizeDeadline,
    currentMemorizeIndex,
    nextMemorizePerson,
    prevMemorizePerson,
    setMemorizeIndex,
    finishMemorize,
    goHome,
    currentMode,
    currentLevelId,
    isLoading,
    errorMessage,
  } = useFaceNameStore();

  const { timeLeft } = usePhaseTimer(memorizeDeadline, finishMemorize);



  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("button, input, textarea, select")) return;
      if (e.key === "ArrowLeft") {
        prevMemorizePerson();
      } else if (e.key === "ArrowRight") {
        nextMemorizePerson();
      } else if (e.key === " ") {
        e.preventDefault();
        setMemorizeIndex(0);
      } else if (e.key === "Enter") {
        finishMemorize();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMemorizePerson, nextMemorizePerson, setMemorizeIndex, finishMemorize]);

  const total = memorizePeople.length;
  if (total === 0) return null;

  return (
    <div className="play face-play">
      <h1 className="sr-only">Ghi nhớ gương mặt và tên</h1>
      <GameHeader
        gameName="Gương mặt & Tên"
        level={currentMode === "level" ? currentLevelId : null}
        status={`Ghi nhớ tên · Người ${currentMemorizeIndex + 1} trên ${total}`}
        progress={(currentMemorizeIndex + 1) / total}
        timeLeft={timeLeft}
        timeLimit={settings.memorizeSeconds}
        actionLabel="Đã nhớ xong"
        actionBusy={isLoading}
        onAction={finishMemorize}
        onReset={goHome}
      />
      {errorMessage && <p role="alert" className="face-recall__error">{errorMessage}</p>}

      <MemorizeStage<Person>
        items={memorizePeople}
        index={currentMemorizeIndex}
        groupSize={1}
        unit="Người"
        onJump={setMemorizeIndex}
        onPrev={prevMemorizePerson}
        onNext={nextMemorizePerson}
        keyOf={(person) => String(person.id)}
        renderBig={(person) => (
          <div
            className="face-card"
          >
            <div
              className="face-card__portrait"
            >
              <img
                src={person.imageUrl}
                alt={person.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="face-card__name">
              <span>
                {person.name}
              </span>
            </div>
          </div>
        )}
        renderMini={(person, _index, seen) =>
          seen ? (
            <span className="ptile" data-size="xs">
              <img src={person.imageUrl} alt={person.name} />
            </span>
          ) : (
            <span className="ptile ptile--back" data-size="xs" aria-hidden="true">
              <img src={memioMark} alt="" />
            </span>
          )
        }
      />

      <PlayHints hints={HINTS} />
    </div>
  );
};
