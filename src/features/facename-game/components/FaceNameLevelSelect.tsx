import { ArrowLeft, Lock, Play, Trophy, Users, Clock } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";

export const FaceNameLevelSelect = () => {
  const { levels, stats, startLevelGame, setPhase } = useFaceNameStore();

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center px-4 py-8 text-[#1f2937]">
      <div className="w-full max-w-4xl">
        {/* Navigation & Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPhase("home")}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-[#3d4a5c] transition hover:bg-[#e6efe8] hover:text-[#1f2937]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <div className="text-sm font-bold text-[#2e7d32]">
            Tiến độ: {stats.unlockedLevel}/10 cấp đã mở
          </div>
        </div>

        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold sm:text-3xl text-[#1f2937]">
            Chọn Cấp Độ Thử Thách
          </h1>
          <p className="mt-1 text-sm text-[#77839a]">
            Vượt qua từng cấp với số điểm yêu cầu để mở khóa cấp độ tiếp theo.
          </p>
        </div>

        {/* Level Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {levels.map((lvl) => {
            const isUnlocked = lvl.levelId <= stats.unlockedLevel;
            const isCompleted = stats.completedLevels.includes(lvl.levelId);
            const bestScore = stats.bestScores[lvl.levelId];

            return (
              <div
                key={lvl.levelId}
                className={`relative flex flex-col justify-between rounded-3xl border p-6 transition-all ${
                  isUnlocked
                    ? "border-[#e6efe8] bg-white shadow-sm hover:border-[#2e7d32]/40 hover:shadow-md cursor-pointer"
                    : "border-slate-200 bg-slate-50/70 opacity-70"
                }`}
                onClick={() => {
                  if (isUnlocked) {
                    startLevelGame(lvl.levelId);
                  }
                }}
              >
                {/* Header of card */}
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm ${
                          isCompleted
                            ? "bg-[#2e7d32] text-white"
                            : isUnlocked
                            ? "bg-[#e6efe8] text-[#2e7d32]"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {lvl.levelId}
                      </span>
                      <span className="font-bold text-[#1f2937]">Cấp độ {lvl.levelId}</span>
                    </div>

                    {!isUnlocked ? (
                      <span className="flex items-center gap-1 rounded-full bg-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        <Lock className="h-3 w-3" />
                        Đang khóa
                      </span>
                    ) : isCompleted ? (
                      <span className="flex items-center gap-1 rounded-full bg-[#e6efe8] px-2.5 py-1 text-xs font-bold text-[#2e7d32]">
                        <Trophy className="h-3 w-3" />
                        Đã vượt
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                        Sẵn sàng
                      </span>
                    )}
                  </div>

                  <h3 className="mb-2 text-base font-bold text-[#1f2937]">{lvl.nameType}</h3>

                  <div className="space-y-1.5 text-xs text-[#3d4a5c]">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-[#2e7d32]" />
                      <span>{lvl.faceCount} khuôn mặt cần nhớ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-sky-600" />
                      <span>
                        Ghi nhớ: {lvl.memorizeSeconds}s • Hồi tưởng: {lvl.recallSeconds}s
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer of card */}
                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="text-xs">
                    {bestScore !== undefined ? (
                      <div>
                        <span className="text-slate-400">Kỷ lục: </span>
                        <strong className="text-[#2e7d32]">
                          {bestScore > 0 ? `+${bestScore}` : bestScore}
                        </strong>
                        <span className="text-slate-400">/{lvl.faceCount} điểm</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Chưa có kỷ lục</span>
                    )}
                  </div>

                  {isUnlocked && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2e7d32] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#1f5c23]"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      Chơi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

