import { useRef, useEffect, useState } from "react";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { PlayHints } from "@/features/shared-game/components/PlayHints";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import { usePhaseTimer } from "@/features/shared-game/hooks/usePhaseTimer";
import { useWordsGameStore } from "../store/wordsGameStore";

const HINTS = [
  { keys: ["Enter", "Tab"], label: "chuyển ô tiếp theo" },
  { keys: ["Shift+Tab"], label: "quay lại ô trước" },
  { keys: ["Enter"], label: "nộp bài khi hoàn tất" },
];

export const WordsRecallPhase = () => {
  const {
    rules,
    level,
    wordsToMemorize,
    userAnswers,
    setAnswer,
    finishGame,
    phaseDeadline,
    resetGame,
    pending,
    error,
  } = useWordsGameStore();

  const { timeLeft } = usePhaseTimer(phaseDeadline, () => void finishGame());
  const [activeSlot, setActiveSlot] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const total = wordsToMemorize.length;
  const filledCount = Object.values(userAnswers).filter(
    (ans) => ans && ans.trim().length > 0
  ).length;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    currentIndex: number
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (!e.shiftKey) {
        e.preventDefault();
        const next = (currentIndex + 1) % total;
        setActiveSlot(next);
        inputRefs.current[next]?.focus();
      } else if (e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        const prev = (currentIndex - 1 + total) % total;
        setActiveSlot(prev);
        inputRefs.current[prev]?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (currentIndex + 1) % total;
      setActiveSlot(next);
      inputRefs.current[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (currentIndex - 1 + total) % total;
      setActiveSlot(prev);
      inputRefs.current[prev]?.focus();
    }
  };

  return (
    <div className="play flex min-h-dvh flex-col bg-[#f5faf7] font-sans">
      <GameHeader
        gameName="Ghi nhớ từ"
        level={level ?? 1}
        daily={rules?.mode === "daily"}
        status={`Nhớ lại · đã điền ${filledCount} trên ${total} từ`}
        progress={total > 0 ? filledCount / total : 0}
        timeLeft={timeLeft}
        timeLimit={rules?.recallLimitSec}
        actionLabel={pending === "submit" ? "Đang chấm..." : "Nộp bài"}
        actionBusy={pending === "submit"}
        onAction={() => void finishGame()}
        onReset={resetGame}
      />

      <RoundStatusBar
        pendingText={pending === "submit" ? "Đang gửi bài và tính điểm..." : null}
        error={error}
      />

      <main className="flex flex-1 flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-4xl rounded-3xl border border-[#e0eee6] bg-white p-6 sm:p-8 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Nhập lại các từ vựng theo đúng thứ tự
              </h2>
              <p className="text-xs text-slate-500">
                Gõ từ vào ô tương ứng, dùng phím Tab hoặc Enter để nhảy sang ô tiếp theo.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#1a7a4a]">
              Đã điền: {filledCount} / {total}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {wordsToMemorize.map((_, index) => {
              const isActive = activeSlot === index;
              const value = userAnswers[index] || "";

              return (
                <div
                  key={`word-slot-${index}`}
                  className={`flex items-center rounded-xl border-2 px-3 py-2 transition-all cursor-text ${
                    isActive
                      ? "border-amber-400 bg-amber-50 shadow-inner ring-2 ring-amber-300"
                      : value.trim().length > 0
                      ? "border-emerald-500 bg-emerald-50/40"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                  onClick={() => {
                    setActiveSlot(index);
                    inputRefs.current[index]?.focus();
                  }}
                >
                  <span className="mr-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-200/80 text-xs font-bold text-slate-700 select-none">
                    {index + 1}
                  </span>
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    value={value}
                    onChange={(e) => setAnswer(index, e.target.value)}
                    onFocus={() => setActiveSlot(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-hidden placeholder:text-slate-400"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <PlayHints hints={HINTS} />
    </div>
  );
};
