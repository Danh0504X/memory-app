import type { ReactNode } from "react";
import type { MethodId } from "../methodsData";
import type { Picture, ShapeMotion } from "./pictures";
import type { Woodcut } from "./woodcuts";

export type Tone = "mint" | "sun" | "sky";

export interface IndexItem {
    name: string;
    art: ReactNode;      // Thứ đứng trên đĩa khi mục này được chọn
    fact: string;        // Một câu về mục này, đặt cạnh đĩa
}

export interface ApplyItem {
    name: string;
    fact: string;        // Ghi chú ngắn bên phải tên (vd. "Hợp nhất")
    text: string;        // Áp dụng phương pháp vào đây thế nào
    note?: string;       // Một mẹo cụ thể, in màu nhấn
    to?: string;         // Trò chơi trong Memio; bỏ trống với việc ngoài đời
    art: { src: string; color: string };
}

export interface GuideContent {
    id: MethodId;
    tone: Tone;
    crumb: string;
    title: string;
    lead: string;
    hero: { picture: Picture; woodcut: Woodcut };
    how: {
        title: string;
        intro: string;
        loose: Picture[];                                   // Lúc đầu: rời rạc
        ordered: { picture: Picture; label: string }[];     // Lúc cuối: đúng thứ tự, có nhãn
        steps: { name: string; text: string }[];            // Ba bước, đúng ba vùng của sơ đồ
    };
    index: { title: string; hint: string; items: IndexItem[] };
    trial: { title: string; intro: string; game: ReactNode };
    history: { title: string; text: string; woodcuts: Woodcut[] };
    apply: { title: string; groups: { name: string; items: ApplyItem[] }[] };
    close: {
        line: string;
        text: string;
        fact: string;
        action: { to: string; label: string };
        next: { to: string; label: string };
        motion: ShapeMotion;
        picture: Picture;
    };
}
