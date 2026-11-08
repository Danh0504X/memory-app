// Bản khắc gỗ trong "Congestorium artificiose memorie" của Johann Romberch (in lần đầu năm 1520), sách dạy nghệ thuật ghi nhớ.
// Ảnh chụp của Wellcome Collection, giấy phép CC BY 4.0, lấy qua Wikimedia Commons; đã cắt và chuyển sang mực đen nền trắng.

import ladder from "@/assets/memio/history/letter-a-ladder.jpg";
import lute from "@/assets/memio/history/letter-b-lute.jpg";
import horn from "@/assets/memio/history/letter-c-horn.jpg";
import fish from "@/assets/memio/history/letter-i-fish.jpg";
import tower from "@/assets/memio/history/letter-i-tower.jpg";
import snake from "@/assets/memio/history/letter-s-snake.jpg";
import dragon from "@/assets/memio/history/letter-d-dragon.jpg";
import head from "@/assets/memio/history/imagination-head.jpg";
import birds from "@/assets/memio/history/bird-alphabet.jpg";
import aula from "@/assets/memio/history/loci-aula.jpg";
import biblioteca from "@/assets/memio/history/loci-biblioteca.jpg";
import capella from "@/assets/memio/history/loci-capella.jpg";

export interface Woodcut {
    src: string;
    alt: string;
    caption: string;
    source: string;   // Trang ảnh gốc trên Wikimedia Commons
}

const commons = (id: string) =>
    `https://commons.wikimedia.org/wiki/File:Johann_Romberch,_Congestorium_artificiose..._Wellcome_${id}.jpg`;

export const WOODCUTS = {
    ladder: { src: ladder, alt: "Chữ A vẽ cạnh một cái thang dựng nghiêng", caption: "A là cái thang dựng nghiêng", source: commons("L0032261") },
    lute: { src: lute, alt: "Chữ B vẽ cạnh cây đàn luýt bụng tròn", caption: "B là cây đàn luýt bụng tròn", source: commons("L0032261") },
    horn: { src: horn, alt: "Chữ C nằm trong một chiếc tù và cong", caption: "C là chiếc tù và cong", source: commons("L0032261") },
    fish: { src: fish, alt: "Chữ I vẽ cạnh một con cá dựng đứng", caption: "I là con cá dựng đứng", source: commons("L0032263") },
    snake: { src: snake, alt: "Chữ S vẽ cạnh một con rắn cuộn trên tảng đá", caption: "S là con rắn đang cuộn", source: commons("L0032266") },
    dragon: { src: dragon, alt: "Chữ D vẽ dưới đầu một con rồng há miệng", caption: "D là đầu rồng há miệng", source: commons("L0032262") },
    tower: { src: tower, alt: "Chữ I vẽ cạnh một ngọn tháp có cửa vòm", caption: "I là ngọn tháp, cửa ở chân tháp", source: commons("L0032264") },
    head: {
        src: head,
        alt: "Đầu người nhìn nghiêng, chia vùng: tưởng tượng ở trán, trí nhớ ở sau gáy",
        caption: "Tưởng tượng ở trước, trí nhớ ở sau",
        source: commons("L0032259"),
    },
    birds: { src: birds, alt: "Bảng chữ cái vẽ bằng các loài chim và thú", caption: "Mỗi chữ cái là một con vật đang làm gì đó", source: commons("L0032269") },
    aula: { src: aula, alt: "Đại sảnh chia thành các ô đánh số 1 đến 5, mỗi ô một đồ vật", caption: "Đại sảnh: chỗ 1 đến 5", source: commons("L0032260") },
    biblioteca: { src: biblioteca, alt: "Thư viện chia thành các ô đánh số 11 đến 15", caption: "Thư viện: chỗ 11 đến 15", source: commons("L0032260") },
    capella: { src: capella, alt: "Nhà nguyện chia thành các ô đánh số 21 đến 25", caption: "Nhà nguyện: chỗ 21 đến 25", source: commons("L0032260") },
} satisfies Record<string, Woodcut>;

export const WOODCUT_CREDIT =
    "Bản khắc: Johann Romberch, Congestorium artificiose memorie (1520). Ảnh: Wellcome Collection, CC BY 4.0, qua Wikimedia Commons.";
