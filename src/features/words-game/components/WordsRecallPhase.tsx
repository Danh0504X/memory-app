import { useEffect, useRef } from "react";
import { useWordsGameStore } from "../store/wordsGameStore";
import { usePhaseTimer } from "@/features/cards-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";

export const WordsRecallPhase = () => {
    const {
        wordsToMemorize,
        userRecallWords,
        updateUserWord,
        setUserRecallWords,
        phaseDeadline,
        finishGame,
        resetGame,
        level,
    } = useWordsGameStore();

    const { formattedTime } = usePhaseTimer(phaseDeadline, finishGame);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const filledCount = userRecallWords.filter((w) => w.trim() !== "").length;
    const isComplete = filledCount === wordsToMemorize.length;

    // Tự động focus vào ô input đầu tiên khi vừa vào màn hình làm bài
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Chèn thêm một ô nhớ tại vị trí index, dồn các từ phía sau xuống
    const handleInsertWord = (index: number) => {
        const nextWords = [...userRecallWords];
        nextWords.splice(index, 0, "");
        if (nextWords.length > wordsToMemorize.length) {
            nextWords.pop();
        }
        setUserRecallWords(nextWords);
        setTimeout(() => inputRefs.current[index]?.focus(), 10);
    };

    // Xóa ô nhớ tại vị trí index, kéo các từ phía sau lên
    const handleDeleteWord = (index: number) => {
        const nextWords = [...userRecallWords];
        nextWords.splice(index, 1);
        nextWords.push("");
        setUserRecallWords(nextWords);
        setTimeout(() => inputRefs.current[index]?.focus(), 10);
    };

    // Điều hướng bàn phím thông minh theo hướng dẫn thi đấu
    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        index: number
    ) => {
        if (e.key === "Enter" || e.key === "ArrowDown") {
            e.preventDefault();
            if (index < wordsToMemorize.length - 1) {
                inputRefs.current[index + 1]?.focus();
            } else {
                finishGame();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === "+" || e.key === "Insert") {
            e.preventDefault();
            handleInsertWord(index);
        } else if (e.key === "-" && (e.currentTarget.value === "" || e.altKey)) {
            e.preventDefault();
            handleDeleteWord(index);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            {/* Header dùng chung */}
            <GameHeader
                gameName="Từ ngẫu nhiên"
                level={level}
                subtitle={`Đã điền ${filledCount}/${wordsToMemorize.length} từ`}
                formattedTime={formattedTime}
                actionButtonText="Nộp bài ➔"
                onAction={finishGame}
                onReset={resetGame}
                actionButtonColor={isComplete ? "#2e7d32" : "#1a7a4a"}
            />

            {/* Khung nhập từ theo danh sách 1..N (Memory League style) */}
            <main className="flex flex-1 flex-col items-center p-6">
                <section className="flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl border border-[#e0eee6] bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex w-full items-center justify-between border-b border-[#f0f5f2] pb-4">
                        <div>
                            <h2 className="text-base font-bold text-[#1f2937]">
                                Gõ lại các từ theo đúng thứ tự
                            </h2>
                            <p className="text-xs text-[#77839a]">
                                Phím <kbd className="rounded border bg-gray-100 px-1 py-0.5 text-[10px] font-mono">Enter</kbd> / <kbd className="rounded border bg-gray-100 px-1 py-0.5 text-[10px] font-mono">↓</kbd> để nhảy ô • Phím <kbd className="rounded border bg-gray-100 px-1 py-0.5 text-[10px] font-mono text-[#1a7a4a] font-bold">+</kbd> chèn ô • Phím <kbd className="rounded border bg-gray-100 px-1 py-0.5 text-[10px] font-mono text-[#c93b2b] font-bold">-</kbd> xóa ô
                            </p>
                        </div>
                        <span className="rounded-full bg-[#e6f7ed] px-3 py-1 text-xs font-bold text-[#1a7a4a]">
                            {filledCount}/{wordsToMemorize.length}
                        </span>
                    </div>

                    {/* Danh sách các ô nhập dạng lưới 1 hoặc 2 cột tùy số lượng từ */}
                    <div className={`grid w-full gap-3.5 ${wordsToMemorize.length > 8 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                        {wordsToMemorize.map((_, index) => (
                            <div
                                key={`word-input-${index}`}
                                className="group flex items-center gap-2.5 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-2 transition focus-within:border-[#1a7a4a] focus-within:bg-[#f2faf5] focus-within:ring-2 focus-within:ring-[#1a7a4a]/20"
                            >
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#77839a] shadow-xs">
                                    {index + 1}
                                </span>
                                <input
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    type="text"
                                    value={userRecallWords[index] || ""}
                                    onChange={(e) => updateUserWord(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    placeholder={`Từ thứ ${index + 1}...`}
                                    className="w-full bg-transparent px-2 py-1 text-base font-bold text-[#1f2937] placeholder:text-[#a0ab9f] placeholder:font-normal focus:outline-none"
                                    autoComplete="off"
                                    spellCheck={false}
                                />
                                
                                {/* Nút thao tác nhanh chèn / xóa dòng */}
                                <div className="flex shrink-0 items-center gap-1 opacity-40 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                    <button
                                        type="button"
                                        onClick={() => handleInsertWord(index)}
                                        title="Chèn thêm ô trống tại vị trí này (+)"
                                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-[#1a7a4a] shadow-2xs hover:bg-[#e6f7ed] cursor-pointer"
                                    >
                                        +
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteWord(index)}
                                        title="Xóa ô này (-)"
                                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-xs font-bold text-[#c93b2b] shadow-2xs hover:bg-[#fdeeed] cursor-pointer"
                                    >
                                        −
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
