// Hình dùng chung cho ba trang hướng dẫn phương pháp và các trò thử trong đó.

import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

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
import cat from "@/assets/memio/game/card-cat.svg";
import umbrella from "@/assets/memio/game/card-umbrella.svg";
import cake from "@/assets/memio/game/card-cake.svg";
import bicycle from "@/assets/memio/game/card-bicycle.svg";
import apple from "@/assets/memio/practice/apple.svg";
import ball from "@/assets/memio/practice/ball.svg";
import door from "@/assets/memio/practice/door.svg";
import desk from "@/assets/memio/practice/desk.svg";
import bed from "@/assets/memio/practice/bed.svg";

export type ShapeMotion = "wobble" | "flicker" | "glide" | "flap" | "rock" | "swing" | "spin" | "tilt" | "bob" | "hop";

export interface Picture {
    name: string;
    // Component SVG (metro.config.js): vẽ bằng <Picture.src width={...} height={...} />
    src: FC<SvgProps>;
    motion: ShapeMotion;
}

export interface DigitShape extends Picture {
    digit: number;
    // Vì sao chữ số này mang hình ấy: nét giống nhau giúp đổi qua lại không cần đoán
    why: string;
}

// Mỗi chữ số một hình cố định, chọn theo dáng của chữ số
export const DIGIT_SHAPES: DigitShape[] = [
    { digit: 0, name: "Quả trứng", src: egg, motion: "wobble", why: "Một vòng kín, không đầu không cuối, như vỏ trứng." },
    { digit: 1, name: "Cây nến", src: candle, motion: "flicker", why: "Một nét thẳng đứng, đỉnh có ngọn lửa nhỏ." },
    { digit: 2, name: "Thiên nga", src: swan, motion: "glide", why: "Đường cong trên là cổ cong, nét ngang dưới là mặt nước." },
    { digit: 3, name: "Con bướm", src: butterfly, motion: "flap", why: "Hai vòng hở chồng lên nhau là đôi cánh nhìn nghiêng." },
    { digit: 4, name: "Cánh buồm", src: boat, motion: "rock", why: "Nét chéo và nét ngang tạo thành tấm buồm tam giác." },
    { digit: 5, name: "Lưỡi câu", src: hook, motion: "swing", why: "Bụng tròn bên dưới cong lên như lưỡi câu cá." },
    { digit: 6, name: "Quả anh đào", src: cherry, motion: "swing", why: "Một quả tròn treo dưới cuống cong." },
    { digit: 7, name: "Boomerang", src: boomerang, motion: "spin", why: "Hai cánh gấp một góc nhọn, ném đi rồi bay về." },
    { digit: 8, name: "Người tuyết", src: snowman, motion: "tilt", why: "Hai vòng chồng nhau: cái đầu trên thân." },
    { digit: 9, name: "Bóng bay", src: balloon, motion: "bob", why: "Quả bóng tròn ở trên, sợi dây thả xuống dưới." },
];

// Đồ vật cho trò kể chuyện và trò căn phòng: hình đã có trong Memio, dễ gọi tên
export const OBJECTS: Picture[] = [
    { name: "Mèo", src: cat, motion: "hop" },
    { name: "Ô", src: umbrella, motion: "swing" },
    { name: "Bánh", src: cake, motion: "wobble" },
    { name: "Xe đạp", src: bicycle, motion: "rock" },
    { name: "Quả táo", src: apple, motion: "wobble" },
    { name: "Quả bóng", src: ball, motion: "hop" },
    { name: "Quả trứng", src: egg, motion: "wobble" },
    { name: "Cây nến", src: candle, motion: "flicker" },
    { name: "Thiên nga", src: swan, motion: "glide" },
    { name: "Con bướm", src: butterfly, motion: "flap" },
    { name: "Thuyền buồm", src: boat, motion: "rock" },
    { name: "Lưỡi câu", src: hook, motion: "swing" },
    { name: "Anh đào", src: cherry, motion: "swing" },
    { name: "Boomerang", src: boomerang, motion: "spin" },
    { name: "Người tuyết", src: snowman, motion: "tilt" },
    { name: "Bóng bay", src: balloon, motion: "bob" },
];

export const PLACE_PICTURES = { door, desk, bed };

export const pictureOf = (name: string): Picture => OBJECTS.find((item) => item.name === name) ?? OBJECTS[0];

// Xáo trộn có hạt giống: cùng một lượt chơi luôn cho cùng thứ tự (dễ thử lại, dễ kiểm thử)
export const shuffled = <T,>(items: readonly T[], random: () => number = Math.random): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
