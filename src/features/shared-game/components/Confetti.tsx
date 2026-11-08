import type { CSSProperties } from "react";

const CONFETTI_COLORS = ["#f4c95d", "#ffffff", "#cdebd6", "#cfe7f3", "#f7dc8e"];

// Vị trí và nhịp rơi tính từ thứ tự mảnh, không ngẫu nhiên, để render luôn giống nhau
const PIECES = Array.from({ length: 36 }, (_, i) => ({
  "--x": `${(i * 37) % 100}%`,
  "--c": CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  "--d": `${(i % 9) * 90}ms`,
  "--t": `${1600 + ((i * 53) % 900)}ms`,
  "--r": `${((i * 71) % 540) - 270}deg`,
})) as CSSProperties[];

// Pháo giấy rơi trên bảng điểm khi đạt (CSS .confetti trong game.css; tắt khi người dùng giảm chuyển động)
export const Confetti = () => (
  <div className="confetti" aria-hidden="true">
    {PIECES.map((style, i) => (
      <i key={i} style={style} />
    ))}
  </div>
);
