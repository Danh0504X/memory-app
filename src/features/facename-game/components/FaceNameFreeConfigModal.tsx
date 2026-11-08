import { useState } from "react";
import { X, Play, Sliders, Clock, Users } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";

interface FaceNameFreeConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaceNameFreeConfigModal = ({
  isOpen,
  onClose,
}: FaceNameFreeConfigModalProps) => {
  const { startFreeGame } = useFaceNameStore();
  const [faceCount, setFaceCount] = useState<number>(10);
  const [memorizeSeconds, setMemorizeSeconds] = useState<number>(60);
  const [recallSeconds, setRecallSeconds] = useState<number>(120);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStart = async () => {
    if (faceCount < 3 || faceCount > 30) {
      setError("Số lượng khuôn mặt phải từ 3 đến 30");
      return;
    }
    if (memorizeSeconds < 10 || memorizeSeconds > 300) {
      setError("Thời gian ghi nhớ phải từ 10 đến 300 giây");
      return;
    }
    if (recallSeconds < 10 || recallSeconds > 300) {
      setError("Thời gian hồi tưởng phải từ 10 đến 300 giây");
      return;
    }

    setError(null);
    onClose();
    await startFreeGame(faceCount, memorizeSeconds, recallSeconds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-[#e6efe8] bg-white p-6 shadow-xl sm:p-8">
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
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#1f2937]">Tự do luyện tập</h2>
            <p className="text-xs text-[#77839a]">Tùy biến số lượng và thời gian theo ý muốn</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Face count */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label htmlFor="faceCount" className="flex items-center gap-1.5 font-bold text-[#1f2937]">
                <Users className="h-4 w-4 text-[#2e7d32]" />
                Số lượng khuôn mặt
              </label>
              <span className="rounded-md bg-[#e6efe8] px-2 py-0.5 text-xs font-bold text-[#2e7d32]">
                {faceCount} người
              </span>
            </div>
            <input
              id="faceCount"
              type="range"
              min={3}
              max={30}
              step={1}
              value={faceCount}
              onChange={(e) => setFaceCount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#2e7d32]"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>3</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {/* Memorize time */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label htmlFor="memorizeTime" className="flex items-center gap-1.5 font-bold text-[#1f2937]">
                <Clock className="h-4 w-4 text-[#2e7d32]" />
                Thời gian ghi nhớ
              </label>
              <span className="rounded-md bg-[#e6efe8] px-2 py-0.5 text-xs font-bold text-[#2e7d32]">
                {memorizeSeconds}s ({Math.floor(memorizeSeconds / 60)}p {memorizeSeconds % 60}s)
              </span>
            </div>
            <input
              id="memorizeTime"
              type="range"
              min={10}
              max={300}
              step={5}
              value={memorizeSeconds}
              onChange={(e) => setMemorizeSeconds(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#2e7d32]"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>10s</span>
              <span>60s</span>
              <span>300s (5p)</span>
            </div>
          </div>

          {/* Recall time */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <label htmlFor="recallTime" className="flex items-center gap-1.5 font-bold text-[#1f2937]">
                <Clock className="h-4 w-4 text-[#2e7d32]" />
                Thời gian hồi tưởng
              </label>
              <span className="rounded-md bg-[#e6efe8] px-2 py-0.5 text-xs font-bold text-[#2e7d32]">
                {recallSeconds}s ({Math.floor(recallSeconds / 60)}p {recallSeconds % 60}s)
              </span>
            </div>
            <input
              id="recallTime"
              type="range"
              min={10}
              max={300}
              step={10}
              value={recallSeconds}
              onChange={(e) => setRecallSeconds(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#2e7d32]"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>10s</span>
              <span>120s</span>
              <span>300s (5p)</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2e7d32] py-3 text-sm font-bold text-white shadow-md hover:bg-[#1f5c23] transition"
          >
            <Play className="h-4 w-4 fill-current" />
            Bắt đầu chơi
          </button>
        </div>
      </div>
    </div>
  );
};

