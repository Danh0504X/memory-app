import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useGameStore } from "../store/gameStore";
import { cardFromCode } from "../utils/cardUtils";
import type { Card, Suit } from "../types/types";

const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const SUIT_LABELS: Record<Suit, string> = {
    hearts: "Cơ",
    diamonds: "Rô",
    clubs: "Tép",
    spades: "Bích",
};

const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

const CardChip = ({ card, isCorrect, showMark = false }: { card: Card | null; isCorrect?: boolean; showMark?: boolean }) => {
    if (!card) {
        return <div className="flex h-16 w-12 items-center justify-center rounded-xl border-2 border-dashed border-[#c8d8d0] text-sm text-[#c8d8d0]">—</div>;
    }

    const red = isRed(card.suit);
    const borderColor = showMark ? (isCorrect ? "#1a7a4a" : "#e45454") : "#e0eee6";
    const bgColor = showMark ? (isCorrect ? "#e6f7ed" : "#fef2f2") : "#fff";

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="flex h-16 w-12 flex-col items-center justify-center gap-0.5 rounded-xl border-2 text-[11px] font-bold" style={{ borderColor, backgroundColor: bgColor }}>
                <span className="text-base leading-none" style={{ color: red ? "#e45454" : "#202b39" }}>{SUIT_SYMBOLS[card.suit]}</span>
                <span className="text-[10px] font-bold text-[#202b39]">{card.rank}</span>
            </div>
            {showMark && (
                <span className="text-xs font-bold" style={{ color: isCorrect ? "#1a7a4a" : "#e45454" }}>
                    {isCorrect ? "✓" : "✗"}
                </span>
            )}
        </div>
    );
};

export const ResultPhase = () => {
    const { result, resetGame, level } = useGameStore();
    const { game } = useGameCatalog("card");

    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const perItem = result.result.perItem.map((item) => ({
        expected: cardFromCode(item.expected.code),
        answer: item.answer ? cardFromCode(item.answer.code) : null,
        correct: item.correct,
    }));

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            <GameHeader
                gameName="Thẻ bài"
                level={level}
                subtitle="Kết quả lượt chơi"
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
                                <span className="text-[10px] text-[#77839a]">{index + 1}</span>
                                <CardChip card={item.answer} isCorrect={item.correct} showMark />
                            </div>
                        ))}
                    </div>
                </section>

                <section className="w-full max-w-4xl rounded-2xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[#77839a]">Thứ tự đúng</h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        {perItem.map(({ expected: card }, index) => (
                            <div key={`correct-${index}`} className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-[#77839a]">{index + 1}</span>
                                <div className="flex h-16 w-12 flex-col items-center justify-center gap-0.5 rounded-xl border border-[#1a7a4a] bg-[#e6f7ed] text-[11px] font-bold">
                                    <span className="text-base leading-none" style={{ color: isRed(card.suit) ? "#e45454" : "#202b39" }}>
                                        {SUIT_SYMBOLS[card.suit]}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#202b39]">{card.rank}</span>
                                </div>
                                <span className="text-[9px] text-[#77839a]">{SUIT_LABELS[card.suit]}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};
