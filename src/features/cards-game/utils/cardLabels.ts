import type { Card, Suit } from "../types/types";

// Ký hiệu chất là nội dung của lá bài, không phải trang trí
export const SUIT_SYMBOLS: Record<Suit, string> = {
    hearts: "♥", // taste-skill-ignore
    diamonds: "♦", // taste-skill-ignore
    clubs: "♣", // taste-skill-ignore
    spades: "♠", // taste-skill-ignore
};

export const SUIT_LABELS: Record<Suit, string> = {
    hearts: "Cơ",
    diamonds: "Rô",
    clubs: "Tép",
    spades: "Bích",
};

export const cardLabel = (card: Card) => `${card.rank} ${SUIT_LABELS[card.suit]}`;
