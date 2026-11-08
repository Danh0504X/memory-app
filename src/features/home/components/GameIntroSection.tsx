import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useReveal } from "@/lib/useReveal";
import memioMark from "@/assets/memio/Logo/Memio.svg";
import cat from "@/assets/memio/game/card-cat.svg";
import umbrella from "@/assets/memio/game/card-umbrella.svg";
import cake from "@/assets/memio/game/card-cake.svg";
import bicycle from "@/assets/memio/game/card-bicycle.svg";

const CARDS = [
    { name: "Mèo", src: cat },
    { name: "Ô", src: umbrella },
    { name: "Bánh", src: cake },
    { name: "Xe đạp", src: bicycle },
];

const STEPS = [
    { title: "Quan sát", text: "Làm quen với một dãy bài ngắn." },
    { title: "Tạo liên kết", text: "Nối các hình thành câu chuyện hoặc đặt chúng vào những vị trí đã học." },
    { title: "Nhớ lại", text: "Xếp lại dãy bài khi chúng được úp xuống và đối chiếu kết quả." },
];

const MEMORIZE_SEC = 5;

// Ván mini: ready → memorize (xem dãy bài) → recall (bài úp, chạm theo thứ tự) → done (chấm từng ô)
type Phase = "ready" | "memorize" | "recall" | "done";

const shuffle = (items: number[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const delay = (d: number) => ({ "--d": d }) as CSSProperties;

export const GameIntroSection = () => {
    const root = useRef<HTMLElement>(null);
    const [stage, setStage] = useState<Phase>("ready");
    const [order, setOrder] = useState([0, 1, 2, 3]);
    const [choices, setChoices] = useState([0, 1, 2, 3]);
    const [picks, setPicks] = useState<number[]>([]);
    const [secondsLeft, setSecondsLeft] = useState(MEMORIZE_SEC);
    useReveal(root);

    // Hết giờ ghi nhớ thì tự sang lượt nhớ lại (bài úp xuống)
    const phase: Phase = stage === "memorize" && secondsLeft === 0 ? "recall" : stage;

    // Đếm ngược thời gian ghi nhớ
    useEffect(() => {
        if (phase !== "memorize") return;
        const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
        return () => clearTimeout(timer);
    }, [phase, secondsLeft]);

    const start = () => {
        const next = shuffle([0, 1, 2, 3]);
        setOrder(next);
        setChoices(shuffle(next));
        setPicks([]);
        setSecondsLeft(MEMORIZE_SEC);
        setStage("memorize");
    };

    const pick = (card: number) => {
        if (phase !== "recall" || picks.includes(card)) return;
        const next = [...picks, card];
        setPicks(next);
        if (next.length === CARDS.length) setStage("done");
    };

    const correct = picks.filter((card, slot) => card === order[slot]).length;

    const status = {
        ready: `Nhớ thứ tự 4 lá trong ${MEMORIZE_SEC} giây, rồi xếp lại khi chúng úp xuống.`,
        memorize: `Nhớ thứ tự này nhé. Còn ${secondsLeft} giây.`,
        recall: `Chạm các lá bên dưới theo đúng thứ tự (${picks.length} trên 4).`,
        done:
            correct === CARDS.length
                ? "Đúng cả 4 lá! Trí nhớ của bạn tốt lắm."
                : `Đúng ${correct} trên 4 lá. Thử nối 4 hình thành một câu chuyện rồi chơi lại nhé.`,
    }[phase];

    return (
        <section className="game" ref={root} aria-labelledby="game-title">
            <div className="game__inner page-col">
                <div className="game__copy">
                    <h2 id="game-title" className="text-title">
                        <span data-reveal="line"><span>Thử ngay với</span></span>
                        <span data-reveal="line" style={delay(1)}><span>những lá bài</span></span>
                    </h2>
                    <p className="text-lead" data-reveal style={delay(2)}>
                        Những lá bài vừa xuất hiện theo thứ tự nào? Quan sát, chọn một cách nhớ rồi xếp lại khi chúng
                        được úp xuống.
                    </p>
                    <ul className="game__steps" data-reveal style={delay(3)}>
                        {STEPS.map((step) => (
                            <li key={step.title}>
                                <strong>{step.title}</strong>
                                <span>{step.text}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="game__actions" data-reveal style={delay(4)}>
                        <Link to="/games" viewTransition className="btn btn--brand">
                            Chơi bản đầy đủ
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <p>Bản đầy đủ có 10 cấp độ, từ 5 đến 52 lá bài.</p>
                    </div>
                </div>

                <div className="table" data-reveal="deal" data-ui>
                    <ol className="table__cards" aria-label="Dãy bài">
                        {order.map((cardIndex, slot) => {
                            const picked = picks[slot];
                            const shownCard = phase === "recall" || phase === "done" ? picked : cardIndex;
                            const faceDown = shownCard === undefined;
                            const card = CARDS[shownCard ?? cardIndex];
                            return (
                                <li key={slot} className="playing-card" style={{ "--i": slot } as CSSProperties}>
                                    <span
                                        className="playing-card__inner"
                                        data-flipped={faceDown}
                                        data-result={phase === "done" ? (picked === cardIndex ? "right" : "wrong") : undefined}
                                    >
                                        <span className="playing-card__face">
                                            <img src={card.src} alt="" className="shape" data-motion="hop" />
                                            <span>{faceDown ? "Lá úp" : card.name}</span>
                                        </span>
                                        <span className="playing-card__back" aria-hidden="true">
                                            <img src={memioMark} alt="" />
                                        </span>
                                    </span>
                                </li>
                            );
                        })}
                    </ol>

                    {phase === "recall" && (
                        <div className="table__choices" role="group" aria-label="Chọn lá theo thứ tự">
                            {choices.map((cardIndex) => (
                                <button
                                    key={cardIndex}
                                    type="button"
                                    className="choice"
                                    disabled={picks.includes(cardIndex)}
                                    onClick={() => pick(cardIndex)}
                                >
                                    <img src={CARDS[cardIndex].src} alt="" />
                                    <span>{CARDS[cardIndex].name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="table__foot">
                        <p className="table__status" aria-live="polite">{status}</p>
                        {(phase === "ready" || phase === "done") && (
                            <button type="button" className="btn btn--sun table__start" onClick={start}>
                                {phase === "ready" ? (
                                    "Chơi thử một ván"
                                ) : (
                                    <>
                                        <RotateCcw size={16} aria-hidden="true" />
                                        Chơi lại
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
