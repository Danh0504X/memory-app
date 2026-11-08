import type { Card, Rank, Suit } from "../types/types";

const RANKS: readonly Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

// Backend mã hoá lá bài thành rank + chữ cái của chất, ví dụ "AS" (át bích), "10H" (10 cơ)
const SUIT_BY_LETTER: Record<string, Suit> = {
  H: "hearts",
  D: "diamonds",
  C: "clubs",
  S: "spades",
};

const LETTER_BY_SUIT: Record<Suit, string> = {
  hearts: "H",
  diamonds: "D",
  clubs: "C",
  spades: "S",
};

export const cardFromCode = (code: string): Card => {
  const suit = SUIT_BY_LETTER[code.slice(-1)];
  const rank = code.slice(0, -1) as Rank;
  if (!suit || !RANKS.includes(rank)) {
    throw new Error(`Unknown card code "${code}"`);
  }
  return { suit, rank };
};

export const cardToCode = (card: Card): string => `${card.rank}${LETTER_BY_SUIT[card.suit]}`;

export const isSameCard = (first: Card | null, second: Card | null): boolean =>
  !!first && !!second && first.suit === second.suit && first.rank === second.rank;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.round(value)));
