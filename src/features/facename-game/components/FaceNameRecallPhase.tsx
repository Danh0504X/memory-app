import { useEffect, useRef, useState } from "react";
import { Clock, Send, Loader2, X } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceAvatar } from "./FaceAvatar";

export const FaceNameRecallPhase = () => {
  const {
    recallPeople,
    userAnswers,
    updateAnswer,
    settings,
    recallDeadline,
    submitCurrentRound,
    isSubmitting,
    goHome,
    currentMode,
    currentLevelId,
  } = useFaceNameStore();

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!recallDeadline) return settings.recallSeconds;
    return Math.max(0, Math.ceil((recallDeadline - Date.now()) / 1000));
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasTriggeredSubmitRef = useRef(false);

  // Auto focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!recallDeadline) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((recallDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && !hasTriggeredSubmitRef.current) {
        hasTriggeredSubmitRef.current = true;
        clearInterval(interval);
        submitCurrentRound();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [recallDeadline, submitCurrentRound]);

  const handleSubmit = async () => {
    if (hasTriggeredSubmitRef.current || isSubmitting) return;
    hasTriggeredSubmitRef.current = true;
    await submitCurrentRound();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      // Move to next input without submitting
      if (index < recallPeople.length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const totalSeconds = settings.recallSeconds;
  const progressRatio = Math.max(0, Math.min(1, timeLeft / (totalSeconds || 1)));
  const isUrgent = timeLeft <= 10;

  const filledCount = Object.values(userAnswers).filter((v) => v.trim() !== "").length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col px-4 py-6 text-[#1f2937]">
      <div className="mx-auto w-full max-w-6xl">
        {/* Top Control Bar */}
        <header className="sticky top-0 z-20 mb-6 flex flex-col gap-3 rounded-2xl border border-[#e6efe8] bg-white/95 p-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[#e6efe8] px-3 py-1 text-xs font-bold text-[#2e7d32]">
                {currentMode === "level" ? `Cấp độ ${currentLevelId}` : "Tự do"}
              </span>
              <div className="text-sm font-bold text-[#1f2937]">
                Pha Hồi tưởng • Đã điền: {filledCount}/{recallPeople.length}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer badge */}
              <div
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-sm font-extrabold transition-colors ${
                  isUrgent
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : "bg-slate-100 text-[#1f2937]"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2e7d32] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1f5c23] disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Nộp bài
                  </>
                )}
              </button>

              {/* Exit button */}
              <button
                type="button"
                onClick={goHome}
                disabled={isSubmitting}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                title="Thoát ván"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Timer Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-300 ease-linear ${
                isUrgent ? "bg-red-500" : "bg-[#2e7d32]"
              }`}
              style={{ width: `${progressRatio * 100}%` }}
            />
          </div>
        </header>

        {/* Instructions banner */}
        <div className="mb-4 text-xs text-[#77839a] flex items-center justify-between">
          <span>Khuôn mặt đã được xáo trộn. Nhập tên gọi tương ứng cho mỗi người:</span>
          <span>Phím <kbd className="rounded border bg-slate-100 px-1 py-0.5 text-[10px] font-mono">Enter</kbd> để nhảy ô</span>
        </div>

        {/* Shuffled faces with input boxes */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 animate-in fade-in duration-300">
          {recallPeople.map((person, index) => {
            const currentAnswer = userAnswers[person.id] || "";
            return (
              <div
                key={person.id}
                className="group relative flex flex-col items-center rounded-3xl border border-[#e6efe8] bg-white p-3 shadow-xs transition-all focus-within:border-[#2e7d32] focus-within:shadow-md"
              >
                <span className="absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                  {index + 1}
                </span>

                <div className="mt-2 mb-3">
                  <FaceAvatar src={person.imageUrl} alt={`Person ${person.id}`} size="md" />
                </div>

                <div className="w-full">
                  <input
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    placeholder="Nhập tên..."
                    value={currentAnswer}
                    maxLength={50}
                    onChange={(e) => updateAnswer(person.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-center text-sm font-bold text-[#1f2937] placeholder:text-slate-400 focus:border-[#2e7d32] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

