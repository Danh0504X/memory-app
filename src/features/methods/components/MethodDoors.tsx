import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import cat from "@/assets/memio/game/card-cat.svg";
import umbrella from "@/assets/memio/game/card-umbrella.svg";
import cake from "@/assets/memio/game/card-cake.svg";
import bicycle from "@/assets/memio/game/card-bicycle.svg";
import egg from "@/assets/memio/guides/num-0-egg.svg";
import swan from "@/assets/memio/guides/num-2-swan.svg";
import snowman from "@/assets/memio/guides/num-8-snowman.svg";
import door from "@/assets/memio/practice/door.svg";
import apple from "@/assets/memio/practice/apple.svg";
import bed from "@/assets/memio/practice/bed.svg";
import { METHODS, type MethodId } from "../methodsData";

// Đồ vật trong mỗi cột, cử động theo tính cách riêng khi cột mở rộng (chuyển động .shape trong index.css)
const ART: Record<MethodId, { src: string; motion: string; digit?: number }[]> = {
    story: [
        { src: cat, motion: "hop" },
        { src: umbrella, motion: "swing" },
        { src: cake, motion: "wobble" },
        { src: bicycle, motion: "glide" },
    ],
    numbers: [
        { src: swan, motion: "glide", digit: 2 },
        { src: egg, motion: "wobble", digit: 0 },
        { src: snowman, motion: "tilt", digit: 8 },
    ],
    loci: [
        { src: door, motion: "tilt" },
        { src: apple, motion: "bob" },
        { src: bed, motion: "rock" },
    ],
};

// Việc thật trẻ hay phải nhớ, mỗi việc ứng với cách hợp nhất và một gợi ý dùng ngay
const EXAMPLES: { label: string; method: MethodId; tip: string }[] = [
    { label: "Số điện thoại của mẹ", method: "numbers", tip: "Đổi từng chữ số thành hình rồi nối lại: 0 là quả trứng, 9 là bóng bay, 8 là người tuyết…" },
    { label: "Ngày sinh nhật", method: "numbers", tip: "Sinh nhật ngày 28? Thiên nga (2) cưỡi lên lưng người tuyết (8)." },
    { label: "Đồ cần mua ở chợ", method: "loci", tip: "Đặt từng món vào một chỗ trong nhà: trứng ở cửa, sữa trên bàn, rau trên giường. Đi một vòng là đủ." },
    { label: "Ý chính bài học", method: "loci", tip: "Mỗi ý chính một chỗ trong lớp: bảng, bàn cô giáo, cửa sổ… rồi đi lại đúng thứ tự." },
    { label: "Thứ tự các hành tinh", method: "story", tip: "Nối tên các hành tinh thành một chuyến phiêu lưu, hành tinh trước dẫn tới hành tinh sau." },
    { label: "Việc cần làm buổi sáng", method: "story", tip: "Đánh răng, ăn sáng, đeo cặp: kể thành một câu chuyện ngắn rồi làm theo đúng thứ tự." },
];

// Đầu trang Phương pháp: hàng ví dụ "Bạn muốn nhớ gì?" và ba cột màu. Cột đang rê/focus, hoặc cột hợp với
// ví dụ vừa chọn, giãn rộng ra và hiện gợi ý; bấm vào cột thì tới chương của phương pháp đó.
export const MethodDoors = () => {
    const [picked, setPicked] = useState<number | null>(null);
    const [hovered, setHovered] = useState<MethodId | null>(null);
    const example = picked === null ? null : EXAMPLES[picked];
    const open: MethodId = hovered ?? example?.method ?? "story";

    return (
        <div className="doors-wrap">
            <div className="examples">
                <h2 className="examples__title">Bạn muốn nhớ gì?</h2>
                <div className="examples__list" role="group" aria-label="Ví dụ điều cần nhớ">
                    {EXAMPLES.map((item, index) => (
                        <button
                            key={item.label}
                            type="button"
                            className="examples__chip"
                            aria-pressed={picked === index}
                            onClick={() => {
                                setPicked(picked === index ? null : index);
                                setHovered(null);
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="doors" onPointerLeave={() => setHovered(null)}>
                {METHODS.map((method) => {
                    const isOpen = open === method.id;
                    const tip = example?.method === method.id ? example : null;
                    return (
                        <Link
                            key={method.id}
                            to={`#method-${method.id}`}
                            className={`door door--${method.tone}`}
                            data-open={isOpen}
                            onPointerEnter={() => setHovered(method.id)}
                            onFocus={() => setHovered(method.id)}
                            onBlur={() => setHovered(null)}
                        >
                            <span className="door__art" aria-hidden="true">
                                {ART[method.id].map((item) => (
                                    <span key={item.src} className="door__item">
                                        {/* key đổi khi cột mở để đồ vật cử động lại một lần */}
                                        <img
                                            key={`${item.src}-${isOpen}`}
                                            src={item.src}
                                            alt=""
                                            className={`shape${isOpen ? " is-live" : ""}`}
                                            data-motion={item.motion}
                                        />
                                        {item.digit !== undefined && <span className="door__digit">{item.digit}</span>}
                                    </span>
                                ))}
                            </span>
                            <span className="door__name">{method.name}</span>
                            <span className="door__for">{method.goodFor}</span>
                            <span className="door__more">
                                <span className="door__tip" aria-live="polite">
                                    {tip ? (
                                        <>
                                            <strong>{tip.label}:</strong> {tip.tip}
                                        </>
                                    ) : (
                                        method.example
                                    )}
                                </span>
                                <span className="door__go">
                                    Vào chương này
                                    <ArrowRight size={18} aria-hidden="true" />
                                </span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
