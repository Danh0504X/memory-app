// UI metadata lives here; counts, scoring, timers and unlocked levels come from the backend catalog.
// Mỗi trò một màu: color (nền ô, chữ trắng đủ tương phản), edge (gờ dưới đậm hơn), tint (nền nhạt).
export const GAME_META = {
    card: { label: "Thẻ bài", color: "#2e7d32", edge: "#1f5c23", tint: "#e3f4e6", unit: "lá", route: "/games/cards" },
    image: { label: "Hình ảnh", color: "#1c7ed6", edge: "#1864ab", tint: "#e3f0fc", unit: "hình", route: "/games/images" },
    number: { label: "Ghi nhớ số", color: "#e8590c", edge: "#c2410c", tint: "#fff0e6", unit: "chữ số", route: "/games/numbers" },
    facename: { label: "Gương mặt & Tên", color: "#d6336c", edge: "#a61e4d", tint: "#ffe8f0", unit: "người", route: "/games/facename" },
    word: { label: "Ghi nhớ từ", color: "#0c8599", edge: "#0b7285", tint: "#e3f6f8", unit: "từ", route: "/games/words" },
} as const;
export type GameName = keyof typeof GAME_META;
export const GAME_IDS = Object.keys(GAME_META) as GameName[];
