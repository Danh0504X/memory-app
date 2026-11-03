// Cho linh vật đi bộ giữa ba hòn đảo theo đúng đường nét đứt trong SVG "Ba đảo ghi nhớ".
// Mọi toạ độ tính theo khung 580×456 của SVG.

type Point = { x: number; y: number };

// Điểm giữa hai bàn chân linh vật trong SVG gốc (nó vốn đứng trên đảo Câu chuyện)
const FEET: Point = { x: 61, y: 215 };

// Chỗ đứng trên mặt từng đảo khi đảo đó đang được chọn (đã tính phần đảo nhấc lên 14px)
const STANDS: Point[] = [
    { x: 59, y: 197 },
    { x: 369, y: 137 },
    { x: 301, y: 353 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (edge0: number, edge1: number, t: number) => {
    const x = clamp((t - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
};

export type MascotWalker = { walkTo: (island: number) => void; stop: () => void };

export const createMascotWalker = (route: SVGPathElement, mascot: SVGGElement): MascotWalker => {
    const total = route.getTotalLength();
    const pointAt = (s: number): Point => route.getPointAtLength(clamp(s, 0, total));

    // Điểm trên đường gần chỗ đứng của từng đảo nhất. Đường nét đứt hở ở đảo Câu chuyện
    // (đi ra từ mép trên, về tới dưới chân đảo) nên đảo này có thêm lối vào ở cuối đường.
    const samples = Array.from({ length: 241 }, (_, k) => (total * k) / 240);
    const nearest = (stand: Point) =>
        samples.reduce((best, s) => {
            const p = pointAt(s);
            return Math.hypot(p.x - stand.x, p.y - stand.y) < Math.hypot(pointAt(best).x - stand.x, pointAt(best).y - stand.y)
                ? s
                : best;
        }, 0);
    const docks = STANDS.map((stand, index) => (index === 0 ? [nearest(stand), total] : [nearest(stand)]));

    const offsetAt = (s: number, stand: Point): Point => {
        const p = pointAt(s);
        return { x: stand.x - p.x, y: stand.y - p.y };
    };

    // Trạng thái hiện tại: vị trí trên đường (s) và độ lệch từ đường tới chỗ đứng (off)
    let s = docks[0][0];
    let off = offsetAt(s, STANDS[0]);
    let lean = 0;
    let frame = 0;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const place = (x: number, y: number, tilt: number) => {
        mascot.setAttribute(
            "transform",
            `translate(${(x - FEET.x).toFixed(2)} ${(y - FEET.y).toFixed(2)}) rotate(${tilt.toFixed(2)} ${FEET.x} ${FEET.y})`,
        );
    };

    place(STANDS[0].x, STANDS[0].y, 0);

    const walkTo = (island: number) => {
        cancelAnimationFrame(frame);
        const stand = STANDS[island];

        // Chọn lối vào có tổng quãng đi ngắn nhất (đi dọc đường + bước lên đảo)
        const target = docks[island]
            .map((dock) => {
                const o = offsetAt(dock, stand);
                return { s: dock, off: o, cost: Math.abs(dock - s) + Math.hypot(o.x, o.y) };
            })
            .sort((a, b) => a.cost - b.cost)[0];

        if (reduceMotion) {
            s = target.s;
            off = target.off;
            lean = 0;
            place(stand.x, stand.y, 0);
            return;
        }

        const from = { s, off: { ...off } };
        const along = Math.abs(target.s - from.s);
        const stepOff = Math.hypot(from.off.x, from.off.y);
        const stepOn = Math.hypot(target.off.x, target.off.y);
        const duration = clamp((along + stepOff + stepOn) / 0.32, 900, 2000);
        const steps = Math.max(2, Math.round(along / 42));
        // Bước càng dài (vd. từ cuối đường leo lên đảo Câu chuyện) càng chiếm nhiều thời gian để cú nhảy tròn, không giật
        const leaveSpan = clamp(0.16 + stepOff / 500, 0.16, 0.4);
        const arriveSpan = clamp(0.16 + stepOn / 500, 0.16, 0.4);
        const start = performance.now();
        let lastX: number | null = null;

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const e = easeInOut(t);

            // Rời đảo ở đầu, bước lên đảo đích ở cuối; ở giữa chân đặt đúng trên đường nét đứt
            const leave = 1 - smooth(0, leaveSpan, t);
            const arrive = smooth(1 - arriveSpan, 1, t);
            s = from.s + (target.s - from.s) * e;
            off = {
                x: from.off.x * leave + target.off.x * arrive,
                y: from.off.y * leave + target.off.y * arrive,
            };
            const p = pointAt(s);

            // Nhảy nhẹ khi bước khỏi/lên đảo (cao hơn nếu bước dài), nhún theo từng bước khi đi trên đường
            const hopOff = Math.sin(Math.PI * clamp(t / leaveSpan, 0, 1)) * (8 + stepOff * 0.25);
            const hopOn = Math.sin(Math.PI * clamp((t - (1 - arriveSpan)) / arriveSpan, 0, 1)) * (8 + stepOn * 0.25);
            const stride = Math.abs(Math.sin(e * Math.PI * steps)) * 4 * Math.sin(Math.PI * t);
            const x = p.x + off.x;
            const y = p.y + off.y - hopOff - hopOn - stride;

            // Nghiêng người theo hướng đi, dịu dần về thẳng khi tới nơi
            const vx = lastX === null ? 0 : x - lastX;
            lastX = x;
            lean = lean * 0.85 + clamp(vx * 2.2, -9, 9) * 0.15;

            place(x, y, t < 1 ? lean : 0);
            if (t < 1) frame = requestAnimationFrame(tick);
            else lean = 0;
        };

        frame = requestAnimationFrame(tick);
    };

    return { walkTo, stop: () => cancelAnimationFrame(frame) };
};
