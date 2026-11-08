import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Sliders, ArrowLeft, BarChart3, Sparkles, Brain } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameStatsModal } from "./FaceNameStatsModal";
import { FaceNameFreeConfigModal } from "./FaceNameFreeConfigModal";

export const FaceNameHome = () => {
  const { setPhase, stats } = useFaceNameStore();
  const [showStats, setShowStats] = useState(false);
  const [showFreeConfig, setShowFreeConfig] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 py-12 text-[#1f2937]">
      <div className="w-full max-w-2xl text-center">
        {/* Navigation back to games catalog */}
        <div className="mb-6 flex items-center justify-start">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold text-[#3d4a5c] transition hover:bg-[#e6efe8] hover:text-[#1f2937]"
          >
            <ArrowLeft className="h-4 w-4" />
            Về kho trò chơi
          </Link>
        </div>

        {/* Hero Badge & Title */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#cdebd6] bg-[#e6efe8]/60 px-4 py-1.5 text-xs font-bold text-[#2e7d32]">
          <Brain className="h-4 w-4" />
          Bộ môn Memory League: Names
        </div>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-[#1f2937]">
          FaceName Trainer
        </h1>

        <p className="mx-auto mb-8 max-w-lg text-base text-[#3d4a5c] sm:text-lg">
          Rèn luyện khả năng liên kết gương mặt và tên gọi. Ghi nhớ tên của các nhân vật trong thời gian giới hạn, sau đó điền lại chính xác khi các khuôn mặt bị xáo trộn.
        </p>

        {/* Quick Highlights / Stats summary pill */}
        <div className="mb-8 grid grid-cols-3 gap-3 rounded-2xl border border-[#e6efe8] bg-white p-4 shadow-sm">
          <div>
            <div className="text-xs font-semibold text-[#77839a]">Cấp độ mở khóa</div>
            <div className="text-xl font-bold text-[#2e7d32]">
              Cấp {stats.unlockedLevel}/10
            </div>
          </div>
          <div className="border-x border-[#e6efe8]">
            <div className="text-xs font-semibold text-[#77839a]">Số ván đã chơi</div>
            <div className="text-xl font-bold text-[#1f2937]">{stats.totalRounds}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-[#77839a]">Độ chính xác TB</div>
            <div className="text-xl font-bold text-[#1f2937]">
              {stats.totalAccuracies.length > 0
                ? `${Math.round(
                    stats.totalAccuracies.reduce((a, b) => a + b, 0) /
                      stats.totalAccuracies.length,
                  )}%`
                : "—"}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => setPhase("level-select")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2e7d32] px-6 py-3.5 text-base font-bold text-white shadow-md transition-all hover:bg-[#1f5c23] active:scale-[0.98]"
          >
            <Play className="h-5 w-5 fill-current" />
            Chơi theo cấp độ
          </button>

          <button
            type="button"
            onClick={() => setShowFreeConfig(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2e7d32] bg-white px-6 py-3.5 text-base font-bold text-[#2e7d32] transition-all hover:bg-[#e6efe8]/40 active:scale-[0.98]"
          >
            <Sliders className="h-5 w-5" />
            Tự do luyện tập
          </button>

          <button
            type="button"
            onClick={() => setShowStats(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6efe8] bg-white px-5 py-3.5 text-base font-semibold text-[#3d4a5c] transition-all hover:bg-slate-50 active:scale-[0.98]"
          >
            <BarChart3 className="h-5 w-5" />
            Thống kê
          </button>
        </div>

        {/* Guide / How to play bullet points */}
        <div className="mt-12 text-left rounded-2xl border border-[#e6efe8] bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-base font-bold text-[#1f2937] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2e7d32]" />
            Quy luật & Cách tính điểm
          </h2>
          <ul className="space-y-2 text-sm text-[#3d4a5c]">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2e7d32]">•</span>
              <span><strong>Pha Ghi nhớ:</strong> Quan sát các khuôn mặt và học thuộc tên gọi bên dưới. Bạn có thể nhấn "Hoàn thành" sớm nếu đã ghi nhớ xong.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2e7d32]">•</span>
              <span><strong>Pha Hồi tưởng:</strong> Các khuôn mặt sẽ bị xáo trộn vị trí ngẫu nhiên. Nhập tên tương ứng vào ô bên dưới mỗi khuôn mặt. Nhấn Enter để chuyển nhanh sang ô tiếp theo.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#2e7d32]">•</span>
              <span><strong>Tính điểm:</strong> Đúng: <strong>+1 điểm</strong> | Sai: <strong>-0.5 điểm</strong> | Bỏ trống: <strong>0 điểm</strong>. Đạt từ <strong>70%</strong> số điểm tối đa để vượt cấp và mở khóa cấp tiếp theo!</span>
            </li>
          </ul>
        </div>
      </div>

      <FaceNameStatsModal isOpen={showStats} onClose={() => setShowStats(false)} />
      <FaceNameFreeConfigModal
        isOpen={showFreeConfig}
        onClose={() => setShowFreeConfig(false)}
      />
    </div>
  );
};
