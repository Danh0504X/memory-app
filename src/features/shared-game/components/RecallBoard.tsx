import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Undo2, X } from "lucide-react";

// Khoảng cách trong CSS (game.css: .slots, .deck__row, .deck__items) dùng để tính cỡ lá
const SLOT_GAP = 10;
const SLOT_ROW_GAP = 14;
const SLOT_NUMBER = 22;     // số thứ tự trên mỗi ô và khoảng cách tới ô
const DECK_ROW_GAP = 10;
const DECK_LABEL = 60;      // cột tên chất bên trái mỗi hàng bài (máy tính)
const PHONE_LABEL = 36;     // tên chất nằm trên hàng bài và phần đệm của hàng vuốt ngang (điện thoại)
const HINTS = 44;           // dòng phím tắt dưới bàn chơi
const SLACK = 28;           // lề dưới của bộ bài và chừa hở

interface FitInput {
    shape: "card" | "photo";
    slotCount: number;
    groupSizes: number[];
    labelled: boolean;
    slotWidth: number;
    deckWidth: number;
    height: number;
    phone: boolean;
}

// Chọn cỡ lá lớn nhất để hàng ô trả lời và bộ bài cùng nằm trong một màn hình.
const fitSizes = ({ shape, slotCount, groupSizes, labelled, slotWidth, deckWidth, height, phone }: FitInput) => {
    const ratio = shape === "card" ? 1.4 : 1;
    const deckGap = shape === "card" ? 8 : 12;
    const [maxSize, minDeck, minSlot] = shape === "card" ? [84, 40, 34] : [120, 56, 44];

    const slotsHeight = (size: number) => {
        const perRow = Math.max(1, Math.floor((slotWidth + SLOT_GAP) / (size + SLOT_GAP)));
        const rows = Math.ceil(slotCount / perRow);
        return rows * (size * ratio + SLOT_NUMBER) + (rows - 1) * SLOT_ROW_GAP;
    };

    const deckHeight = (size: number) => {
        // Điện thoại: mỗi chất là một hàng vuốt ngang, không giới hạn bề ngang
        if (phone && labelled) return groupSizes.length * (size * ratio + PHONE_LABEL) + (groupSizes.length - 1) * DECK_ROW_GAP;
        const width = deckWidth - (labelled ? DECK_LABEL : 0);
        const perRow = Math.max(1, Math.floor((width + deckGap) / (size + deckGap)));
        const lines = groupSizes.reduce((sum, count) => sum + Math.ceil(count / perRow), 0);
        return lines * size * ratio + (lines - 1) * DECK_ROW_GAP;
    };

    // Trước hết thử cho ô trả lời và bộ bài cùng một cỡ, to nhất có thể
    for (let size = maxSize; size >= minDeck; size -= 2) {
        if (slotsHeight(size) + deckHeight(size) <= height) return { deck: size, slot: size };
    }
    // Nhiều ô quá thì cho ô trả lời nhỏ hơn, giữ bộ bài to để dễ bấm
    for (let deck = maxSize; deck >= minDeck; deck -= 2) {
        const left = height - deckHeight(deck);
        for (let slot = deck; slot >= minSlot; slot -= 2) {
            if (slotsHeight(slot) <= left) return { deck, slot };
        }
    }
    // Quá nhiều lá cho màn hình này: dùng cỡ nhỏ nhất và để trang cuộn
    return { deck: minDeck, slot: minSlot };
};

interface RecallBoardProps<T> {
    slots: (T | null)[];
    selectedIndex: number | null;
    shape: "card" | "photo";
    unit: string;                   // "lá" hoặc "hình"
    onSelectSlot: (index: number) => void;
    onClearSlot: (index: number) => void;
    deckTitle: string;
    groups: { label?: string; items: T[] }[];
    isUsed: (item: T) => boolean;
    onPick: (item: T) => void;
    keyOf: (item: T) => string;
    labelOf: (item: T) => string;
    renderItem: (item: T, place: "slot" | "deck") => ReactNode;
}

// Bàn nhớ lại: hàng ô trả lời nằm trên bàn, ô sắp điền sáng vàng; bộ bài để chọn ở dưới
export const RecallBoard = <T,>({
    slots,
    selectedIndex,
    shape,
    unit,
    onSelectSlot,
    onClearSlot,
    deckTitle,
    groups,
    isUsed,
    onPick,
    keyOf,
    labelOf,
    renderItem,
}: RecallBoardProps<T>) => {
    const target = selectedIndex ?? slots.findIndex((slot) => slot === null);
    const lastFilled = slots.findLastIndex((slot) => slot !== null);
    const filled = slots.filter((slot) => slot !== null).length;

    const tableRef = useRef<HTMLElement>(null);
    const slotsRef = useRef<HTMLOListElement>(null);
    const deckRef = useRef<HTMLElement>(null);
    const rowsRef = useRef<HTMLDivElement>(null);
    const [fit, setFit] = useState<{ deck: number; slot: number } | null>(null);
    const slotCount = slots.length;
    const groupSizes = groups.map((group) => group.items.length).join(",");
    const labelled = groups.some((group) => group.label);

    // Đo phần còn trống của màn hình rồi tính cỡ lá; tính lại khi đổi cỡ cửa sổ
    useLayoutEffect(() => {
        const measure = () => {
            const table = tableRef.current;
            const slotList = slotsRef.current;
            const deck = deckRef.current;
            const rows = rowsRef.current;
            if (!table || !slotList || !deck || !rows) return;

            const top = table.getBoundingClientRect().top + window.scrollY;
            // Mọi thứ trên bàn và bộ bài không phụ thuộc cỡ lá: tiêu đề, phần đệm, khoảng cách
            const chrome =
                deck.getBoundingClientRect().bottom - table.getBoundingClientRect().top - slotList.offsetHeight - rows.offsetHeight;
            const coarse = window.matchMedia("(pointer: coarse)").matches;

            setFit(
                fitSizes({
                    shape,
                    slotCount,
                    groupSizes: groupSizes.split(",").map(Number),
                    labelled,
                    slotWidth: slotList.clientWidth,
                    deckWidth: rows.clientWidth,
                    height: window.innerHeight - top - chrome - (coarse ? 0 : HINTS) - SLACK,
                    phone: window.matchMedia("(max-width: 640px)").matches,
                }),
            );
        };

        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [shape, slotCount, groupSizes, labelled]);

    const fitStyle = (fit ? { "--fit-slot": `${fit.slot}px`, "--fit-deck": `${fit.deck}px` } : undefined) as
        | CSSProperties
        | undefined;

    // Backspace gỡ lá vừa đặt cuối cùng
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Backspace" && lastFilled !== -1) {
                e.preventDefault();
                onClearSlot(lastFilled);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lastFilled, onClearSlot]);

    let hint = `Chọn ${unit} ở dưới, nó sẽ vào ô sáng màu (ô ${target + 1}).`;
    if (target === -1) hint = "Đã điền đủ. Bấm vào một ô để gỡ ra, hoặc nộp bài.";
    else if (selectedIndex !== null) hint = `Đang chọn ô ${target + 1}. Chọn ${unit} để đặt vào.`;

    return (
        <>
            <main className="play__table play__table--recall" ref={tableRef} style={fitStyle}>
                <div className="answer__head">
                    <div>
                        <h2>Xếp lại đúng thứ tự</h2>
                        <p>{hint}</p>
                    </div>
                    <button
                        type="button"
                        className="answer__undo"
                        onClick={() => onClearSlot(lastFilled)}
                        disabled={lastFilled === -1}
                    >
                        <Undo2 size={18} aria-hidden="true" />
                        Gỡ {unit} cuối
                    </button>
                </div>

                <ol className="slots" ref={slotsRef} data-shape={shape} aria-label={`Ô trả lời, đã điền ${filled} trên ${slots.length}`}>
                    {slots.map((item, index) => (
                        <li key={index}>
                            <span className="slots__no" aria-hidden="true">{index + 1}</span>
                            <button
                                type="button"
                                className="slot"
                                data-filled={item !== null}
                                data-target={item === null && index === target}
                                aria-pressed={item === null ? selectedIndex === index : undefined}
                                aria-label={
                                    item === null
                                        ? `Ô ${index + 1}, trống`
                                        : `Ô ${index + 1}: ${labelOf(item)}. Bấm để gỡ ra`
                                }
                                onClick={() => (item === null ? onSelectSlot(index) : onClearSlot(index))}
                            >
                                {item !== null && (
                                    <>
                                        <span className="slot__item" key={keyOf(item)}>{renderItem(item, "slot")}</span>
                                        <span className="slot__x" aria-hidden="true">
                                            <X size={14} />
                                        </span>
                                    </>
                                )}
                            </button>
                        </li>
                    ))}
                </ol>
            </main>

            <section className="deck" ref={deckRef} style={fitStyle} aria-labelledby="deck-title">
                <div className="deck__head">
                    <h2 id="deck-title">{deckTitle}</h2>
                    <p>{unit === "lá" ? "Lá đã dùng sẽ mờ đi." : "Hình đã dùng sẽ mờ đi."}</p>
                </div>
                <div className="deck__rows" ref={rowsRef} data-shape={shape}>
                    {groups.map((group, groupIndex) => (
                        <div className="deck__row" key={group.label ?? groupIndex}>
                            {group.label && <span className="deck__label">{group.label}</span>}
                            <ul className="deck__items">
                                {group.items.map((item) => {
                                    const used = isUsed(item);
                                    return (
                                        <li key={keyOf(item)}>
                                            <button
                                                type="button"
                                                className="deck__pick"
                                                disabled={used}
                                                aria-label={used ? `${labelOf(item)}, đã dùng` : `Đặt ${labelOf(item)}`}
                                                onClick={() => onPick(item)}
                                            >
                                                {renderItem(item, "deck")}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
};
