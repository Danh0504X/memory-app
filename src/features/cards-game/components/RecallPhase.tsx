import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { usePhaseTimer } from "../hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import type { Card, Suit } from "../types/types";
import { isSameCard } from "../utils/cardUtils";

const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
};

const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

const AnswerSlot = ({ card, index, isSelected, onClickEmpty, onClickFilled }: { card: Card | null; index: number; isSelected: boolean; onClickEmpty: () => void; onClickFilled: () => void }) => {
    if (card) {
        const red = isRed(card.suit);
        return (
            <button
                type="button"
                onClick={onClickFilled}
                aria-label={`Lá bài ${card.rank} ${card.suit}, nhấp để trả bài về bộ bài`}
                className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-[#1a7a4a] bg-[#e6f7ed] shadow-sm transition hover:border-red-400 hover:bg-red-50 cursor-pointer"
            >
                <span className="text-base leading-none" style={{ color: red ? "#e45454" : "#202b39" }}>{SUIT_SYMBOLS[card.suit]}</span>
                <span className="text-[11px] font-bold" style={{ color: red ? "#e45454" : "#202b39" }}>{card.rank}</span>
            </button>
        );
    }
    return (
        <button
            type="button"
            onClick={onClickEmpty}
            aria-label={`Chọn ô vị trí ${index + 1}`}
            className={`flex h-16 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-dashed text-sm font-bold transition-all cursor-pointer ${isSelected ? "border-[#1a7a4a] bg-[#e6f7ed] text-[#1a7a4a]" : "border-[#c8d8d0] bg-transparent text-[#77839a] hover:border-[#1a7a4a]"
                }`}
        >
            {isSelected ? "✎" : index + 1}
        </button>
    );
};

const DeckTile = ({ card, isUsed, onClick }: { card: Card; isUsed: boolean; onClick: () => void }) => {
    const red = isRed(card.suit);
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isUsed}
            className={`flex h-14 w-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-bold transition-all ${isUsed ? "cursor-not-allowed border-[#e0eee6] bg-white opacity-25 grayscale" : "cursor-pointer border-[#e0eee6] bg-white hover:-translate-y-1 hover:border-[#1a7a4a] hover:shadow-sm"
                }`}
        >
            <span className="text-base leading-none" style={{ color: isUsed ? "#aaa" : red ? "#e45454" : "#202b39" }}>{SUIT_SYMBOLS[card.suit]}</span>
            <span className="text-[10px] font-bold" style={{ color: isUsed ? "#aaa" : "#202b39" }}>{card.rank}</span>
        </button>
    );
};

export const RecallPhase = () => {
    const { cardsToMemorize, userRecall, deckCards, selectedSlotIndex, selectSlot, placeCard, removeCard, finishGame, phaseDeadline, level, resetGame, pending, error } = useGameStore();
    const { formattedTime } = usePhaseTimer(phaseDeadline, finishGame);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") finishGame();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [finishGame]);

    const filledCount = userRecall.filter(Boolean).length;

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            {/* Header dùng chung */}
            <GameHeader
                gameName="Thẻ bài"
                level={level}
                subtitle={`Đã điền ${filledCount}/${cardsToMemorize.length} lá bài`}
                formattedTime={formattedTime}
                actionButtonText={pending === "submit" ? "Đang chấm..." : "✓ Hoàn thành"}
                onAction={finishGame}
                onReset={resetGame}
            />
            <RoundStatusBar pendingText={pending === "submit" ? "Đang chấm bài..." : null} error={error} />

            <main className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6">
                <section className="rounded-2xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-center text-sm font-semibold text-[#77839a] uppercase tracking-wide">Ô trả lời ({cardsToMemorize.length} lá)</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                        {userRecall.map((card, index) => (
                            <AnswerSlot
                                key={`slot-${index}`}
                                card={card}
                                index={index}
                                isSelected={selectedSlotIndex === index}
                                onClickEmpty={() => selectSlot(index)}
                                onClickFilled={() => removeCard(index)}
                            />
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#e0eee6] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-center text-sm font-semibold text-[#77839a] uppercase tracking-wide">Bộ bài ({deckCards.length} lá)</h2>
                    <div className="flex flex-wrap justify-center gap-2">
                        {deckCards.map((card) => {
                            const isUsed = userRecall.some((placed) => isSameCard(placed, card));
                            return (
                                <DeckTile
                                    key={`deck-${card.suit}-${card.rank}`}
                                    card={card}
                                    isUsed={isUsed}
                                    onClick={() => { if (!isUsed) placeCard(card); }}
                                />
                            );
                        })}
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#e0eee6] bg-white px-6 py-2 text-center">
                <p className="flex items-center justify-center gap-1.5 text-xs text-[#77839a]">
                    <kbd className="rounded border border-[#e0eee6] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
                    <span>để nộp bài</span>
                </p>
            </footer>
        </div>
    );
};
