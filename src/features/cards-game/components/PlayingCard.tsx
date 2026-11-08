import memioMark from "@/assets/memio/Logo/Memio.svg";
import type { Card } from "../types/types";
import { cardLabel, SUIT_SYMBOLS } from "../utils/cardLabels";

type Size = "xs" | "sm" | "md" | "lg";

// Lá bài trắng: lá lớn có số ở hai góc và chất ở giữa, lá nhỏ xếp số trên chất dưới
export const PlayingCard = ({ card, size = "md" }: { card: Card; size?: Size }) => {
    const red = card.suit === "hearts" || card.suit === "diamonds";
    const symbol = SUIT_SYMBOLS[card.suit];

    return (
        <span className="pcard" data-size={size} data-red={red} role="img" aria-label={cardLabel(card)}>
            {size === "xs" || size === "sm" ? (
                <span className="pcard__stack" aria-hidden="true">
                    <span>{card.rank}</span>
                    <span>{symbol}</span>
                </span>
            ) : (
                <>
                    <span className="pcard__corner" aria-hidden="true">
                        {card.rank}
                        <span>{symbol}</span>
                    </span>
                    <span className="pcard__pip" aria-hidden="true">{symbol}</span>
                    <span className="pcard__corner pcard__corner--end" aria-hidden="true">
                        {card.rank}
                        <span>{symbol}</span>
                    </span>
                </>
            )}
        </span>
    );
};

// Mặt sau vàng mang logo Memio, như ván thử ở trang chủ
export const CardBack = ({ size = "md" }: { size?: Size }) => (
    <span className="pcard pcard--back" data-size={size} aria-hidden="true">
        <img src={memioMark} alt="" />
    </span>
);
