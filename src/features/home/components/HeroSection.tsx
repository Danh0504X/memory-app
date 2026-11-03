import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import islandsSvg from "@/assets/memio/B · Hero/Ba đảo ghi nhớ.svg?raw";
import { createMascotWalker, type MascotWalker } from "./mascotWalk";

// Vùng bấm của từng đảo, tính theo khung 580×456 của SVG
const ISLANDS = [
    { word: "câu chuyện", label: "Câu chuyện", target: "/methods#method-story", box: { left: "1.8%", top: "24.5%" } },
    { word: "con số", label: "Con số", target: "/methods#method-numbers", box: { left: "57.5%", top: "11.4%" } },
    { word: "không gian", label: "Không gian", target: "/methods#method-loci", box: { left: "43.7%", top: "58.6%" } },
];

const CYCLE_MS = 3200;

// Linh vật vốn nằm trong nhóm của đảo Câu chuyện (8 path bắt đầu bằng đôi chân).
// Tách nó ra thành nhóm riêng ở cuối SVG, ngoài vùng clip-path, để nó đi được sang đảo khác
// mà không bị cắt khi qua đỉnh vòng cung; file SVG gốc giữ nguyên.
const ISLANDS_ART = (() => {
    const lines = islandsSvg.split(/\r?\n/);
    const start = lines.findIndex((line) => line.includes("M44.0178 199.769L37.1821 207.971L44.0178"));
    if (start < 0) return islandsSvg;
    const mascot = lines.splice(start, 8);
    const close = lines.findLastIndex((line) => line.trim() === "</svg>");
    lines.splice(close, 0, `<g class="mascot-walk"><g class="mascot-body">${mascot.join("")}</g></g>`);
    return lines.join("\n");
})();

export const HeroSection = () => {
    const [active, setActive] = useState(0);
    const paused = useRef(false);
    const art = useRef<HTMLDivElement>(null);
    const walker = useRef<MascotWalker | null>(null);

    // Tự giới thiệu đủ ba đảo đúng một vòng rồi dừng ở đảo đầu (nội dung tự chạy không kéo dài mãi);
    // tạm ngưng khi người dùng đang rê/chọn hoặc tab bị ẩn, bỏ hẳn khi tắt chuyển động
    useEffect(() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let steps = 0;
        const timer = setInterval(() => {
            if (paused.current || document.visibilityState !== "visible") return;
            steps += 1;
            setActive(steps % ISLANDS.length);
            if (steps >= ISLANDS.length) clearInterval(timer);
        }, CYCLE_MS);
        return () => clearInterval(timer);
    }, []);

    // Linh vật đi bộ dọc đường nét đứt sang đảo đang chọn (mascotWalk.ts).
    // Việc lấy mẫu đường đi tốn vài chục ms nên để lúc trình duyệt rảnh, sau khi trang đã hiện.
    const activeNow = useRef(active);
    useEffect(() => {
        const route = art.current?.querySelector<SVGPathElement>("svg > g > path");
        const mascot = art.current?.querySelector<SVGGElement>(".mascot-walk");
        if (!route || !mascot) return;

        const create = () => {
            walker.current = createMascotWalker(route, mascot);
            // Người dùng đã chọn đảo khác trước khi linh vật sẵn sàng: đi tới đó luôn
            if (activeNow.current !== 0) walker.current.walkTo(activeNow.current);
        };
        // Safari cũ chưa có requestIdleCallback: dùng setTimeout thay
        const hasIdle = typeof window.requestIdleCallback === "function";
        const handle = hasIdle ? window.requestIdleCallback(create, { timeout: 600 }) : window.setTimeout(create, 200);

        return () => {
            if (hasIdle) window.cancelIdleCallback(handle);
            else window.clearTimeout(handle);
            walker.current?.stop();
            walker.current = null;
        };
    }, []);

    useEffect(() => {
        activeNow.current = active;
        walker.current?.walkTo(active);
    }, [active]);

    const select = (index: number) => {
        paused.current = true;
        setActive(index);
    };

    return (
        <section className="hero">
            <div className="hero__inner page-col">
                <div className="hero__copy">
                    <h1 className="hero__title">
                        <span className="hero__line">
                            <span>Nhớ bằng</span>
                        </span>
                        <span className="hero__line hero__line--word">
                            <span key={active} className="hero__word">{ISLANDS[active].word}</span>
                        </span>
                    </h1>
                    <p className="hero__lead">
                        Memio giúp rèn luyện trí nhớ qua trò chơi: nối hình thành câu chuyện, biến số thành hình
                        và đặt đồ vật vào một căn phòng quen thuộc.
                    </p>
                    <div className="hero__actions">
                        <Link to="/games" viewTransition className="btn btn--brand">
                            Bắt đầu chơi
                            <ArrowRight size={18} aria-hidden="true" />
                        </Link>
                        <Link to="/methods" viewTransition className="btn btn--quiet">
                            Xem ba cách nhớ
                        </Link>
                    </div>
                    <ul className="hero__facts">
                        <li>Miễn phí</li>
                        <li>Chơi ngay, không cần tài khoản</li>
                        <li>Vài phút mỗi ván</li>
                    </ul>
                </div>

                <div
                    className="islands"
                    data-active={active}
                    onPointerLeave={() => (paused.current = false)}
                >
                    <div
                        ref={art}
                        className="islands__art"
                        aria-hidden="true"
                        dangerouslySetInnerHTML={{ __html: ISLANDS_ART }}
                    />
                    {ISLANDS.map((island, index) => (
                        <Link
                            key={island.word}
                            to={island.target}
                            viewTransition
                            className="islands__hit"
                            style={island.box}
                            aria-label={`${island.label}: xem cách nhớ bằng ${island.word}`}
                            aria-current={active === index ? "true" : undefined}
                            onPointerEnter={() => select(index)}
                            onFocus={() => select(index)}
                            onBlur={() => (paused.current = false)}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};
