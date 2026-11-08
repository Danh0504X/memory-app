import { useEffect, type CSSProperties } from "react";
import { ArrowRight, RotateCcw, Home, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";

const CONFETTI_COLORS = ["#f4c95d", "#ffffff", "#cdebd6", "#cfe7f3", "#f7dc8e"];

const CONFETTI = Array.from({ length: 36 }, (_, i) => ({
  "--x": `${(i * 37) % 100}%`,
  "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  "--d": `${(i % 9) * 90}ms`,
  "--t": `${1600 + ((i * 53) % 900)}ms`,
  "--r": `${((i * 71) % 540) - 270}deg`,
})) as CSSProperties[];

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export const FaceNameResultPhase = () => {
  const {
    result,
    memorizePeople,
    retryCurrentRound,
    goToNextLevel,
    goHome,
    currentLevelId,
  } = useFaceNameStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") retryCurrentRound();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [retryCurrentRound]);

  if (!result) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isLevelMode = result.mode === "level";
  const canGoNextLevel = isLevelMode && result.isPassed && result.levelId && result.levelId < 10;
  const celebrate = result.isPassed;
  const verdict = result.accuracy === 100 ? "Hoàn hảo!" : result.isPassed ? "Đạt rồi!" : "Chưa đạt";

  let goalText = "Cần đạt điểm chuẩn để mở khóa cấp tiếp theo.";
  if (result.isPassed) {
    goalText = canGoNextLevel
      ? `Bạn đã mở khóa Cấp độ ${(result.levelId || 1) + 1}!`
      : "Bạn đã hoàn thành xuất sắc thử thách!";
  }

  return (
    <div className="play">
      <GameHeader
        gameName="Gương mặt & Tên"
        level={isLevelMode ? currentLevelId : null}
        status="Kết quả lượt chơi"
        onReset={goHome}
      />

      <section
        className="play__table score"
        data-result={result.isPassed ? "pass" : "fail"}
        aria-labelledby="score-verdict"
      >
        {celebrate && (
          <div className="confetti" aria-hidden="true">
            {CONFETTI.map((style, i) => (
              <i key={i} style={style} />
            ))}
          </div>
        )}

        <h1 id="score-verdict" className="score__verdict" style={rise(0)}>
          {verdict}
        </h1>

        <p className="score__count" style={rise(1)}>
          {result.score > 0 ? `+${result.score}` : result.score}{" "}
          <small>/ {result.maxScore} điểm</small>
        </p>

        <div className="score__meter" style={rise(2)}>
          <span style={{ transform: `scaleX(${Math.max(0, Math.min(1, result.accuracy / 100))})` }} />
        </div>

        <p className="score__line" style={rise(3)}>
          Độ chính xác: <strong>{result.accuracy}%</strong> • Đúng{" "}
          <strong>{result.correctCount}</strong>, sai {result.incorrectCount}, trống{" "}
          {result.blankCount}
        </p>

        <p className="score__meta" style={rise(4)}>
          {goalText} • Thời gian làm bài: {formatTime(result.timeUsedSeconds)}
        </p>

        <div className="score__actions" style={rise(5)}>
          <button type="button" className="btn btn--sun" onClick={retryCurrentRound}>
            <RotateCcw size={18} aria-hidden="true" />
            Chơi lại
          </button>

          {canGoNextLevel && (
            <button type="button" className="btn btn--brand" onClick={goToNextLevel}>
              Cấp tiếp theo
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}

          <button type="button" className="btn btn--on-table" onClick={goHome}>
            <Home size={18} aria-hidden="true" />
            Chọn cấp độ
          </button>
        </div>
      </section>

      {/* Review Section */}
      <section className="page-col my-8 mx-auto w-full max-w-4xl">
        <h2 className="mb-4 text-center text-lg font-bold text-[#1f2937]">
          Chi tiết bài làm đối chiếu ({result.results.length} người)
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {result.results.map((item, index) => {
            const personMeta = memorizePeople.find((p) => p.id === item.personId);
            const imageUrl = personMeta?.imageUrl || "";

            return (
              <div
                key={item.personId}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                  item.isCorrect
                    ? "border-emerald-300 bg-emerald-50/70"
                    : item.isBlank
                    ? "border-slate-200 bg-slate-50/70"
                    : "border-rose-300 bg-rose-50/70"
                }`}
              >
                <span className="text-xs font-bold text-slate-400">
                  #{index + 1}
                </span>

                <div className="h-14 w-14 overflow-hidden rounded-xl border border-white bg-slate-100 shadow-sm shrink-0">
                  <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {item.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2e7d32]" />
                    ) : item.isBlank ? (
                      <MinusCircle className="h-4 w-4 shrink-0 text-slate-400" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <span className="truncate text-sm font-extrabold text-[#1f2937]">
                      {item.name}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-[#3d4a5c]">
                    <span className="text-slate-400">Bạn điền: </span>
                    {item.isBlank ? (
                      <span className="italic text-slate-400">(bỏ trống)</span>
                    ) : (
                      <span
                        className={`font-semibold ${
                          item.isCorrect ? "text-[#2e7d32]" : "text-rose-600 line-through"
                        }`}
                      >
                        {item.answer}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
