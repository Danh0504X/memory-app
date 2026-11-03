import { Fragment, useState, type KeyboardEvent } from "react";
import { Delete, RotateCcw } from "lucide-react";

import cat from "@/assets/memio/game/card-cat.svg";
import umbrella from "@/assets/memio/game/card-umbrella.svg";
import cake from "@/assets/memio/game/card-cake.svg";
import bicycle from "@/assets/memio/game/card-bicycle.svg";
import egg from "@/assets/memio/guides/num-0-egg.svg";
import candle from "@/assets/memio/guides/num-1-candle.svg";
import swan from "@/assets/memio/guides/num-2-swan.svg";
import butterfly from "@/assets/memio/guides/num-3-butterfly.svg";
import boat from "@/assets/memio/guides/num-4-boat.svg";
import hook from "@/assets/memio/guides/num-5-hook.svg";
import cherry from "@/assets/memio/guides/num-6-cherry.svg";
import boomerang from "@/assets/memio/guides/num-7-boomerang.svg";
import snowman from "@/assets/memio/guides/num-8-snowman.svg";
import balloon from "@/assets/memio/guides/num-9-balloon.svg";
import roomEmpty from "@/assets/memio/practice/room-step1.svg";
import roomApple from "@/assets/memio/practice/room-step2.svg";
import roomCat from "@/assets/memio/practice/room-step3.svg";
import roomAll from "@/assets/memio/practice/room-step4.svg";

/* Nối thành câu chuyện: chạm các hình đúng thứ tự, câu chuyện tự viết dần ra */

const STORY = [
    { name: "Mèo", src: cat, line: "Một chú mèo" },
    { name: "Ô", src: umbrella, line: "cầm chiếc ô." },
    { name: "Bánh", src: cake, line: "Chiếc ô hứng được một chiếc bánh khổng lồ." },
    { name: "Xe đạp", src: bicycle, line: "Chiếc bánh lăn lên xe đạp rồi chạy đi!" },
];

// Thứ tự hiển thị bị xáo để người chơi phải nhớ thứ tự thật
const STORY_LAYOUT = [2, 0, 3, 1];

export const StoryDemo = () => {
    const [told, setTold] = useState(0);
    const [missed, setMissed] = useState<number | null>(null);
    const done = told === STORY.length;

    const pick = (index: number) => {
        if (index < told) return;
        if (index === told) {
            setTold(told + 1);
            setMissed(null);
        } else {
            setMissed(index);
        }
    };

    return (
        <div className="demo" data-ui>
            <h3 className="demo__title">Kể theo thứ tự: mèo, ô, bánh, xe đạp</h3>

            <div className="story-cards">
                {STORY_LAYOUT.map((index) => {
                    const card = STORY[index];
                    return (
                        <button
                            key={`${card.name}-${missed === index ? "miss" : "ok"}`}
                            type="button"
                            className="story-card"
                            data-used={index < told}
                            data-missed={missed === index}
                            aria-pressed={index < told}
                            onClick={() => pick(index)}
                        >
                            <img src={card.src} alt="" className="shape" data-motion="hop" />
                            <span>{card.name}</span>
                        </button>
                    );
                })}
            </div>

            <p className="story-text" aria-live="polite">
                {told === 0 && <span className="story-text__hint">Câu chuyện sẽ hiện ở đây.</span>}
                {STORY.slice(0, told).map((part) => (
                    <Fragment key={part.line}>
                        <span className="story-text__part">{part.line}</span>{" "}
                    </Fragment>
                ))}
            </p>

            <div className="demo__foot">
                <p className="demo__status" aria-live="polite">
                    {done
                        ? "Xong! Giờ nhắm mắt và kể lại xem."
                        : missed !== null
                          ? told === 0
                              ? "Chưa đúng. Câu chuyện bắt đầu từ hình nào nhỉ?"
                              : `Chưa đúng. Sau ${STORY[told - 1].name.toLowerCase()} là hình nào?`
                          : `${told} trên ${STORY.length} hình đã vào câu chuyện.`}
                </p>
                {told > 0 && (
                    <button type="button" className="btn btn--quiet demo__reset" onClick={() => { setTold(0); setMissed(null); }}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Kể lại
                    </button>
                )}
            </div>
        </div>
    );
};

/* Biến số thành hình: gõ một dãy số, mỗi số hiện thành hình của nó và cử động theo đúng tính cách */

const SHAPES = [
    { digit: 0, name: "Quả trứng", src: egg, motion: "wobble" },
    { digit: 1, name: "Cây nến", src: candle, motion: "flicker" },
    { digit: 2, name: "Thiên nga", src: swan, motion: "glide" },
    { digit: 3, name: "Con bướm", src: butterfly, motion: "flap" },
    { digit: 4, name: "Chiếc thuyền", src: boat, motion: "rock" },
    { digit: 5, name: "Lưỡi câu", src: hook, motion: "swing" },
    { digit: 6, name: "Quả anh đào", src: cherry, motion: "swing" },
    { digit: 7, name: "Boomerang", src: boomerang, motion: "spin" },
    { digit: 8, name: "Người tuyết", src: snowman, motion: "tilt" },
    { digit: 9, name: "Bóng bay", src: balloon, motion: "bob" },
];

const MAX_DIGITS = 4;
const EXAMPLE = [2, 0, 8];

export const NumbersDemo = () => {
    const [digits, setDigits] = useState<number[]>(EXAMPLE);
    const full = digits.length >= MAX_DIGITS;

    const add = (digit: number) => setDigits((current) => (current.length >= MAX_DIGITS ? current : [...current, digit]));
    const removeLast = () => setDigits((current) => current.slice(0, -1));

    // Gõ trực tiếp bằng bàn phím khi đang ở trong bảng: phím số để thêm, Backspace để xoá
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (/^\d$/.test(event.key)) {
            event.preventDefault();
            add(Number(event.key));
        } else if (event.key === "Backspace") {
            event.preventDefault();
            removeLast();
        }
    };

    const names = digits.map((digit) => SHAPES[digit].name.toLowerCase());
    const story =
        digits.length === 0
            ? "Bấm các số bên dưới để tạo một dãy."
            : digits.join("") === "208"
              ? "Muốn nhớ 208? Thiên nga mang quả trứng đến tặng người tuyết."
              : digits.length === 1
                ? `Số ${digits[0]} là ${names[0]}. Thêm số nữa để nối thành chuyện.`
                : `Giờ hãy nghĩ một câu chuyện nối ${names.join(", ")}.`;

    return (
        <div className="demo" data-ui onKeyDown={onKeyDown}>
            <h3 className="demo__title">Gõ một dãy số, xem nó thành hình</h3>

            <div className="sequence">
                <p className="sequence__number" aria-live="polite">
                    {digits.length ? digits.join("") : "…"}
                </p>
                <ol className="sequence__shapes" aria-label="Hình của từng chữ số">
                    {digits.map((digit, index) => (
                        <li key={`${index}-${digit}`}>
                            <img src={SHAPES[digit].src} alt="" className="shape is-live" data-motion={SHAPES[digit].motion} />
                            <span>{SHAPES[digit].name}</span>
                        </li>
                    ))}
                    {Array.from({ length: MAX_DIGITS - digits.length }, (_, index) => (
                        <li key={`empty-${index}`} className="sequence__empty" aria-hidden="true" />
                    ))}
                </ol>
            </div>

            <div className="keypad" role="group" aria-label="Thêm chữ số vào dãy">
                {SHAPES.map((item) => (
                    <button
                        key={item.digit}
                        type="button"
                        className="keypad__key"
                        disabled={full}
                        aria-label={`Thêm số ${item.digit}: ${item.name}`}
                        onClick={() => add(item.digit)}
                    >
                        {item.digit}
                    </button>
                ))}
            </div>

            <div className="demo__foot">
                <p className="demo__status" aria-live="polite">{story}</p>
                <div className="sequence__tools">
                    <button type="button" className="btn btn--quiet demo__reset" disabled={!digits.length} onClick={removeLast}>
                        <Delete size={16} aria-hidden="true" />
                        Xoá số cuối
                    </button>
                    <button type="button" className="btn btn--quiet demo__reset" disabled={!digits.length} onClick={() => setDigits([])}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Làm lại
                    </button>
                </div>
            </div>
        </div>
    );
};

/* Khám phá căn phòng trí nhớ: đặt lần lượt từng đồ vật vào chỗ của nó */

const ROOM_STEPS = [
    { item: "quả táo", place: "cửa phòng", image: roomApple },
    { item: "chú mèo", place: "bàn học", image: roomCat },
    { item: "quả bóng", place: "giường", image: roomAll },
];

export const LociDemo = () => {
    const [placed, setPlaced] = useState(0);
    const done = placed === ROOM_STEPS.length;
    const images = [roomEmpty, ...ROOM_STEPS.map((step) => step.image)];

    return (
        <div className="demo" data-ui>
            <h3 className="demo__title">Đi qua cửa phòng, bàn học rồi đến giường</h3>

            <div className="room-stack">
                {images.map((image, index) => (
                    <img
                        key={image}
                        src={image}
                        alt={index === placed ? `Căn phòng với ${placed} đồ vật đã được đặt` : ""}
                        aria-hidden={index !== placed}
                        data-on={index === placed}
                    />
                ))}
            </div>

            <ul className="room-list">
                {ROOM_STEPS.map((step, index) => (
                    <li key={step.place} data-done={index < placed}>
                        <span className="room-list__place">{step.place}</span>
                        <span>{index < placed ? step.item : "còn trống"}</span>
                    </li>
                ))}
            </ul>

            <div className="demo__foot">
                <p className="demo__status" aria-live="polite">
                    {done ? "Giờ đi lại lộ trình trong đầu và gọi tên từng đồ vật." : `${placed} trên 3 chỗ đã có đồ vật.`}
                </p>
                {done ? (
                    <button type="button" className="btn btn--quiet demo__reset" onClick={() => setPlaced(0)}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Làm lại
                    </button>
                ) : (
                    <button type="button" className="btn btn--brand demo__reset" onClick={() => setPlaced(placed + 1)}>
                        Đặt {ROOM_STEPS[placed].item} vào {ROOM_STEPS[placed].place}
                    </button>
                )}
            </div>
        </div>
    );
};
