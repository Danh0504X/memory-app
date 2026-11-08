import type { FC } from "react";
import { Link } from "react-router-dom";
import { Check, X, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { Confetti } from "@/features/shared-game/components/Confetti";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";
import { useWordsGameStore } from "../store/wordsGameStore";

export const WordsResultPhase: FC = () => {
  const { result, session, resetGame, startGame } = useWordsGameStore();

  if (!result) return null;

  const { score, totalWords, requiredScore, passed, timeSpent, review, level, unlockedNextLevel } =
    result;

  const handleNextLevel = () => {
    if (unlockedNextLevel) {
      void startGame({ gameLevel: unlockedNextLevel, memorizeSec: session?.memorizeSec || 60 });
    }
  };

  const handlePlayAgain = () => {
    void startGame({ gameLevel: level, memorizeSec: session?.memorizeSec || 60 });
  };

  return (
    <div className="play flex min-h-dvh flex-col bg-[#f5faf7] font-sans text-slate-800">
      {passed && <Confetti />}

      <GameHeader
        gameName="Ghi nhớ từ"
        level={level}
        status={`Kết quả · đúng ${score} trên ${totalWords} từ`}
        progress={totalWords > 0 ? score / totalWords : 0}
        onReset={resetGame}
      />

      <main className="flex flex-1 flex-col items-center justify-start p-4 sm:p-8">
        <div className="w-full max-w-4xl space-y-6">
          {/* Card tổng kết kết quả */}
          <section className="flex flex-col items-center rounded-3xl border border-[#e0eee6] bg-white p-6 sm:p-8 text-center shadow-sm">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
                passed
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {passed ? "Đạt rồi! (Passed)" : "Chưa đạt (Need Practice)"}
            </span>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-800 sm:text-4xl">
              {score} / {totalWords} từ đúng
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Yêu cầu qua màn: ít nhất <strong>{requiredScore}</strong> từ đúng.
              Thời gian nhớ lại: <strong>{formatSeconds(timeSpent)}</strong>.
            </p>

            {passed && unlockedNextLevel && (
              <p className="mt-3 text-sm font-semibold text-[#1a7a4a]">
                🎉 Chúc mừng! Bạn đã mở khóa <strong>Cấp độ {unlockedNextLevel}</strong>.
              </p>
            )}

            {/* Các nút hành động */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePlayAgain}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-xs hover:border-[#1a7a4a] hover:text-[#1a7a4a] transition-all cursor-pointer"
              >
                <RotateCcw size={16} />
                Chơi lại cấp {level}
              </button>

              {passed && unlockedNextLevel && (
                <button
                  type="button"
                  onClick={handleNextLevel}
                  className="flex items-center gap-2 rounded-xl bg-[#1a7a4a] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#15633c] transition-all cursor-pointer"
                >
                  Lên cấp {unlockedNextLevel}
                  <ArrowRight size={16} />
                </button>
              )}

              <Link
                to="/games"
                className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft size={16} />
                Chọn trò chơi
              </Link>
            </div>
          </section>

          {/* Bảng chi tiết đối chiếu đáp án */}
          <section className="rounded-3xl border border-[#e0eee6] bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-800">
              Chi tiết câu trả lời ({score}/{totalWords})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-center w-16">STT</th>
                    <th className="py-2.5 px-3">Từ gốc (Đúng)</th>
                    <th className="py-2.5 px-3">Bạn đã nhập</th>
                    <th className="py-2.5 px-3 text-center w-24">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {review.map((item) => {
                    const isCorrect = item.correct;
                    const hasAnswer = item.answer && item.answer.trim().length > 0;

                    return (
                      <tr
                        key={`review-item-${item.index}`}
                        className={isCorrect ? "bg-emerald-50/20" : "bg-rose-50/20"}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {item.index}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {item.expected}
                        </td>
                        <td className="py-3 px-3">
                          {hasAnswer ? (
                            <span
                              className={`font-semibold ${
                                isCorrect ? "text-emerald-700" : "text-rose-600 line-through"
                              }`}
                            >
                              {item.answer}
                            </span>
                          ) : (
                            <span className="italic text-slate-400">(Bỏ trống)</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isCorrect ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                              <Check size={12} /> Đúng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                              <X size={12} /> Sai
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

