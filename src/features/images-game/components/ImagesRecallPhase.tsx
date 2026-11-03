import { useImagesGameStore } from "../store/imagesGameStore";
import { usePhaseTimer } from "@/features/cards-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";

export const ImagesRecallPhase = () => {
    const {
        imagesToMemorize,
        userRecall,
        shuffledDeck,
        selectedSlotIndex,
        phaseDeadline,
        placeImage,
        removeImage,
        selectSlot,
        finishGame,
        resetGame,
        level,
        pending,
        error,
    } = useImagesGameStore();

    const { formattedTime } = usePhaseTimer(phaseDeadline, finishGame);
    const filledCount = userRecall.filter(Boolean).length;
    const isComplete = filledCount === imagesToMemorize.length;

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                subtitle={`Đã điền ${filledCount}/${imagesToMemorize.length} hình ảnh`}
                formattedTime={formattedTime}
                actionButtonText={pending === "submit" ? "Đang chấm..." : "Nộp bài ➔"}
                onAction={finishGame}
                onReset={resetGame}
                actionButtonColor={isComplete ? "#2e7d32" : "#1a7a4a"}
            />
            <RoundStatusBar pendingText={pending === "submit" ? "Đang chấm bài..." : null} error={error} />

            <main className="flex flex-1 flex-col items-center justify-between gap-8 p-6">
                <section className="flex w-full max-w-4xl flex-col items-center gap-4 rounded-3xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <div className="flex w-full items-center justify-between text-sm font-bold text-[#77839a]">
                        <span>Xếp lại theo thứ tự ban đầu ({filledCount}/{imagesToMemorize.length})</span>
                        <span className="text-xs font-normal text-[#98a2b3]">Bấm vào ô để chọn vị trí xếp</span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3 p-2">
                        {userRecall.map((item, index) => {
                            const isSelected = selectedSlotIndex === index;
                            return (
                                <button
                                    key={`slot-${index}`}
                                    type="button"
                                    onClick={() => item ? removeImage(index) : selectSlot(index)}
                                    className={`relative flex h-20 w-20 items-center justify-center rounded-xl border-2 transition-all cursor-pointer ${item ? "border-[#1a7a4a] bg-[#e6f7ed] shadow-sm" : isSelected ? "border-[#1a7a4a] bg-[#e6f7ed] ring-2 ring-[#1a7a4a]" : "border-dashed border-[#c8d8d0] bg-[#f8faf9] hover:border-[#1a7a4a]"
                                        }`}
                                >
                                    <span className="absolute left-1.5 top-1 text-[11px] font-bold text-[#77839a]">{index + 1}</span>
                                    {item ? (
                                        <img
                                            src={item.imageUrl}
                                            alt="Ảnh đã chọn"
                                            className="h-16 w-16 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <span className="text-sm font-bold text-[#c8d8d0]">{isSelected ? "✎" : "+"}</span>
                                    )}
                                </button>

                            );
                        })}
                    </div>
                </section>

                <section className="flex w-full max-w-4xl flex-col items-center gap-3 rounded-3xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-[#40493d]">Danh sách hình ảnh</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {shuffledDeck.map((img) => {
                            const isUsed = userRecall.some((item) => item?.id === img.id);
                            return (
                                <button
                                    key={`deck-${img.id}`}
                                    type="button"
                                    disabled={isUsed}
                                    onClick={() => placeImage(img)}
                                    className={`flex h-20 w-20 items-center justify-center rounded-xl border transition cursor-pointer ${isUsed ? "border-[#e2e8f0] bg-[#f1f5f9] opacity-25 cursor-not-allowed" : "border-[#e0eee6] hover:scale-105 hover:border-[#1a7a4a] shadow-xs bg-white"
                                        }`}
                                >
                                    <img
                                        src={img.imageUrl}
                                        alt="Ảnh"
                                        className="h-16 w-16 rounded-lg object-cover"
                                    />
                                </button>

                            );
                        })}
                    </div>
                </section>
            </main>
        </div>
    );
};
