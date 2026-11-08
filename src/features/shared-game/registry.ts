// UI metadata lives here; counts, scoring, timers and unlocked levels come from the backend catalog.
export const GAME_META = {
    card: { label: "Thẻ bài", color: "#2e7d32", unit: "lá", route: "/games/cards" },
    image: { label: "Hình ảnh", color: "#2a78d6", unit: "hình", route: "/games/images" },
    number: { label: "Ghi nhớ số", color: "#987000", unit: "chữ số", route: "/games/numbers" },
    facename: { label: "Gương mặt & Tên", color: "#a04465", unit: "người", route: "/games/facename" },
    word: { label: "Ghi nhớ từ", color: "#7c3aed", unit: "từ", route: "/games/words" },
} as const;
export type GameName = keyof typeof GAME_META;
export const GAME_IDS = Object.keys(GAME_META) as GameName[];
