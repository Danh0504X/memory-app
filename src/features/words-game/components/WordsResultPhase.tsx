import type { FC } from "react";
import { Check, X } from "lucide-react";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useWordsGameStore } from "../store/wordsGameStore";

export const WordsResultPhase: FC = () => {
  const { result, level, resetGame, startGame, pending } = useWordsGameStore();
  const { game } = useGameCatalog("word");

  if (!result) return null;

  const { result: roundResult, rules } = result;

  const review = roundResult.perItem.map((item, index) => ({
    index: index + 1,
    expected: item.expected.label || item.expected.code,
    answer: item.answer ? item.answer.label || item.answer.code : null,
    correct: item.correct,
  }));

  return (
    <div className="play">
      <GameHeader
        gameName="Ghi nhớ từ"
        level={level}
        daily={rules.mode === "daily"}
        status={`Kết quả · đúng ${roundResult.correctItems} trên ${roundResult.totalItems} từ`}
        progress={roundResult.accuracy}
        onReset={resetGame}
      />

      <RoundResultCard
        round={result}
        maxLevel={game?.maxLevel ?? 10}
        onPlayAgain={() =>
          void startGame({
            memorizeSec: rules.memorizeLimitSec,
            gameLevel: rules.gameLevel ?? 1,
            customWordCount: rules.mode === "custom" ? rules.totalItems : null,
          })
        }
        onNextLevel={(nextLevel) =>
          void startGame({
            memorizeSec: rules.memorizeLimitSec,
            gameLevel: nextLevel,
            customWordCount: null,
          })
        }
        busy={pending !== null}
        onReset={resetGame}
      />

      <section className="round page-col" style={{ marginTop: 24, paddingBottom: 48 }}>
        <div className="rounded-3xl border border-[#e0eee6] bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-slate-800">
            Chi tiết câu trả lời ({roundResult.correctItems}/{roundResult.totalItems})
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
              <tbody className="divide-y border-slate-100">
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
        </div>
      </section>
    </div>
  );
};
