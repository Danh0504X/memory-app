import { Trophy, RotateCcw, ArrowRight, Home, CheckCircle2, XCircle, MinusCircle, Clock, Award } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceAvatar } from "./FaceAvatar";

export const FaceNameResultPhase = () => {
  const {
    result,
    memorizePeople,
    retryCurrentRound,
    goToNextLevel,
    goHome,
    currentLevelId,
  } = useFaceNameStore();

  if (!result) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isLevelMode = result.mode === "level";
  const canGoNextLevel = isLevelMode && result.isPassed && result.levelId && result.levelId < 5;

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center px-4 py-8 text-[#1f2937]">
      <div className="w-full max-w-4xl">
        {/* Result Header Hero Card */}
        <div
          className={`mb-8 overflow-hidden rounded-3xl border p-6 text-center shadow-md sm:p-8 ${
            result.isPassed
              ? "border-[#cdebd6] bg-gradient-to-b from-[#e6efe8]/60 to-white"
              : "border-amber-200 bg-gradient-to-b from-amber-50/60 to-white"
          }`}
        >
          <div className="mb-3 inline-flex items-center justify-center">
            {result.isPassed ? (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2e7d32] text-white shadow-md">
                <Trophy className="h-8 w-8" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md">
                <Award className="h-8 w-8" />
              </div>
            )}
          </div>

          <h1 className="text-2xl font-extrabold sm:text-3xl text-[#1f2937]">
            {result.isPassed ? "Thành Công Vượt Qua!" : "Chưa Đạt Mục Tiêu"}
          </h1>

          <p className="mt-1 text-sm text-[#77839a]">
            {isLevelMode
              ? result.isPassed
                ? `Bạn đã xuất sắc vượt qua Cấp độ ${currentLevelId} (yêu cầu đạt tối thiểu 70% số điểm).`
                : `Cần đạt ít nhất 70% số điểm (${Math.ceil(0.7 * result.maxScore)} điểm) để mở khóa cấp tiếp theo.`
              : "Hoàn thành lượt luyện tập tự do."}
          </p>

          {/* Primary Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#e6efe8] bg-white p-4">
              <div className="text-xs font-semibold text-[#77839a]">Điểm chính thức</div>
              <div
                className={`text-2xl font-extrabold ${
                  result.score > 0 ? "text-[#2e7d32]" : "text-slate-700"
                }`}
              >
                {result.score > 0 ? `+${result.score}` : result.score} / {result.maxScore}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6efe8] bg-white p-4">
              <div className="text-xs font-semibold text-[#77839a]">Độ chính xác</div>
              <div className="text-2xl font-extrabold text-sky-600">
                {result.accuracy}%
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6efe8] bg-white p-4">
              <div className="text-xs font-semibold text-[#77839a]">Đúng / Sai / Trống</div>
              <div className="flex items-center justify-center gap-1.5 text-base font-extrabold mt-1">
                <span className="text-[#2e7d32]">{result.correctCount}</span>
                <span className="text-slate-300">/</span>
                <span className="text-red-500">{result.incorrectCount}</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400">{result.blankCount}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6efe8] bg-white p-4">
              <div className="text-xs font-semibold text-[#77839a]">Thời gian sử dụng</div>
              <div className="flex items-center justify-center gap-1 text-2xl font-extrabold text-[#1f2937]">
                <Clock className="h-5 w-5 text-slate-400" />
                <span>{formatTime(result.timeUsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={retryCurrentRound}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[#2e7d32] bg-white px-5 py-2.5 text-sm font-bold text-[#2e7d32] transition hover:bg-[#e6efe8]/40 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Chơi lại
            </button>

            {canGoNextLevel && (
              <button
                type="button"
                onClick={goToNextLevel}
                className="inline-flex items-center gap-2 rounded-xl bg-[#2e7d32] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1f5c23] active:scale-[0.98]"
              >
                <span>Cấp tiếp theo</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={goHome}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </button>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1f2937]">
            Chi tiết kết quả đối chiếu ({result.results.length} người)
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#2e7d32] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2e7d32]" /> Đúng (+1)
            </span>
            <span className="flex items-center gap-1 text-red-500 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Sai (-0.5)
            </span>
            <span className="flex items-center gap-1 text-slate-400 font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Trống (0)
            </span>
          </div>
        </div>

        {/* Result Cards Grid: Green for correct, red for incorrect, gray for blank */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {result.results.map((item, index) => {
            const personMeta = memorizePeople.find((p) => p.id === item.personId);
            const imageUrl = personMeta?.imageUrl || "";

            return (
              <div
                key={item.personId}
                className={`relative flex items-center gap-3 rounded-2xl border p-3.5 transition-all ${
                  item.isCorrect
                    ? "border-emerald-300 bg-emerald-50/60"
                    : item.isBlank
                    ? "border-slate-200 bg-slate-50/60"
                    : "border-rose-300 bg-rose-50/60"
                }`}
              >
                {/* Index badge */}
                <span className="absolute right-3 top-3 text-[10px] font-bold text-slate-400">
                  #{index + 1}
                </span>

                <FaceAvatar src={imageUrl} alt={item.name} size="sm" />

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
      </div>
    </div>
  );
};
