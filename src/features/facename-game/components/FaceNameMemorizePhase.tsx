import { useEffect, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceAvatar } from "./FaceAvatar";

export const FaceNameMemorizePhase = () => {
  const {
    memorizePeople,
    settings,
    memorizeDeadline,
    finishMemorize,
    goHome,
    currentMode,
    currentLevelId,
  } = useFaceNameStore();

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (!memorizeDeadline) return settings.memorizeSeconds;
    return Math.max(0, Math.ceil((memorizeDeadline - Date.now()) / 1000));
  });

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

  const totalSeconds = settings.memorizeSeconds;
  const progressRatio = Math.max(0, Math.min(1, timeLeft / (totalSeconds || 1)));
  const isUrgent = timeLeft <= 10;

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
                Pha Ghi nhớ • {memorizePeople.length} người
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

              {/* Done early button */}
              <button
                type="button"
                onClick={finishMemorize}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2e7d32] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1f5c23] active:scale-[0.98]"
              >
                <Check className="h-4 w-4" />
                Đã nhớ xong (Done)
              </button>

              {/* Exit button */}
              <button
                type="button"
                onClick={goHome}
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

        {/* Responsive Grid of Faces */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 sm:gap-4 animate-in fade-in duration-300">
          {memorizePeople.map((person, index) => (
            <div
              key={person.id}
              className="group relative flex flex-col items-center rounded-3xl border border-[#e6efe8] bg-white p-3 shadow-xs transition-all hover:border-[#2e7d32]/40 hover:shadow-md"
            >
              {/* Order badge */}
              <span className="absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                {index + 1}
              </span>

              {/* Face Avatar */}
              <div className="mt-2 mb-3">
                <FaceAvatar src={person.imageUrl} alt={person.name} size="md" />
              </div>

              {/* Person's First Name */}
              <div className="w-full text-center">
                <span className="inline-block max-w-full truncate text-base font-extrabold text-[#1f2937] tracking-tight">
                  {person.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

