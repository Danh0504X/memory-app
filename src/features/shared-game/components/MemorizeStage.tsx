import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MemorizeStageProps<T> {
    items: T[];
    index: number;          // vị trí đầu của nhóm đang xem
    groupSize: number;
    unit: string;           // "Lá" hoặc "Hình"
    onJump: (index: number) => void;
    onPrev: () => void;
    onNext: () => void;
    renderBig: (item: T, index: number) => ReactNode;
    // seen: đã xem tới lá này chưa; lá chưa xem hiện úp
    renderMini: (item: T, index: number, seen: boolean) => ReactNode;
    keyOf: (item: T, index: number) => string;
}

// Bàn ghi nhớ: nhóm đang xem ở giữa, hai nút lật lớn hai bên, dải mọi lá bên dưới
export const MemorizeStage = <T,>({
    items,
    index,
    groupSize,
    unit,
    onJump,
    onPrev,
    onNext,
    renderBig,
    renderMini,
    keyOf,
}: MemorizeStageProps<T>) => {
    const stripRef = useRef<HTMLOListElement>(null);
    const end = Math.min(index + groupSize, items.length);
    const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());

    // Đánh dấu nhóm đang xem là đã xem (cập nhật ngay trong lúc render để dải lật cùng lúc với lá lớn)
    const unseen = [];
    for (let i = index; i < end; i++) if (!seen.has(i)) unseen.push(i);
    if (unseen.length > 0) setSeen(new Set([...seen, ...unseen]));

    // Giữ lá đang xem trong tầm nhìn của dải khi có nhiều lá
    useEffect(() => {
        stripRef.current
            ?.querySelector('[aria-current="true"]')
            ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }, [index]);

    const pages = Math.ceil(items.length / groupSize);
    const page = Math.floor(index / groupSize);

    return (
        <main className="play__table">
            <div className="stage">
                <button type="button" className="stage__arrow" onClick={onPrev} disabled={index === 0} aria-label={`${unit} trước`}>
                    <ChevronLeft size={30} aria-hidden="true" />
                </button>

                {/* key theo vị trí: mỗi lần lật, nhóm mới được chia ra lại */}
                <div className="stage__group" key={index}>
                    {items.slice(index, end).map((item, offset) => (
                        <div key={keyOf(item, index + offset)} className="stage__item deal-in" style={{ "--i": offset } as CSSProperties}>
                            {renderBig(item, index + offset)}
                            <p className="stage__num">
                                {unit} {index + offset + 1} / {items.length}
                            </p>
                        </div>
                    ))}
                </div>

                <button type="button" className="stage__arrow" onClick={onNext} disabled={end >= items.length} aria-label={`${unit} sau`}>
                    <ChevronRight size={30} aria-hidden="true" />
                </button>
            </div>

            {pages > 1 && pages <= 12 && (
                <div className="stage__dots" aria-hidden="true">
                    {Array.from({ length: pages }, (_, i) => (
                        <span key={i} data-on={i === page} />
                    ))}
                </div>
            )}

            <ol className="reel" ref={stripRef} aria-label={`Tất cả ${items.length} ${unit.toLowerCase()}`}>
                {items.map((item, i) => (
                    <li key={keyOf(item, i)}>
                        <button
                            type="button"
                            aria-current={i >= index && i < end}
                            aria-label={`Xem ${unit.toLowerCase()} ${i + 1}`}
                            onClick={() => onJump(Math.floor(i / groupSize) * groupSize)}
                        >
                            {renderMini(item, i, seen.has(i))}
                        </button>
                    </li>
                ))}
            </ol>
        </main>
    );
};
