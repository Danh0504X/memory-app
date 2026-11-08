import { X, Trophy, Target, Hash, CheckCircle2 } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";

interface FaceNameStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaceNameStatsModal = ({ isOpen, onClose }: FaceNameStatsModalProps) => {
  const { stats, levels } = useFaceNameStore();

  if (!isOpen) return null;

  const averageAccuracy =
    stats.totalAccuracies.length > 0
      ? Math.round(
          stats.totalAccuracies.reduce((a, b) => a + b, 0) /
            stats.totalAccuracies.length,
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e6efe8] bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e6efe8] text-[#2e7d32]">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f2937]">Thống kê thành tích</h2>
            <p className="text-xs text-[#77839a]">Quá trình rèn luyện FaceName của bạn</p>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#e6efe8] bg-slate-50 p-4 text-center">
            <Hash className="mx-auto mb-1 h-5 w-5 text-[#2e7d32]" />
            <div className="text-xs font-semibold text-[#77839a]">Tổng ván</div>
            <div className="text-xl font-bold text-[#1f2937]">{stats.totalRounds}</div>
          </div>

          <div className="rounded-2xl border border-[#e6efe8] bg-slate-50 p-4 text-center">
            <Target className="mx-auto mb-1 h-5 w-5 text-sky-600" />
            <div className="text-xs font-semibold text-[#77839a]">Độ chính xác</div>
            <div className="text-xl font-bold text-[#1f2937]">
              {stats.totalAccuracies.length > 0 ? `${averageAccuracy}%` : "—"}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e6efe8] bg-slate-50 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-amber-600" />
            <div className="text-xs font-semibold text-[#77839a]">Đã vượt</div>
            <div className="text-xl font-bold text-[#1f2937]">
              {stats.completedLevels.length}/10 cấp
            </div>
          </div>
        </div>

        {/* Level-by-level Breakdown */}
        <h3 className="mb-3 text-sm font-bold text-[#1f2937]">Điểm cao nhất từng cấp độ</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {levels.map((lvl) => {
            const best = stats.bestScores[lvl.levelId];
            const isCompleted = stats.completedLevels.includes(lvl.levelId);
            const isUnlocked = lvl.levelId <= stats.unlockedLevel;

            return (
              <div
                key={lvl.levelId}
                className="flex items-center justify-between rounded-xl border border-[#e6efe8] p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                      isCompleted
                        ? "bg-[#2e7d32] text-white"
                        : isUnlocked
                        ? "bg-[#e6efe8] text-[#2e7d32]"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {lvl.levelId}
                  </span>
                  <div>
                    <div className="font-semibold text-[#1f2937]">Cấp độ {lvl.levelId}</div>
                    <div className="text-xs text-[#77839a]">
                      {lvl.faceCount} người • {lvl.nameType}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {best !== undefined ? (
                    <div className="font-bold text-[#2e7d32]">
                      {best > 0 ? `+${best}` : best} / {lvl.faceCount} điểm
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">
                      {isUnlocked ? "Chưa chơi" : "Đang khóa"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#2e7d32] py-2.5 text-sm font-bold text-white transition hover:bg-[#1f5c23]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

