// Tạo câu chuyện gợi ý nối các hình theo thứ tự. Câu không cần hợp lý, chỉ cần có hành động
// đi từ hình trước sang hình sau: đó chính là điều phương pháp dạy.

// Số ngẫu nhiên có hạt giống (mulberry32): cùng hạt giống thì cùng đề và cùng câu gợi ý
export const makeRandom = (seed: number) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const ACTIONS = [
    "đẩy ngã",
    "cõng",
    "đội lên đầu",
    "đá văng",
    "ôm chặt",
    "nuốt chửng",
    "kéo theo",
    "ngồi lên",
    "tung lên trời",
    "giấu trong túi",
];

// "Thiên nga cõng quả trứng, quả trứng đá văng người tuyết."
export const linkSentence = (names: string[], seed: number) => {
    const random = makeRandom(seed + 17);
    const parts: string[] = [];
    for (let i = 0; i < names.length - 1; i++) {
        const action = ACTIONS[Math.floor(random() * ACTIONS.length)];
        parts.push(`${names[i]} ${action} ${names[i + 1]}`);
    }
    const sentence = parts.length ? parts.join(", ") : names[0] ?? "";
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
};
