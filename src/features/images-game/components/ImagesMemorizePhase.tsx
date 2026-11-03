import { useEffect, useRef, useState } from "react";
import { useImagesGameStore } from "../store/imagesGameStore";
import { usePhaseTimer } from "@/features/cards-game/hooks/usePhaseTimer";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { GameFooterNav } from "@/features/shared-game/components/GameFooterNav";
import { RoundStatusBar } from "@/features/shared-game/components/RoundStatusBar";
import type { ImageCard } from "../types/imageTypes";

const THUMB_W = 40;
const THUMB_GAP = 8;
const THUMB_STEP = THUMB_W + THUMB_GAP;
const VISIBLE_THUMBS = 5;
const STRIP_WIDTH = VISIBLE_THUMBS * THUMB_STEP - THUMB_GAP;

const BigImageCard = ({
    image,
    index,
    total,
    groupSize = 1,
}: {
    image: ImageCard;
    index: number;
    total: number;
    groupSize?: number;
}) => {
    // 1 ảnh thì làm khung to cực đại, 2-5 ảnh thì tự điều chỉnh vừa vặn hàng ngang
    const cardWidth = groupSize === 1 ? "w-[360px]" : groupSize === 2 ? "w-[270px]" : groupSize === 3 ? "w-[220px]" : "w-[185px]";
    const imgSize = groupSize === 1 ? "h-72 w-72" : groupSize === 2 ? "h-56 w-56" : groupSize === 3 ? "h-44 w-44" : "h-36 w-36";

    return (
        <div className={`relative ${cardWidth} rounded-3xl border border-[#e0eee6] bg-white p-4 shadow-lg transition-all`}>
            <div className="flex flex-col items-center py-2">
                <img
                    src={image.imageUrl}
                    alt="Hình ảnh ghi nhớ"
                    className={`${imgSize} rounded-2xl object-cover shadow-sm select-none`}
                    loading="eager"
                />
            </div>
            <p className="text-right text-xs font-semibold text-[#77839a]">{index + 1}/{total}</p>
        </div>
    );
};

const ThumbStrip = ({
    images,
    activeIndex,
    groupSize = 1,
    onSelect,
}: {
    images: ImageCard[];
    activeIndex: number;
    groupSize?: number;
    onSelect: (idx: number) => void;
}) => {
    const centerOffset = STRIP_WIDTH / 2 - THUMB_W / 2;
    const baseTranslate = -activeIndex * THUMB_STEP + centerOffset;
    const dragRef = useRef<{ startX: number; startIndex: number } | null>(null);
    const [dragDelta, setDragDelta] = useState(0);
    const isDragging = useRef(false);

    const onPointerDown = (e: React.PointerEvent) => {
        isDragging.current = false;
        dragRef.current = { startX: e.clientX, startIndex: activeIndex };
        setDragDelta(0);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const delta = e.clientX - dragRef.current.startX;
        if (Math.abs(delta) > 4) isDragging.current = true;
        setDragDelta(delta);
    };
    const onPointerUp = (e: React.PointerEvent) => {
        if (!dragRef.current) return;
        const delta = e.clientX - dragRef.current.startX;
        const steps = -Math.round(delta / THUMB_STEP);
        if (steps !== 0) {
            const next = Math.max(0, Math.min(images.length - 1, dragRef.current.startIndex + steps));
            onSelect(next);
        }
        dragRef.current = null;
        setDragDelta(0);
    };

    return (
        <div style={{ width: STRIP_WIDTH }} className="relative overflow-hidden cursor-grab active:cursor-grabbing select-none">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-6 z-10 bg-gradient-to-r from-[#f5faf7] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 z-10 bg-gradient-to-l from-[#f5faf7] to-transparent" />
            <div
                className="flex items-center py-1"
                style={{
                    gap: THUMB_GAP,
                    transform: `translateX(${baseTranslate + (dragRef.current ? dragDelta : 0)}px)`,
                    transition: dragRef.current ? "none" : "transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                    willChange: "transform",
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
            >
                {images.map((img, idx) => {
                    // Kiểm tra xem thumbnail này có nằm trong nhóm ảnh đang hiển thị hay không
                    const isInGroup = idx >= activeIndex && idx < activeIndex + groupSize;
                    return (
                        <button
                            key={`thumb-${img.id}-${idx}`}
                            type="button"
                            onClick={() => { if (!isDragging.current) onSelect(idx); }}
                            style={{ width: THUMB_W, flexShrink: 0 }}
                            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${isInGroup ? "border-[#1a7a4a] bg-[#e6f7ed] shadow-sm ring-1 ring-[#1a7a4a]" : "border-[#e0eee6] bg-white hover:border-[#1a7a4a]"
                                }`}
                        >
                            <img
                                src={img.imageUrl}
                                alt={`Ảnh ${idx + 1}`}
                                className="h-7 w-7 rounded-md object-cover select-none"
                            />
                            <span className="text-[10px] font-bold" style={{ color: isInGroup ? "#1a7a4a" : "#202b39" }}>
                                {idx + 1}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export const ImagesMemorizePhase = () => {
    const {
        imagesToMemorize,
        currentMemorizeIndex,
        nextMemorizeCard,
        prevMemorizeCard,
        finishMemorize,
        phaseDeadline,
        level,
        resetGame,
        preferences, // ➔ Lấy preferences từ store
        pending,
        error,
    } = useImagesGameStore();
    const { formattedTime } = usePhaseTimer(phaseDeadline, finishMemorize);

    const groupSize = preferences.groups || 1;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") prevMemorizeCard();
            else if (e.key === "ArrowRight") nextMemorizeCard();
            else if (e.key === " ") { e.preventDefault(); useImagesGameStore.setState({ currentMemorizeIndex: 0 }); }
            else if (e.key === "Enter") finishMemorize();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [prevMemorizeCard, nextMemorizeCard, finishMemorize]);

    // Lấy danh sách ảnh thuộc nhóm trang hiện tại (1, 2 hoặc 5 ảnh)
    const currentGroupImages = imagesToMemorize.slice(
        currentMemorizeIndex,
        currentMemorizeIndex + groupSize
    );

    const isFirst = currentMemorizeIndex === 0;
    const isLast = currentMemorizeIndex + groupSize >= imagesToMemorize.length;

    // Tính tổng số trang theo nhóm
    const totalPages = Math.ceil(imagesToMemorize.length / groupSize);
    const currentPage = Math.floor(currentMemorizeIndex / groupSize);

    return (
        <div className="flex min-h-screen flex-col bg-[#f5faf7] font-sans text-[#202b39]">
            {/* Header: Nếu ẩn đồng hồ thì truyền formattedTime là undefined */}
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                subtitle={`Mục tiêu: Ghi nhớ chuẩn xác thứ tự ${imagesToMemorize.length} hình ảnh`}
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
                {/* Khu vực hiển thị nhóm ảnh */}
                <div className="flex flex-wrap items-center justify-center gap-5 max-w-6xl">
                    {currentGroupImages.map((img, idx) => (
                        <BigImageCard
                            key={img.id}
                            image={img}
                            index={currentMemorizeIndex + idx}
                            total={imagesToMemorize.length}
                            groupSize={groupSize}
                        />
                    ))}
                </div>

                {/* Thanh cuộn Thumbnails */}
                <ThumbStrip
                    images={imagesToMemorize}
                    activeIndex={currentMemorizeIndex}
                    groupSize={groupSize}
                    onSelect={(idx) => {
                        const pageStart = Math.floor(idx / groupSize) * groupSize;
                        useImagesGameStore.setState({ currentMemorizeIndex: pageStart });
                    }}
                />

                {/* Các chấm hiển thị số trang */}
                <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }).map((_, pageIdx) => (
                        <span
                            key={`dot-${pageIdx}`}
                            className={`h-1.5 rounded-full transition-all ${pageIdx === currentPage ? "w-5 bg-[#1a7a4a]" : "w-1.5 bg-[#c8d8d0]"
                                }`}
                        />
                    ))}
                </div>
            </main>

            <GameFooterNav
                onFirst={() => useImagesGameStore.setState({ currentMemorizeIndex: 0 })}
                onPrev={prevMemorizeCard}
                onNext={nextMemorizeCard}
                isFirst={isFirst}
                isLast={isLast}
            />
        </div>
    );
};

