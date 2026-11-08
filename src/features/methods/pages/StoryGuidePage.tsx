import { GuidePage } from "../guide/GuidePage";
import { StoryTrial } from "../guide/StoryTrial";
import { pictureOf } from "../guide/pictures";
import { WOODCUTS } from "../guide/woodcuts";
import { GAME_META } from "@/features/shared-game/registry";
import type { GuideContent } from "../guide/types";
import catUmbrella from "@/assets/memio/guides/story-cat-umbrella.svg";
import umbrellaCake from "@/assets/memio/guides/story-umbrella-cake.svg";
import cakeBike from "@/assets/memio/guides/story-cake-bike.svg";

const FOUR = ["Mèo", "Ô", "Bánh", "Xe đạp"].map(pictureOf);

const CONTENT: GuideContent = {
    id: "story",
    tone: "mint",
    crumb: "Nối thành câu chuyện",
    title: "Nối thành câu chuyện",
    lead: "Một danh sách rời rất dễ lẫn thứ tự. Cho mỗi hình làm gì đó với hình kế tiếp, rồi khi kể lại, câu chuyện kéo cả dãy ra đúng thứ tự.",
    hero: { picture: pictureOf("Mèo"), woodcut: WOODCUTS.snake },
    how: {
        title: "Từ hình rời đến một chuỗi",
        intro: "Một hàng tên thì đọc qua là quên, còn một cảnh có hành động thì đọng lại. Ba bước dưới đây biến các hình rời thành một chuỗi, mỗi mắt xích gọi ra mắt xích sau.",
        loose: ["Quả táo", "Xe đạp", "Mèo", "Quả bóng", "Bánh", "Ô"].map(pictureOf),
        ordered: FOUR.map((picture) => ({ picture, label: picture.name })),
        steps: [
            {
                name: "Gọi tên từng hình",
                text: "Nhìn và gọi tên thành tiếng, đi theo một chiều: mèo, ô, bánh, xe đạp. Chưa nhận ra đủ hình thì chưa vội kể.",
            },
            {
                name: "Cho hình hành động",
                text: "Hình trước làm gì đó với hình sau: mèo giương ô, ô hứng chiếc bánh rơi, bánh lăn lên xe đạp. Càng to, càng lạ, càng có chuyển động thì càng dễ nhớ.",
            },
            {
                name: "Kể lại",
                text: "Che hình đi, bắt đầu từ hình đầu tiên và để từng hành động dẫn tới hình kế. Quên ở đâu thì chỉ làm lại đúng đoạn đó.",
            },
        ],
    },
    index: {
        title: "Từng mắt xích",
        hint: "Chọn một đoạn để xem cảnh và vì sao nó dễ nhớ.",
        items: [
            {
                name: "Bốn hình rời",
                art: (
                    <span className="guide-four">
                        {FOUR.map((picture) => (
                            <img key={picture.name} src={picture.src} alt={picture.name} className="shape is-live" data-motion={picture.motion} />
                        ))}
                    </span>
                ),
                fact: "Đọc một hàng như thế này rất dễ đảo thứ tự, vì không có gì nối hình này với hình kia.",
            },
            {
                name: "Mèo giương ô",
                art: <img src={catUmbrella} alt="Chú mèo giương chiếc ô" className="guide-scene" />,
                fact: "Hình đầu tiên cần một hành động rõ ràng: đó là chỗ bạn bắt đầu khi kể lại.",
            },
            {
                name: "Ô hứng bánh",
                art: <img src={umbrellaCake} alt="Chiếc ô lật ngược hứng chiếc bánh rơi" className="guide-scene" />,
                fact: "Chiếc bánh rơi từ trên cao xuống: chuyển động làm cảnh khó quên hơn một bức tranh đứng yên.",
            },
            {
                name: "Bánh lăn lên xe đạp",
                art: <img src={cakeBike} alt="Chiếc bánh lăn lên xe đạp" className="guide-scene" />,
                fact: "Chiếc bánh to bằng bánh xe: kích thước khác thường làm cảnh nổi bật giữa những cảnh khác.",
            },
        ],
    },
    trial: {
        title: "Chơi thử",
        intro: "Các hình ngẫu nhiên hiện theo một hàng. Kể một câu chuyện nối chúng, rồi xếp lại sau khi bị xáo trộn. Bắt đầu với 4 hình.",
        game: <StoryTrial />,
    },
    history: {
        title: "Hình phải sống động",
        text: "Sách dạy ghi nhớ của Johann Romberch (1520) vẽ chữ cái thành con vật đang làm gì đó: rắn đang cuộn, rồng há miệng, chim nghiêng đầu. Người xưa đã biết điều mà câu chuyện của bạn cần: hình có hành động thì bám lâu hơn hình đứng yên.",
        woodcuts: [WOODCUTS.head, WOODCUTS.snake, WOODCUTS.dragon, WOODCUTS.birds],
    },
    apply: {
        title: "Áp dụng ngay",
        groups: [
            {
                name: "Trong Memio",
                items: [
                    {
                        name: GAME_META.word.label,
                        fact: "Hợp nhất",
                        text: "Đổi mỗi từ thành một hình, rồi nối các hình thành câu chuyện theo đúng thứ tự của danh sách.",
                        note: "Từ khó hình dung như “gió mùa”: chọn một hình đại diện, ví dụ chiếc ô bị gió lật.",
                        to: GAME_META.word.route,
                        art: { src: pictureOf("Ô").src, color: GAME_META.word.color },
                    },
                    {
                        name: GAME_META.image.label,
                        fact: "Hợp nhất",
                        text: "Các bức ảnh đã là hình sẵn: chỉ cần nối ảnh trước với ảnh sau bằng một hành động, rồi xếp lại theo câu chuyện.",
                        to: GAME_META.image.route,
                        art: { src: pictureOf("Bánh").src, color: GAME_META.image.color },
                    },
                    {
                        name: GAME_META.facename.label,
                        fact: "Kết hợp",
                        text: "Nối tên với một nét nổi bật trên gương mặt bằng một cảnh nhỏ: chị Mai tóc xoăn, một cành mai cài trên lọn tóc.",
                        note: "Tên nước ngoài: tách thành từ quen, như David thành “đá vít”.",
                        to: GAME_META.facename.route,
                        art: { src: pictureOf("Mèo").src, color: GAME_META.facename.color },
                    },
                    {
                        name: GAME_META.card.label,
                        fact: "Kết hợp",
                        text: "Mỗi lá bài là một nhân vật, câu chuyện đi qua các lá theo thứ tự. Dùng thêm Biến số thành hình để có hình cho số trên lá.",
                        to: GAME_META.card.route,
                        art: { src: pictureOf("Xe đạp").src, color: GAME_META.card.color },
                    },
                ],
            },
            {
                name: "Ngoài đời",
                items: [
                    {
                        name: "Danh sách đi chợ",
                        fact: "5 đến 10 món",
                        text: "Trứng, sữa, rau, cá: quả trứng lăn vào hộp sữa, sữa tràn lên bó rau, bó rau quất vào con cá.",
                        art: { src: pictureOf("Quả trứng").src, color: "#2e7d32" },
                    },
                    {
                        name: "Các bước theo thứ tự",
                        fact: "công thức, thủ tục",
                        text: "Mỗi bước của một công thức nấu ăn hay một thủ tục là một hình; câu chuyện giữ các bước đúng thứ tự.",
                        art: { src: pictureOf("Bánh").src, color: "#2e7d32" },
                    },
                    {
                        name: "Ý chính bài thuyết trình",
                        fact: "3 đến 7 ý",
                        text: "Mỗi ý một hình. Khi nói, kể câu chuyện trong đầu để đi hết các ý mà không bỏ sót.",
                        art: { src: pictureOf("Cây nến").src, color: "#2e7d32" },
                    },
                ],
            },
        ],
    },
    close: {
        line: "Giờ thử với từ ngữ",
        text: "Trò Ghi nhớ từ đưa ra một danh sách từ theo thứ tự. Đổi từng từ thành hình và kể đúng kiểu câu chuyện bạn vừa luyện.",
        fact: "Mỗi từ một hình, mỗi đoạn một hành động.",
        action: { to: GAME_META.word.route, label: "Chơi Ghi nhớ từ" },
        next: { to: "/methods/number-shape", label: "Cần nhớ con số? Xem Biến số thành hình" },
        motion: "swing",
        picture: pictureOf("Ô"),
    },
};

export const StoryGuidePage = () => <GuidePage content={CONTENT} />;

export default StoryGuidePage;
