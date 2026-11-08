import { useEffect, useRef } from "react";
import { useWordsGameStore } from "../store/wordsGameStore";
import { usePhaseTimer } from "@/features/cards-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { GameFooterNav } from "./GameFooterNav";

export const WordsMemorizePhase = () => {
    const {
        wordsToMemorize,
        currentMemorizeIndex,
        nextMemorizeWord,
        prevMemorizeWord,
        setMemorizeIndex,
        finishMemorize,
        phaseDeadline,
        memorizeTime,
        level,
        resetGame,
        preferences,
    } = useWordsGameStore();

    const { timeLeft } = usePhaseTimer(phaseDeadline, finishMemorize);
    const lastRightArrowTimeRef = useRef<number>(0);

    const groupSize = Math.max(1, preferences.groups || 1);

    // Hỗ trợ phím tắt điều hướng nhanh như Memory League (Hướng dẫn thi đấu)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") {
                prevMemorizeWord();
            } else if (e.key === "ArrowRight") {
                const isAtEnd = currentMemorizeIndex >= wordsToMemorize.length - groupSize;
                if (isAtEnd) {
                    const now = Date.now();
                    // Nhấn 2 lần phím -> nhanh ở từ cuối cùng để kết thúc
                    if (now - lastRightArrowTimeRef.current < 500) {
                        finishMemorize();
                        return;
                    }
                    lastRightArrowTimeRef.current = now;
                }
                nextMemorizeWord();
            } else if (e.key === " " || e.key === "ArrowUp") {
                e.preventDefault();
                setMemorizeIndex(0); // Quay nhanh về từ đầu tiên
            } else if (e.key === "Enter") {
                finishMemorize();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [prevMemorizeWord, nextMemorizeWord, setMemorizeIndex, finishMemorize, currentMemorizeIndex, wordsToMemorize.length, groupSize]);

    const isFirst = currentMemorizeIndex === 0;
    const isLast = currentMemorizeIndex >= wordsToMemorize.length - groupSize;

    // Các từ đang hiển thị trong nhóm hiện tại
    const currentGroupWords = wordsToMemorize.slice(
        currentMemorizeIndex,
        currentMemorizeIndex + groupSize
    );

    // Lấy các từ kế tiếp để hiển thị ở cột xem trước bên phải
    const upcomingWords = wordsToMemorize.slice(
        currentMemorizeIndex + groupSize,
        currentMemorizeIndex + groupSize + 5
    );

    const LANGUAGE_LABELS: Record<string, string> = {
        vi: "Tiếng Việt",
        en: "Tiếng Anh",
        ko: "Tiếng Hàn",
        ja: "Tiếng Nhật",
        zh: "Tiếng Trung",
        th: "Tiếng Thái",
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            {/* Header dùng chung */}
            <GameHeader
                gameName="Từ"
                level={level}
                status={`Mục tiêu: Ghi nhớ chuẩn xác thứ tự ${wordsToMemorize.length} từ vựng (${LANGUAGE_LABELS[preferences.language] || "Tiếng Việt"})`}
                progress={(currentMemorizeIndex + 1) / wordsToMemorize.length}
                timeLeft={preferences.hideTimer ? undefined : timeLeft}
                timeLimit={memorizeTime}
                actionLabel="✓ Tôi đã nhớ xong"
                onAction={finishMemorize}
                onReset={resetGame}
            />

            {/* Khu vực ghi nhớ từ chính & danh sách xem trước */}
            <main className="relative flex flex-1 items-center justify-center px-4 py-8">
                <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-8 md:flex-row md:items-start md:justify-center">
                    
                    {/* Khung từ lớn ở trung tâm */}
                    <div className="flex flex-1 items-center justify-center">
                        <div className="relative flex min-h-[240px] w-full max-w-[480px] flex-col items-center justify-center rounded-[32px] border-2 border-[#e0eee6] bg-white p-8 shadow-xl transition-all">
                            <span className="absolute left-6 top-6 rounded-full bg-[#e6f7ed] px-3.5 py-1 text-xs font-bold text-[#1a7a4a]">
                                #{currentMemorizeIndex + 1}
                                {groupSize > 1 && ` - #${Math.min(wordsToMemorize.length, currentMemorizeIndex + groupSize)}`}
                            </span>
                            <span className="absolute right-6 top-6 text-xs font-semibold text-[#77839a]">
                                {currentMemorizeIndex + 1}/{wordsToMemorize.length}
                            </span>

                            {/* Hiển thị từ theo nhóm */}
                            <div className="flex w-full flex-col items-center gap-4 py-6">
                                {currentGroupWords.map((item, idx) => {
                                    const realNum = currentMemorizeIndex + 1 + idx;
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-center gap-3.5 text-center"
                                        >
                                            <span className="text-2xl font-extrabold text-[#94a3b8] sm:text-3xl">
                                                {realNum}.
                                            </span>
                                            <h2 className="text-3xl font-black tracking-wide text-[#1f2937] sm:text-5xl">
                                                {item.word}
                                            </h2>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Hướng dẫn phím tắt mờ ở góc dưới card */}
                            <div className="text-[11px] font-medium text-[#94a3b8]">
                                Dùng phím <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd> để lật • <kbd className="font-mono">Space</kbd> về đầu • <kbd className="font-mono">Enter</kbd> xong
                            </div>
                        </div>
                    </div>

                    {/* Cột xem trước các từ kế tiếp bên cạnh (Memory League style) */}
                    <div className="flex w-full max-w-[240px] flex-col gap-2 rounded-2xl border border-[#e0eee6] bg-white p-4 shadow-sm">
                        <span className="mb-1 text-xs font-bold uppercase tracking-wider text-[#77839a]">
                            Từ kế tiếp
                        </span>
                        {upcomingWords.length > 0 ? (
                            upcomingWords.map((item, idx) => {
                                const realIdx = currentMemorizeIndex + groupSize + idx;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setMemorizeIndex(realIdx)}
                                        className="flex items-center justify-between rounded-xl border border-[#f0f5f2] bg-[#f8faf9] px-3 py-2 text-left text-sm font-semibold text-[#40493d] transition hover:border-[#1a7a4a] hover:bg-[#e6f7ed] cursor-pointer"
                                    >
                                        <span className="text-xs font-bold text-[#77839a]">
                                            {realIdx + 1}.
                                        </span>
                                        <span className="font-bold text-[#1f2937]">
                                            {item.word}
                                        </span>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-4 text-center text-xs font-medium text-[#77839a]">
                                Đã đến từ cuối cùng!
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Thanh điều hướng footer dùng chung */}
            <GameFooterNav
                onFirst={() => setMemorizeIndex(0)}
                onPrev={prevMemorizeWord}
                onNext={nextMemorizeWord}
                isFirst={isFirst}
                isLast={isLast}
            />
        </div>
    );
};
