import { useWordsGameStore } from "../store/wordsGameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { GameResultCard } from "./GameResultCard";

const MAX_LEVEL = 10;

export const WordsResultPhase = () => {
    const {
        wordsToMemorize,
        userRecallWords,
        resetGame,
        level,
        setLevel,
    } = useWordsGameStore();

    // So khớp kết quả chính xác (không phân biệt chữ hoa/thường và khoảng trắng thừa)
    const results = wordsToMemorize.map((target, idx) => {
        const userInput = (userRecallWords[idx] || "").trim().toLowerCase();
        const targetWord = target.word.trim().toLowerCase();
        const isCorrect = userInput === targetWord && userInput.length > 0;
        return {
            target: target.word,
            user: userRecallWords[idx] || "",
            isCorrect,
        };
    });

    const score = results.filter((r) => r.isCorrect).length;

    const REQUIRED_SCORES: Record<number, number> = {
        1: 4,
        2: 7,
        3: 10,
        4: 12,
        5: 15,
        6: 18,
        7: 20,
        8: 24,
        9: 28,
    };

    const requiredScore = REQUIRED_SCORES[level] ?? wordsToMemorize.length;
    const isPassed = score >= requiredScore;

    const handlePlayAgain = () => {
        if (isPassed && level < MAX_LEVEL) {
            setLevel(level + 1);
        }
        resetGame();
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            {/* Header dùng chung */}
            <GameHeader
                gameName="Từ"
                level={level}
                status="Kết quả lượt chơi"
                onReset={resetGame}
            />

            <main className="flex flex-1 flex-col items-center gap-8 overflow-auto px-4 py-8">
                {/* Thẻ Điểm số dùng chung */}
                <GameResultCard
                    correctCount={score}
                    totalCount={wordsToMemorize.length}
                    level={level}
                    maxLevel={MAX_LEVEL}
                    onPlayAgain={handlePlayAgain}
                    onReset={resetGame}
                />

                {/* Bảng so sánh chi tiết bài làm với đáp án chuẩn */}
                <section className="w-full max-w-3xl rounded-3xl border border-[#e0eee6] bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="mb-6 text-center text-sm font-bold uppercase tracking-wider text-[#77839a]">
                        Chi tiết bài làm của bạn
                    </h2>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {results.map((res, index) => (
                            <div
                                key={`res-${index}`}
                                className={`flex items-center justify-between rounded-2xl border p-4 transition ${res.isCorrect
                                        ? "border-[#1a7a4a] bg-[#e6f7ed]/70"
                                        : "border-[#fca5a5] bg-[#fef2f2]"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${res.isCorrect
                                                ? "bg-[#1a7a4a] text-white"
                                                : "bg-[#ef4444] text-white"
                                            }`}
                                    >
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="text-sm font-bold text-[#1f2937]">
                                            {res.isCorrect ? (
                                                <span className="text-[#1a7a4a]">
                                                    {res.target}
                                                </span>
                                            ) : (
                                                <span className="line-through text-[#ef4444]">
                                                    {res.user ? res.user : "(Chưa điền)"}
                                                </span>
                                            )}
                                        </div>
                                        {!res.isCorrect && (
                                            <div className="text-xs font-semibold text-[#1a7a4a]">
                                                Đúng: {res.target}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <span
                                    className={`text-sm font-bold ${res.isCorrect ? "text-[#1a7a4a]" : "text-[#ef4444]"
                                        }`}
                                >
                                    {res.isCorrect ? "✓ Đúng" : "✗ Sai"}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
