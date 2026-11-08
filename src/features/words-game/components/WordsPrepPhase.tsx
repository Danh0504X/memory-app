import { useEffect, useState, type FC } from "react";
import { Play } from "lucide-react";
import { useWordsGameStore } from "../store/wordsGameStore";

export const WordsPrepPhase: FC = () => {
  const { preferences, beginMemorization } = useWordsGameStore();
  const prepSeconds = preferences.prepTime || 5;
  const [secondsLeft, setSecondsLeft] = useState(prepSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      beginMemorization();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          beginMemorization();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, beginMemorization]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f5faf7] px-4 text-center font-sans">
      <div className="flex flex-col items-center rounded-3xl border border-[#e0eee6] bg-white p-8 shadow-lg sm:p-12">
        <p className="text-sm font-semibold tracking-wider text-[#1a7a4a] uppercase">
          Chuẩn bị ghi nhớ
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-800">
          Ván đấu sắp bắt đầu
        </h2>

        {/* Đồng hồ số đếm ngược to nổi bật */}
        <div className="my-8 flex h-28 w-28 items-center justify-center rounded-full border-4 border-emerald-500 bg-emerald-50 text-5xl font-extrabold text-[#1a7a4a] shadow-inner sm:h-32 sm:w-32 sm:text-6xl animate-pulse">
          {secondsLeft}
        </div>

        <p className="max-w-xs text-xs text-slate-500">
          Hãy hít thở sâu và sẵn sàng liên kết các từ vựng vào hành trình ghi nhớ của bạn.
        </p>

        <button
          type="button"
          onClick={beginMemorization}
          className="mt-6 flex items-center gap-2 rounded-xl bg-[#1a7a4a] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#15633c] transition-all cursor-pointer"
        >
          <Play size={16} fill="currentColor" />
          Bắt đầu ngay
        </button>
      </div>
    </div>
  );
};

