import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useImagesGameStore } from "../store/imagesGameStore";
import { imageFromView } from "../utils/imageUtils";
import type { ImageCard } from "../types/imageTypes";

const ImageChip = ({ image, isCorrect, showMark = false }: { image: ImageCard | null; isCorrect?: boolean; showMark?: boolean }) => {
    if (!image) {
        return <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-[#c8d8d0] text-sm font-bold text-[#c8d8d0]">—</div>;
    }
    const borderColor = showMark ? (isCorrect ? "#1a7a4a" : "#e45454") : "#e0eee6";
    const bgColor = showMark ? (isCorrect ? "#e6f7ed" : "#fef2f2") : "#ffffff";

    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 p-1 shadow-xs transition" style={{ borderColor, backgroundColor: bgColor }}>
                <img
                    src={image.imageUrl}
                    alt="Hình ảnh đã chọn"
                    className="h-full w-full rounded-xl object-cover"
                />
            </div>
            {showMark && (
                <span className="text-xs font-bold" style={{ color: isCorrect ? "#1a7a4a" : "#e45454" }}>
                    {isCorrect ? "✓ Đúng" : "✗ Sai"}
                </span>
            )}
        </div>
    );
};

export const ImagesResultPhase = () => {
    const { result, resetGame, level } = useImagesGameStore();
    const { game } = useGameCatalog("image");

    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const perItem = result.result.perItem.map((item) => ({
        expected: imageFromView(item.expected),
        answer: item.answer ? imageFromView(item.answer) : null,
        correct: item.correct,
    }));

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                subtitle="Kết quả thi đấu"
                onReset={resetGame}
            />

            <main className="flex flex-1 flex-col items-center gap-8 overflow-auto px-4 py-8">
                <RoundResultCard
                    round={result}
                    maxLevel={game?.maxLevel ?? 0}
                    onPlayAgain={resetGame}
                    onReset={resetGame}
                />

                <section className="w-full max-w-4xl rounded-2xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[#77839a]">Bài làm của bạn</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {perItem.map((item, index) => (
                            <div key={`user-${index}`} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-[#77839a]">{index + 1}</span>
                                <ImageChip image={item.answer} isCorrect={item.correct} showMark />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full max-w-4xl rounded-2xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[#77839a]">Thứ tự đúng</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {perItem.map(({ expected: image }, index) => (
                            <div key={`correct-${index}`} className="flex flex-col items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[#77839a]">{index + 1}</span>
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1a7a4a] bg-[#e6f7ed] p-1 shadow-xs">
                                    <img
                                        src={image.imageUrl}
                                        alt={`Hình ảnh thứ ${index + 1}`}
                                        className="h-full w-full rounded-xl object-cover"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
