import { useEffect, useState } from "react";
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
  } = useFaceNameStore();

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!memorizeDeadline) return settings.memorizeSeconds;
    return Math.max(0, Math.ceil((memorizeDeadline - Date.now()) / 1000));
  });

  // Timer effect
  useEffect(() => {
    if (!memorizeDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((memorizeDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        finishMemorize();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [memorizeDeadline, finishMemorize]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    <div className="play">
      <GameHeader
        gameName="Gương mặt & Tên"
        level={currentMode === "level" ? currentLevelId : null}
        status={`Ghi nhớ thứ tự · đang xem người ${currentMemorizeIndex + 1} trên ${total}`}
        progress={(currentMemorizeIndex + 1) / total}
        timeLeft={timeLeft}
        timeLimit={settings.memorizeSeconds}
        actionLabel="Đã nhớ xong"
        onAction={finishMemorize}
        onReset={goHome}
      />

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
            className="flex flex-col items-center justify-center rounded-3xl bg-white p-4 sm:p-5 shadow-2xl transition-all"
            style={{
              width: "clamp(240px, 28vw, 320px)",
              aspectRatio: "3 / 4",
              border: "4px solid rgba(255, 255, 255, 0.9)",
            }}
          >
            <div
              className="overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-inner"
              style={{ width: "84%", aspectRatio: "1" }}
            >
              <img
                src={person.imageUrl}
                alt={person.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="mt-3 sm:mt-4 text-center">
              <span className="block text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f2937]">
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
