import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import { DIGIT_SHAPES } from "./pictures";
import { linkSentence, makeRandom } from "./story";

// Ba cấp: dãy dài dần, thời gian nhìn tăng theo độ dài
const LEVELS = [4, 6, 8];
const SECONDS_PER_DIGIT = 2;

type Phase = "ready" | "show" | "recall" | "result";

const makeDigits = (length: number, seed: number) => {
    const random = makeRandom(seed);
    return Array.from({ length }, () => Math.floor(random() * 10));
};

// Đọc lỗi để gợi ý đúng chỗ: hai hình đổi chỗ, hay quên một hình
const adviceFor = (target: number[], answer: number[]) => {
    const wrong = target.map((digit, i) => (answer[i] === digit ? -1 : i)).filter((i) => i >= 0);
    if (wrong.length === 0) return null;
    const [a, b] = wrong;
    if (wrong.length === 2 && b === a + 1 && answer[a] === target[b] && answer[b] === target[a]) {
        return `${DIGIT_SHAPES[target[a]].name} và ${DIGIT_SHAPES[target[b]].name.toLowerCase()} bị đổi chỗ. Cho hình đứng trước làm gì đó với hình đứng sau, để cảnh có chiều.`;
    }
    if (answer.length < target.length && wrong[0] >= answer.length) {
        return `Đoạn cuối bị rơi mất. Thử nối ${DIGIT_SHAPES[target[answer.length]].name.toLowerCase()} vào cảnh mạnh tay hơn: to hơn, ồn hơn, buồn cười hơn.`;
    }
    const first = target[wrong[0]];
    return `Vị trí ${wrong[0] + 1} là ${first}: ${DIGIT_SHAPES[first].name.toLowerCase()}. ${DIGIT_SHAPES[first].why}`;
};

export const NumberTrial = () => {
    const [level, setLevel] = useState(0);
    const [seed, setSeed] = useState(() => Date.now() % 100000);
    const [phase, setPhase] = useState<Phase>("ready");
    const [answer, setAnswer] = useState("");
    const [left, setLeft] = useState(0);
    const input = useRef<HTMLInputElement>(null);

    const length = LEVELS[level];
    const digits = makeDigits(length, seed);
    const total = length * SECONDS_PER_DIGIT;

    // Đếm ngược trong lúc nhìn; hết giờ thì tự che
    useEffect(() => {
        if (phase !== "show") return;
        const started = Date.now();
        const timer = window.setInterval(() => {
            const remaining = total - (Date.now() - started) / 1000;
            if (remaining <= 0) {
                window.clearInterval(timer);
                setPhase("recall");
            } else {
                setLeft(remaining);
            }
        }, 100);
        return () => window.clearInterval(timer);
    }, [phase, total]);

    useEffect(() => {
        if (phase === "recall") input.current?.focus();
    }, [phase]);

    const start = (nextLevel = level) => {
        setLevel(nextLevel);
        setLeft(LEVELS[nextLevel] * SECONDS_PER_DIGIT);
        setSeed((value) => value + 7919);
        setAnswer("");
        setPhase("show");
    };

    const typed = answer.split("").map(Number);
    const correct = digits.filter((digit, i) => typed[i] === digit).length;
    const perfect = phase === "result" && correct === length;
    const advice = phase === "result" ? adviceFor(digits, typed) : null;
    const story = digits.map((digit) => DIGIT_SHAPES[digit].name.toLowerCase());

    return (
        <div className="trial" data-ui>
            <div className="trial__top">
                <p className="trial__title">
                    {phase === "ready" && "Nhớ một dãy số bằng hình"}
                    {phase === "show" && "Đổi từng số thành hình, nối thành một cảnh"}
                    {phase === "recall" && "Dãy số đã che. Gõ lại theo thứ tự"}
                    {phase === "result" && (perfect ? "Đúng cả dãy!" : `Đúng ${correct} trên ${length} chữ số`)}
                </p>
                <div className="trial__levels" role="group" aria-label="Chọn độ dài dãy số">
                    {LEVELS.map((size, i) => (
                        <button
                            key={size}
                            type="button"
                            className="trial__level"
                            aria-pressed={i === level}
                            disabled={phase === "show"}
                            onClick={() => {
                                setLevel(i);
                                setPhase("ready");
                                setAnswer("");
                            }}
                        >
                            {size} số
                        </button>
                    ))}
                </div>
            </div>

            {phase === "ready" && (
                <div className="trial__stage trial__stage--intro">
                    <p className="trial__lead">
                        Bạn có {total} giây để nhìn {length} chữ số. Mỗi số hiện kèm hình của nó; hãy nối các hình thành một cảnh
                        theo thứ tự, rồi gõ lại dãy số.
                    </p>
                    <button type="button" className="btn btn--brand guide-btn" onClick={() => start()}>
                        Bắt đầu
                        <ArrowRight size={18} aria-hidden="true" />
                    </button>
                </div>
            )}

            {phase === "show" && (
                <div className="trial__stage">
                    <ol className="trial__row" aria-label="Dãy số cần nhớ">
                        {digits.map((digit, i) => (
                            <li key={i} className="trial__cell" style={{ "--i": i } as CSSProperties}>
                                <span className="trial__digit">{digit}</span>
                                <span className="trial__disc">
                                    <img src={DIGIT_SHAPES[digit].src} alt={DIGIT_SHAPES[digit].name} className="shape is-live" data-motion={DIGIT_SHAPES[digit].motion} />
                                </span>
                            </li>
                        ))}
                    </ol>
                    <p className="trial__hint">Gợi ý: {linkSentence(story, seed)}</p>
                    <div className="trial__timer" role="timer" aria-label={`Còn ${Math.ceil(left)} giây`}>
                        <span style={{ scale: `${left / total} 1` }} />
                    </div>
                    <button type="button" className="btn btn--quiet trial__small" onClick={() => setPhase("recall")}>
                        Tôi nhớ rồi, che lại
                    </button>
                </div>
            )}

            {phase === "recall" && (
                <form
                    className="trial__stage"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setPhase("result");
                    }}
                >
                    <label htmlFor="number-trial-answer" className="trial__lead">
                        Lần theo cảnh của bạn, đổi từng hình về số.
                    </label>
                    <ol className="trial__row" aria-hidden="true">
                        {digits.map((_, i) => {
                            const value = typed[i];
                            return (
                                <li key={i} className="trial__cell" data-empty={value === undefined}>
                                    <span className="trial__digit">{value ?? "?"}</span>
                                    <span className="trial__disc">
                                        {value !== undefined && <img src={DIGIT_SHAPES[value].src} alt="" />}
                                    </span>
                                </li>
                            );
                        })}
                    </ol>
                    <div className="trial__answer">
                        <input
                            ref={input}
                            id="number-trial-answer"
                            className="trial__input"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={length}
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value.replace(/\D/g, "").slice(0, length))}
                        />
                        <button type="submit" className="btn btn--brand guide-btn" disabled={answer.length === 0}>
                            Kiểm tra
                        </button>
                    </div>
                </form>
            )}

            {phase === "result" && (
                <div className="trial__stage">
                    <ol className="trial__row" aria-label="Kết quả từng chữ số">
                        {digits.map((digit, i) => {
                            const ok = typed[i] === digit;
                            return (
                                <li key={i} className="trial__cell" data-ok={ok} style={{ "--i": i } as CSSProperties}>
                                    <span className="trial__digit">{digit}</span>
                                    <span className="trial__disc">
                                        <img src={DIGIT_SHAPES[digit].src} alt={DIGIT_SHAPES[digit].name} />
                                    </span>
                                    <span className="trial__mark">{ok ? "Đúng" : `Bạn gõ ${typed[i] ?? "trống"}`}</span>
                                </li>
                            );
                        })}
                    </ol>
                    <p className="trial__lead" aria-live="polite">
                        {perfect
                            ? level < LEVELS.length - 1
                                ? `Bạn vừa nhớ ${length} chữ số chỉ sau một lần nhìn. Thử dãy ${LEVELS[level + 1]} số.`
                                : "Tám chữ số, không sai số nào. Đã đến lúc chơi Ghi nhớ số với dãy dài hơn."
                            : advice}
                    </p>
                    <div className="trial__actions">
                        {perfect && level < LEVELS.length - 1 ? (
                            <button type="button" className="btn btn--brand guide-btn" onClick={() => start(level + 1)}>
                                Thử {LEVELS[level + 1]} số
                                <ArrowRight size={18} aria-hidden="true" />
                            </button>
                        ) : (
                            <Link to="/games/numbers" viewTransition className="btn btn--brand guide-btn">
                                Chơi Ghi nhớ số
                                <ArrowRight size={18} aria-hidden="true" />
                            </Link>
                        )}
                        <button type="button" className="btn btn--quiet trial__small" onClick={() => start()}>
                            <RotateCcw size={16} aria-hidden="true" />
                            Dãy mới
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
