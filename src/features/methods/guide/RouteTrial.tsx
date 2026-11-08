import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bed, DoorOpen, Footprints, Lamp, RotateCcw, Sofa, type LucideIcon } from "lucide-react";
import { OBJECTS, shuffled, type Picture } from "./pictures";
import { makeRandom } from "./story";

// Một lộ trình trong nhà, luôn đi cùng một chiều
const ROUTE: { name: string; icon: LucideIcon; scene: (item: string) => string }[] = [
    { name: "Cửa ra vào", icon: DoorOpen, scene: (item) => `${item} khổng lồ chắn ngay cửa, phải đẩy mới vào được.` },
    { name: "Kệ giày", icon: Footprints, scene: (item) => `${item} nằm trong chiếc giày, đi vào là giẫm phải.` },
    { name: "Ghế sofa", icon: Sofa, scene: (item) => `${item} ngồi chễm chệ trên sofa, chiếm hết chỗ.` },
    { name: "Bàn học", icon: Lamp, scene: (item) => `${item} nhảy múa dưới ánh đèn bàn học.` },
    { name: "Giường", icon: Bed, scene: (item) => `${item} nảy tưng tưng trên gối.` },
];

const LEVELS = [3, 5];
const WALK_MS = 2600;

type Phase = "ready" | "walk" | "recall" | "result";

const makeRound = (length: number, seed: number) => {
    const random = makeRandom(seed);
    const pool = shuffled(OBJECTS, random);
    const items = pool.slice(0, length);
    // Mỗi chỗ có bốn lựa chọn: đồ của chỗ đó, đồ của chỗ khác trên lộ trình (để thử thứ tự) và đồ lạ
    const options = items.map((item, i) => {
        const neighbours = items.filter((_, j) => j !== i).slice(0, 2);
        const strangers = pool.slice(length).filter((other) => !neighbours.includes(other));
        return shuffled([item, ...neighbours, ...strangers].slice(0, 4), random);
    });
    return { items, options };
};

export const RouteTrial = () => {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>("ready");
    const [at, setAt] = useState(0);
    const [answers, setAnswers] = useState<(Picture | null)[]>([]);

    const length = LEVELS[level];
    const route = ROUTE.slice(0, length);
    const { items, options } = makeRound(length, seed);

    // Lượt đi đầu: tự bước qua từng chỗ; người chơi có thể bấm để đi nhanh hơn
    useEffect(() => {
        if (phase !== "walk" || at >= length) return;
        const timer = window.setTimeout(() => setAt((value) => value + 1), WALK_MS);
        return () => window.clearTimeout(timer);
    }, [phase, at, length]);

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setSeed((value) => value + 3571);
        setAt(0);
        setAnswers([]);
        setPhase("walk");
    };

    const choose = (item: Picture) => {
        const next = [...answers];
        next[at] = item;
        setAnswers(next);
        if (at + 1 < length) setAt(at + 1);
        else setPhase("result");
    };

    const correct = items.filter((item, i) => answers[i] === item).length;
    const perfect = phase === "result" && correct === length;
    const firstMiss = items.findIndex((item, i) => answers[i] !== item);
    const walked = phase === "walk" ? Math.min(at, length - 1) : at;

    return (
        <div className="trial" data-ui>
            <div className="trial__top">
                <p className="trial__title">
                    {phase === "ready" && "Đặt đồ vật dọc lộ trình trong nhà"}
                    {phase === "walk" && (at < length ? `Đi tới ${route[walked].name.toLowerCase()}` : "Đã đi hết lộ trình")}
                    {phase === "recall" && `Đi lại: ở ${route[at].name.toLowerCase()} có gì?`}
                    {phase === "result" && (perfect ? "Tìm lại đủ mọi đồ vật!" : `Đúng ${correct} trên ${length} chỗ`)}
                </p>
                <div className="trial__levels" role="group" aria-label="Chọn số chỗ trên lộ trình">
                    {LEVELS.map((size, i) => (
                        <button
                            key={size}
                            type="button"
                            className="trial__level"
                            aria-pressed={i === level}
                            onClick={() => {
                                setLevel(i);
                                setAt(0);
                                setAnswers([]);
                                setPhase("ready");
                            }}
                        >
                            {size} chỗ
                        </button>
                    ))}
                </div>
            </div>

            <ol className="route" style={{ "--n": length } as CSSProperties} aria-label="Lộ trình">
                {route.map((place, i) => {
                    const Icon = place.icon;
                    const shown =
                        (phase === "walk" && i <= walked) ||
                        (phase === "recall" && i < at && answers[i]) ||
                        phase === "result";
                    const item = phase === "recall" ? answers[i] : items[i];
                    const ok = phase === "result" ? answers[i] === items[i] : undefined;
                    return (
                        <li
                            key={place.name}
                            className="route__stop"
                            data-here={(phase === "walk" || phase === "recall") && i === walked}
                            data-ok={ok}
                        >
                            <span className="route__disc">
                                <Icon size={30} strokeWidth={1.8} aria-hidden="true" />
                                {shown && item && <img key={`${item.name}-${phase}`} src={item.src} alt={item.name} className="route__item" />}
                            </span>
                            <span className="route__name">{place.name}</span>
                        </li>
                    );
                })}
            </ol>

            {phase === "ready" && (
                <div className="trial__stage trial__stage--intro">
                    <p className="trial__lead">
                        Lộ trình có {length} chỗ quen trong nhà. Ở mỗi chỗ, một đồ vật sẽ được đặt vào kèm một cảnh lạ. Đi hết một
                        lượt, rồi đi lại và gọi tên đồ vật ở từng chỗ.
                    </p>
                    <button type="button" className="btn btn--brand guide-btn" onClick={() => start()}>
                        Bắt đầu đi
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                </div>
            )}

            {phase === "walk" && (
                <div className="trial__stage">
                    <p className="trial__scene" aria-live="polite">
                        {route[walked].scene(items[walked].name)}
                    </p>
                    {at < length - 1 ? (
                        <button type="button" className="btn btn--quiet trial__small" onClick={() => setAt(at + 1)}>
                            Bước tiếp
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn--brand guide-btn"
                            onClick={() => {
                                setAt(0);
                                setPhase("recall");
                            }}
                        >
                            Đi lại để nhớ
                            <ArrowRight size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>
            )}

            {phase === "recall" && (
                <div className="trial__stage">
                    <ul className="trial__choices" aria-label={`Đồ vật ở ${route[at].name.toLowerCase()}`}>
                        {options[at].map((item) => (
                            <li key={item.name}>
                                <button type="button" className="trial__choice" onClick={() => choose(item)}>
                                    <img src={item.src} alt="" />
                                    <span>{item.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {phase === "result" && (
                <div className="trial__stage">
                    <p className="trial__lead" aria-live="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? "Lộ trình giữ đủ đồ vật. Thêm hai chỗ nữa nhé."
                                : "Năm chỗ, năm đồ vật. Lộ trình này dùng được cho cả bộ bài trong trò Thẻ bài."
                            : `Ở ${route[firstMiss].name.toLowerCase()} là ${items[firstMiss].name.toLowerCase()}. Cho đồ vật chạm vào chỗ đó (chắn, đè, rơi vào) thay vì chỉ đứng cạnh, để chỗ gọi ra được đồ.`}
                    </p>
                    <div className="trial__actions">
                        {perfect && level < LEVELS.length - 1 ? (
                            <button type="button" className="btn btn--brand guide-btn" onClick={() => start(level + 1)}>
                                Thử {LEVELS[level + 1]} chỗ
                                <ArrowRight size={18} aria-hidden="true" />
                            </button>
                        ) : (
                            <Link to="/games/cards" viewTransition className="btn btn--brand guide-btn">
                                Chơi Thẻ bài
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
