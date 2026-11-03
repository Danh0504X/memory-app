import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { usePhaseTimer } from "../hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { GameFooterNav } from "@/features/shared-game/components/GameFooterNav";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import type { Card, Suit } from "../types/types";

const SUIT_LABELS: Record<Suit, string> = {
  hearts: "Cơ",
  diamonds: "Rô",
  clubs: "Tép",
  spades: "Bích",
};

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
  spades: "♠",
};

const isRed = (suit: Suit) => suit === "hearts" || suit === "diamonds";

const THUMB_W = 40;
const THUMB_GAP = 8;
const THUMB_STEP = THUMB_W + THUMB_GAP;
const VISIBLE_THUMBS = 5;
const STRIP_WIDTH = VISIBLE_THUMBS * THUMB_STEP - THUMB_GAP;

const BigCard = ({
  card,
  index,
  total,
  groupSize,
}: {
  card: Card;
  index: number;
  total: number;
  groupSize: number;
}) => {
  const red = isRed(card.suit);
  const color = red ? "#e45454" : "#202b39";
  const suitBg = red ? "#e45454" : "#202b39";
  const widthClass =
    groupSize === 1
      ? "w-[220px]"
      : groupSize === 2
        ? "w-[190px]"
        : groupSize === 3
          ? "w-[160px]"
          : "w-[132px]";
  const symbolSizeClass =
    groupSize === 1
      ? "h-36 w-36 text-[96px]"
      : groupSize === 2
        ? "h-28 w-28 text-[76px]"
        : groupSize === 3
          ? "h-24 w-24 text-[64px]"
          : "h-20 w-20 text-[52px]";
  const rankSizeClass =
    groupSize === 1 ? "text-3xl" : groupSize < 3 ? "text-2xl" : "text-xl";

  return (
    <div
      className={`relative ${widthClass} shrink-0 rounded-3xl border border-[#e0eee6] bg-white shadow-lg`}
    >
      <div
        className="absolute left-4 top-4 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
        style={{ backgroundColor: suitBg }}
      >
        {SUIT_LABELS[card.suit]}
      </div>
      <div className="flex flex-col items-center px-4 pb-5 pt-12">
        <div
          className={`flex ${symbolSizeClass} items-center justify-center leading-none select-none`}
          style={{ color }}
        >
          {SUIT_SYMBOLS[card.suit]}
        </div>
        <p className={`mt-3 ${rankSizeClass} font-extrabold`} style={{ color }}>
          {card.rank}
        </p>
      </div>
      <p className="px-4 pb-3 text-right text-xs font-semibold text-[#77839a]">
        {index + 1}/{total}
      </p>
    </div>
  );
};

const ThumbStrip = ({
  cards,
  activeIndex,
  groupSize,
  onSelect,
}: {
  cards: Card[];
  activeIndex: number;
  groupSize: number;
  onSelect: (index: number) => void;
}) => {
  const centerOffset = STRIP_WIDTH / 2 - THUMB_W / 2;
  const baseTranslate = -activeIndex * THUMB_STEP + centerOffset;
  const dragRef = useRef<{ startX: number; startIndex: number } | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    setIsDragging(false);
    dragRef.current = { startX: e.clientX, startIndex: activeIndex };
    setDragDelta(0);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 4) {
      isDraggingRef.current = true;
      setIsDragging(true);
    }
    setDragDelta(delta);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const delta = e.clientX - dragRef.current.startX;
    const steps = -Math.round(delta / THUMB_STEP);
    if (steps !== 0) {
      const next = Math.max(
        0,
        Math.min(cards.length - 1, dragRef.current.startIndex + steps),
      );
      onSelect(Math.floor(next / groupSize) * groupSize);
    }
    dragRef.current = null;
    setIsDragging(false);
    setDragDelta(0);
  };

  return (
    <div
      style={{ width: STRIP_WIDTH }}
      className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 z-10 bg-gradient-to-r from-[#f5faf7] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 z-10 bg-gradient-to-l from-[#f5faf7] to-transparent" />
      <div
        className="flex items-center py-1"
        style={{
          gap: THUMB_GAP,
          transform: `translateX(${baseTranslate + (isDragging ? dragDelta : 0)}px)`,
          transition: isDragging
            ? "none"
            : "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          willChange: "transform",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {cards.map((card, idx) => {
          const red = isRed(card.suit);
          const active = idx >= activeIndex && idx < activeIndex + groupSize;
          return (
            <button
              key={`thumb-${idx}`}
              type="button"
              onClick={() => {
                if (!isDraggingRef.current) onSelect(idx);
              }}
              style={{ width: THUMB_W, flexShrink: 0 }}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                active
                  ? "border-[#1a7a4a] bg-[#e6f7ed] shadow-sm"
                  : "border-[#e0eee6] bg-white hover:border-[#1a7a4a]"
              }`}
            >
              <span
                className="text-sm leading-none"
                style={{
                  color: active ? "#1a7a4a" : red ? "#e45454" : "#202b39",
                }}
              >
                {SUIT_SYMBOLS[card.suit]}
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: active ? "#1a7a4a" : "#202b39" }}
              >
                {card.rank}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MemorizePhase = () => {
  const {
    cardsToMemorize,
    currentMemorizeIndex,
    nextMemorizeCard,
    prevMemorizeCard,
    finishMemorize,
    phaseDeadline,
    level,
    resetGame,
    preferences,
    pending,
    error,
  } = useGameStore();
  const { formattedTime } = usePhaseTimer(phaseDeadline, finishMemorize);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevMemorizeCard();
      else if (e.key === "ArrowRight") nextMemorizeCard();
      else if (e.key === " ") {
        e.preventDefault();
        useGameStore.setState({ currentMemorizeIndex: 0 });
      } else if (e.key === "Enter") finishMemorize();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevMemorizeCard, nextMemorizeCard, finishMemorize]);

  const groupSize = Math.max(1, Math.min(5, preferences.groups || 1));
  const currentGroupCards = cardsToMemorize.slice(
    currentMemorizeIndex,
    currentMemorizeIndex + groupSize,
  );
  const totalPages = Math.ceil(cardsToMemorize.length / groupSize);
  const currentPage = Math.floor(currentMemorizeIndex / groupSize);
  const isFirst = currentMemorizeIndex === 0;
  const isLast = currentMemorizeIndex + groupSize >= cardsToMemorize.length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
      {/* Header dùng chung */}
      <GameHeader
        gameName="Thẻ bài"
        level={level}
        subtitle={`Mục tiêu: Ghi nhớ chuẩn xác thứ tự ${cardsToMemorize.length} lá bài`}
        formattedTime={preferences.hideTimer ? undefined : formattedTime}
        actionButtonText={pending === "recall" ? "Đang chuyển..." : "✓ Tôi đã nhớ xong"}
        onAction={finishMemorize}
        onReset={resetGame}
      />
      <RoundStatusBar
        pendingText={pending === "recall" ? "Đang chuẩn bị phần nhớ lại..." : null}
        error={error}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="flex max-w-6xl flex-wrap items-center justify-center gap-4">
          {currentGroupCards.map((card, index) => (
            <BigCard
              key={`${card.suit}-${card.rank}`}
              card={card}
              index={currentMemorizeIndex + index}
              total={cardsToMemorize.length}
              groupSize={groupSize}
            />
          ))}
        </div>
        <ThumbStrip
          cards={cardsToMemorize}
          activeIndex={currentMemorizeIndex}
          groupSize={groupSize}
          onSelect={(idx) =>
            useGameStore.setState({
              currentMemorizeIndex: Math.floor(idx / groupSize) * groupSize,
            })
          }
        />
        <div className="flex gap-1.5">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <span
              key={`dot-${idx}`}
              className={`h-1.5 rounded-full transition-all ${idx === currentPage ? "w-4 bg-[#1a7a4a]" : "w-1.5 bg-[#c8d8d0]"}`}
            />
          ))}
        </div>
      </main>

      {/* Footer dùng chung */}
      <GameFooterNav
        onFirst={() => useGameStore.setState({ currentMemorizeIndex: 0 })}
        onPrev={prevMemorizeCard}
        onNext={nextMemorizeCard}
        isFirst={isFirst}
        isLast={isLast}
      />
    </div>
  );
};
