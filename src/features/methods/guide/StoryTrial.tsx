import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Undo2 } from "lucide-react";
import { OBJECTS, shuffled, type Picture } from "./pictures";
import { linkSentence, makeRandom } from "./story";

const LEVELS = [4, 5, 7];

type Phase = "ready" | "show" | "recall" | "result";

const makeRound = (length: number, seed: number) => {
    const random = makeRandom(seed);
    const items = shuffled(OBJECTS, random).slice(0, length);
    return { items, choices: shuffled(items, random) };
};

export const StoryTrial = () => {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>("ready");
    const [picked, setPicked] = useState<Picture[]>([]);

    const length = LEVELS[level];
    const { items, choices } = makeRound(length, seed);
    const names = items.map((item) => item.name.toLowerCase());

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setSeed((value) => value + 104729);
        setPicked([]);
        setPhase("show");
    };

    const pick = (item: Picture) => {
        if (picked.includes(item)) return;
        const next = [...picked, item];
        setPicked(next);
        if (next.length === length) setPhase("result");
    };

    const correct = items.filter((item, i) => picked[i] === item).length;
    const perfect = phase === "result" && correct === length;
    // Đoạn nối đầu tiên bị đứt: hình đúng trước nó và hình đáng ra phải đến tiếp
    const broken = items.findIndex((item, i) => picked[i] !== item);

    return (
        <div className="trial" data-ui>
            <div className="trial__top">
                <p className="trial__title">
                    {phase === "ready" && "Nhớ thứ tự các hình bằng một câu chuyện"}
                    {phase === "show" && "Kể một câu chuyện đi qua các hình theo thứ tự"}
                    {phase === "recall" && `Chạm các hình theo thứ tự (${picked.length}/${length})`}
                    {phase === "result" && (perfect ? "Đúng cả câu chuyện!" : `Đúng ${correct} trên ${length} vị trí`)}
                </p>
                <div className="trial__levels" role="group" aria-label="Chọn số hình">
                    {LEVELS.map((size, i) => (
                        <button
                            key={size}
                            type="button"
                            className="trial__level"
                            aria-pressed={i === level}
                            onClick={() => {
                                setLevel(i);
                                setPicked([]);
                                setPhase("ready");
                            }}
                        >
                            {size} hình
                        </button>
                    ))}
                </div>
            </div>

            {phase === "ready" && (
                <div className="trial__stage trial__stage--intro">
                    <p className="trial__lead">
                        {length} hình sẽ hiện theo một hàng. Hãy nối chúng bằng một câu chuyện của riêng bạn, mỗi hình làm gì đó
                        với hình kế tiếp. Sau đó các hình bị xáo trộn và bạn xếp lại.
                    </p>
                    <button type="button" className="btn btn--brand guide-btn" onClick={() => start()}>
                        Bắt đầu
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                </div>
            )}

            {phase === "show" && (
                <div className="trial__stage">
                    <ol className="trial__row trial__row--chain" aria-label="Các hình theo thứ tự">
                        {items.map((item, i) => (
                            <li key={item.name} className="trial__cell" style={{ "--i": i } as CSSProperties}>
                                <span className="trial__disc">
                                    <img src={item.src} alt="" className="shape is-live" data-motion={item.motion} />
                                </span>
                                <span className="trial__name">{item.name}</span>
                            </li>
                        ))}
                    </ol>
                    <p className="trial__hint">Gợi ý: {linkSentence(names, seed)}</p>
                    <button type="button" className="btn btn--brand guide-btn" onClick={() => setPhase("recall")}>
                        Tôi kể xong, xáo hình
                    </button>
                </div>
            )}

            {phase === "recall" && (
                <div className="trial__stage">
                    <ol className="trial__row trial__row--slots" aria-label="Thứ tự bạn đã chọn">
                        {items.map((_, i) => (
                            <li key={i} className="trial__cell" data-empty={!picked[i]}>
                                <span className="trial__disc">{picked[i] && <img src={picked[i].src} alt={picked[i].name} />}</span>
                            </li>
                        ))}
                    </ol>
                    <ul className="trial__choices" aria-label="Các hình đã xáo trộn">
                        {choices.map((item) => (
                            <li key={item.name}>
                                <button type="button" className="trial__choice" disabled={picked.includes(item)} onClick={() => pick(item)}>
                                    <img src={item.src} alt="" />
                                    <span>{item.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className="btn btn--quiet trial__small"
                        disabled={picked.length === 0}
                        onClick={() => setPicked(picked.slice(0, -1))}
                    >
                        <Undo2 size={16} aria-hidden="true" />
                        Bỏ hình vừa chọn
                    </button>
                </div>
            )}

            {phase === "result" && (
                <div className="trial__stage">
                    <ol className="trial__row" aria-label="Kết quả từng vị trí">
                        {items.map((item, i) => {
                            const ok = picked[i] === item;
                            return (
                                <li key={item.name} className="trial__cell" data-ok={ok} style={{ "--i": i } as CSSProperties}>
                                    <span className="trial__disc">
                                        <img src={item.src} alt={item.name} />
                                    </span>
                                    <span className="trial__mark">{ok ? item.name : `Bạn chọn ${picked[i]?.name.toLowerCase()}`}</span>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="trial__lead" aria-live="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? `Câu chuyện giữ đủ ${length} hình. Thử với ${LEVELS[level + 1]} hình.`
                                : "Bảy hình, đúng thứ tự. Giờ thử với từ ngữ trong Ghi nhớ từ."
                            : broken === 0
                              ? `Câu chuyện mở đầu bằng ${names[0]}. Hãy cho hình đầu tiên một hành động thật rõ để có chỗ bắt đầu.`
                              : `Câu chuyện đứt ở đoạn ${names[broken - 1]} → ${names[broken]}. Chỉ cần làm lại cảnh đó cho to, lạ và có chuyển động, không cần kể lại cả chuyện.`}
                    </p>
                    <div className="trial__actions">
                        {perfect && level < LEVELS.length - 1 ? (
                            <button type="button" className="btn btn--brand guide-btn" onClick={() => start(level + 1)}>
                                Thử {LEVELS[level + 1]} hình
                                <ArrowRight size={18} aria-hidden="true" />
                            </button>
                        ) : (
                            <Link to="/games/words" viewTransition className="btn btn--brand guide-btn">
                                Chơi Ghi nhớ từ
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                        )}
                        <button type="button" className="btn btn--quiet trial__small" onClick={() => start()}>
                            <RotateCcw size={16} aria-hidden="true" />
                            Lượt mới
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
