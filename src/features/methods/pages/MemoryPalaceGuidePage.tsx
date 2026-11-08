import { GuidePage } from "../guide/GuidePage";
import { RouteTrial } from "../guide/RouteTrial";
import { DIGIT_SHAPES, PLACE_PICTURES, pictureOf, type Picture } from "../guide/pictures";
import { WOODCUTS } from "../guide/woodcuts";
import { GAME_META } from "@/features/shared-game/registry";
import type { GuideContent } from "../guide/types";
import roomAll from "@/assets/memio/practice/room-all.svg";

const DOOR: Picture = { name: "Cửa phòng", src: PLACE_PICTURES.door, motion: "rock" };

// Chỗ trong phòng to, đồ vật đặt vào nhỏ hơn đè lên một góc
const Place = ({ place, item, label }: { place: string; item: string; label: string }) => (
    <span className="guide-place" role="img" aria-label={label}>
        <img src={place} alt="" />
        <img src={pictureOf(item).src} alt="" className="shape is-live" data-motion={pictureOf(item).motion} />
    </span>
);

const CONTENT: GuideContent = {
    id: "loci",
    tone: "sky",
    crumb: "Căn phòng trí nhớ",
    title: "Căn phòng trí nhớ",
    lead: "Đường đi trong nhà mình thì bạn đã thuộc. Đặt mỗi điều cần nhớ vào một chỗ trên đường ấy, rồi đi lại trong đầu để nhặt chúng lên theo đúng thứ tự.",
    hero: { picture: DOOR, woodcut: WOODCUTS.tower },
    how: {
        title: "Từ danh sách đến lộ trình",
        intro: "Danh sách dài thì khó nhớ, nhưng con đường trong nhà thì bạn không quên. Ba bước dưới đây gắn từng mục của danh sách vào một chỗ trên con đường quen.",
        loose: ["Quả táo", "Ô", "Mèo", "Quả trứng", "Quả bóng", "Bánh"].map(pictureOf),
        ordered: [
            { picture: pictureOf("Quả táo"), label: "Cửa" },
            { picture: pictureOf("Mèo"), label: "Bàn học" },
            { picture: pictureOf("Quả bóng"), label: "Giường" },
        ],
        steps: [
            {
                name: "Chọn lộ trình",
                text: "Chọn vài chỗ quen theo một chiều cố định: cửa, bàn học, giường. Đi thử trong đầu vài lần trước khi đặt đồ vào.",
            },
            {
                name: "Đặt đồ vào chỗ",
                text: "Mỗi chỗ giữ một đồ vật, và đồ phải chạm vào chỗ ấy: quả táo khổng lồ chắn cửa, chú mèo nằm giữa vở trên bàn.",
            },
            {
                name: "Đi lại để nhặt",
                text: "Đi đúng lộ trình, dừng ở từng chỗ và hỏi: ở đây có gì? Chỗ gọi ra đồ vật, còn chiều đi giữ thứ tự của danh sách.",
            },
        ],
    },
    index: {
        title: "Ba chỗ trong phòng",
        hint: "Chọn một chỗ để xem đồ vật được đặt ở đó.",
        items: [
            {
                name: "Cửa phòng",
                art: <Place place={PLACE_PICTURES.door} item="Quả táo" label="Quả táo chắn cửa phòng" />,
                fact: "Quả táo khổng lồ chắn lối, phải đẩy mới vào được. Đồ chạm vào chỗ, nên nhìn cửa là thấy táo.",
            },
            {
                name: "Bàn học",
                art: <Place place={PLACE_PICTURES.desk} item="Mèo" label="Chú mèo nằm trên bàn học" />,
                fact: "Chú mèo nằm giữa quyển vở đang mở: một điểm cụ thể trên bàn, không phải đâu đó gần bàn.",
            },
            {
                name: "Giường",
                art: <Place place={PLACE_PICTURES.bed} item="Quả bóng" label="Quả bóng nảy trên giường" />,
                fact: "Quả bóng nảy liên tục trên gối: chuyển động giữ cho hình không mờ đi.",
            },
            {
                name: "Cả lộ trình",
                art: <img src={roomAll} alt="Căn phòng với quả táo ở cửa, mèo trên bàn học và quả bóng trên giường" className="guide-scene" />,
                fact: "Đi một chiều cửa, bàn, giường là đọc lại danh sách táo, mèo, bóng đúng thứ tự.",
            },
        ],
    },
    trial: {
        title: "Chơi thử",
        intro: "Một lộ trình trong nhà với 3 chỗ. Xem đồ vật được đặt ở từng chỗ, rồi đi lại và chọn đúng đồ. Đúng hết thì lộ trình dài thêm.",
        game: <RouteTrial />,
    },
    history: {
        title: "Ba phòng, ba mươi chỗ",
        text: "Romberch (1520) chia đại sảnh, thư viện và nhà nguyện thành các ô đánh số, mỗi ô giữ sẵn một đồ vật. Người học thuộc các ô theo thứ tự, rồi đặt điều cần nhớ vào đó. Căn nhà của bạn làm được việc tương tự.",
        woodcuts: [WOODCUTS.aula, WOODCUTS.biblioteca, WOODCUTS.capella, WOODCUTS.tower],
    },
    apply: {
        title: "Áp dụng ngay",
        groups: [
            {
                name: "Trong Memio",
                items: [
                    {
                        name: GAME_META.card.label,
                        fact: "Hợp nhất",
                        text: "Một lộ trình dài, mỗi chỗ giữ một hoặc hai lá. Đổi lá thành hình (số trên lá dùng hình của Biến số thành hình) rồi đặt vào chỗ.",
                        note: "26 chỗ, mỗi chỗ 2 lá là đủ cả bộ 52 lá.",
                        to: GAME_META.card.route,
                        art: { src: PLACE_PICTURES.desk, color: GAME_META.card.color },
                    },
                    {
                        name: GAME_META.word.label,
                        fact: "Hợp nhất",
                        text: "Danh sách dài: mỗi từ thành một hình và đặt vào một chỗ. Đi lại lộ trình là đọc lại danh sách đúng thứ tự.",
                        to: GAME_META.word.route,
                        art: { src: PLACE_PICTURES.door, color: GAME_META.word.color },
                    },
                    {
                        name: GAME_META.number.label,
                        fact: "Kết hợp",
                        text: "Dãy số dài: chia thành nhóm 2 đến 3 chữ số, mỗi nhóm thành một cảnh bằng Biến số thành hình, mỗi cảnh đặt ở một chỗ.",
                        to: GAME_META.number.route,
                        art: { src: DIGIT_SHAPES[8].src, color: GAME_META.number.color },
                    },
                    {
                        name: GAME_META.image.label,
                        fact: "Kết hợp",
                        text: "Mỗi bức ảnh đặt vào một chỗ trên lộ trình. Khi xếp lại, đi lộ trình để biết ảnh nào đứng trước.",
                        to: GAME_META.image.route,
                        art: { src: PLACE_PICTURES.bed, color: GAME_META.image.color },
                    },
                ],
            },
            {
                name: "Ngoài đời",
                items: [
                    {
                        name: "Đồ cần mang theo",
                        fact: "trước khi ra khỏi nhà",
                        text: "Chìa khoá treo ở cửa, ví nằm trong chiếc giày ở kệ, điện thoại ngồi trên sofa. Ra đến cửa là đi lại lộ trình một lượt.",
                        art: { src: pictureOf("Quả táo").src, color: "#2e7d32" },
                    },
                    {
                        name: "Dàn ý bài nói",
                        fact: "mỗi phần một chỗ",
                        text: "Đặt từng phần của bài nói vào một chỗ trong lớp học hay phòng họp quen. Nói đến đâu, đi lộ trình đến đó.",
                        art: { src: pictureOf("Cây nến").src, color: "#2e7d32" },
                    },
                    {
                        name: "Từ vựng theo chủ đề",
                        fact: "mỗi phòng một chủ đề",
                        text: "Bếp giữ từ về đồ ăn, phòng tắm giữ từ về sức khoẻ; mỗi chỗ trong phòng giữ một từ.",
                        art: { src: pictureOf("Bánh").src, color: "#2e7d32" },
                    },
                ],
            },
        ],
    },
    close: {
        line: "Giờ thử với cả bộ bài",
        text: "Thẻ bài là nơi lộ trình phát huy nhất: bắt đầu với vài lá, rồi tăng dần khi lộ trình của bạn dài thêm.",
        fact: "Một lộ trình, dùng lại cho mọi danh sách.",
        action: { to: GAME_META.card.route, label: "Chơi Thẻ bài" },
        next: { to: "/methods/story-linking", label: "Mới bắt đầu? Xem Nối thành câu chuyện" },
        motion: "hop",
        picture: pictureOf("Quả bóng"),
    },
};

export const MemoryPalaceGuidePage = () => <GuidePage content={CONTENT} />;

export default MemoryPalaceGuidePage;
