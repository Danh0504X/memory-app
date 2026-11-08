import { GuidePage } from "../guide/GuidePage";
import { NumberTrial } from "../guide/NumberTrial";
import { DIGIT_SHAPES } from "../guide/pictures";
import { WOODCUTS } from "../guide/woodcuts";
import { GAME_META } from "@/features/shared-game/registry";
import type { GuideContent } from "../guide/types";

const shape = (digit: number) => DIGIT_SHAPES[digit];

const CONTENT: GuideContent = {
    id: "numbers",
    tone: "sun",
    crumb: "Biến số thành hình",
    title: "Biến số thành hình",
    lead: "Số 2 cong như cổ thiên nga, số 8 là người tuyết. Đổi mỗi chữ số thành một hình quen, nối các hình thành một cảnh, và cả dãy số được nhớ đúng thứ tự.",
    hero: { picture: shape(2), woodcut: WOODCUTS.ladder },
    how: {
        title: "Từ số rời đến một cảnh",
        intro: "Chữ số trông giống nhau và không gợi gì, nên dễ trôi. Hình thì có dáng và có hành động. Ba bước dưới đây biến một dãy số rời thành một cảnh nhỏ, rồi đổi ngược cảnh ấy về số.",
        loose: [7, 3, 9, 5, 6, 4].map(shape),
        ordered: [2, 0, 1, 8].map((digit) => ({ picture: shape(digit), label: String(digit) })),
        steps: [
            {
                name: "Thuộc mười hình",
                text: "Học hình của 0 đến 9 một lần và giữ cố định. Thấy số 2 là nghĩ ngay đến thiên nga, không phải chọn giữa nhiều hình.",
            },
            {
                name: "Nối thành cảnh",
                text: "Đổi từng số theo thứ tự và cho hình trước làm gì đó với hình sau: thiên nga cõng quả trứng, quả trứng lăn vào cây nến, nến làm chảy người tuyết.",
            },
            {
                name: "Đổi về số",
                text: "Khi cần, lần theo cảnh từ đầu đến cuối và đọc từng hình thành chữ số: thiên nga, trứng, nến, người tuyết là 2018.",
            },
        ],
    },
    index: {
        title: "Mười hình",
        hint: "Chọn một số để xem hình của nó và vì sao hình ấy hợp với dáng số.",
        items: DIGIT_SHAPES.map((item) => ({
            name: `${item.digit} ${item.name.toLowerCase()}`,
            art: <img src={item.src} alt={item.name} className="shape is-live" data-motion={item.motion} />,
            fact: item.why,
        })),
    },
    trial: {
        title: "Chơi thử",
        intro: "Một dãy số ngẫu nhiên hiện kèm hình của từng chữ số. Nhìn, nối thành cảnh, rồi gõ lại. Bắt đầu với 4 số; đúng hết thì thử dãy dài hơn.",
        game: <NumberTrial />,
    },
    history: {
        title: "Mẹo này đã 500 tuổi",
        text: "Năm 1520, tu sĩ Johann Romberch in một cuốn sách dạy cách ghi nhớ. Trong đó mỗi chữ cái được vẽ thành một đồ vật có cùng dáng: A là cái thang, B là cây đàn luýt. Memio làm đúng điều ấy với mười chữ số.",
        woodcuts: [WOODCUTS.ladder, WOODCUTS.lute, WOODCUTS.horn, WOODCUTS.fish],
    },
    apply: {
        title: "Áp dụng ngay",
        groups: [
            {
                name: "Trong Memio",
                items: [
                    {
                        name: GAME_META.number.label,
                        fact: "Hợp nhất",
                        text: "Trong lúc dãy số hiện ra, đổi từng chữ số thành hình và nối thành cảnh. Lúc gõ lại, lần theo cảnh để đọc ra số.",
                        note: "Bật chia nhóm 2 2 hoặc 3 2 trong ván tự chọn: mỗi nhóm thành một cảnh riêng.",
                        to: GAME_META.number.route,
                        art: { src: shape(2).src, color: GAME_META.number.color },
                    },
                    {
                        name: GAME_META.card.label,
                        fact: "Kết hợp",
                        text: "Số trên lá bài cũng là chữ số: lá 7 là boomerang. Cho chất của lá vào cảnh để phân biệt bốn lá cùng số; với A, J, Q, K hãy chọn thêm bốn hình riêng.",
                        note: "7 Cơ: chiếc boomerang cắm vào một trái tim.",
                        to: GAME_META.card.route,
                        art: { src: shape(7).src, color: GAME_META.card.color },
                    },
                ],
            },
            {
                name: "Ngoài đời",
                items: [
                    {
                        name: "Số điện thoại",
                        fact: "10 chữ số",
                        text: "Chia theo cách đọc quen, 4 số rồi 3 số rồi 3 số, mỗi nhóm là một cảnh nhỏ.",
                        note: "0912: quả trứng buộc vào bóng bay, bóng bay kéo cây nến, nến soi con thiên nga.",
                        art: { src: shape(9).src, color: "#2e7d32" },
                    },
                    {
                        name: "Mã PIN, mật mã",
                        fact: "4 đến 6 chữ số",
                        text: "Một cảnh cho cả mã, đặt ở nơi bạn hay dùng mã ấy: trước cửa nhà, ở quầy ATM, trên màn hình điện thoại.",
                        art: { src: shape(5).src, color: "#2e7d32" },
                    },
                    {
                        name: "Ngày tháng",
                        fact: "ngày và tháng",
                        text: "Ngày sinh, ngày hẹn: 20/08 là thiên nga, hai quả trứng, người tuyết. Thêm một hình cho sự kiện, như chiếc bánh cho sinh nhật.",
                        art: { src: shape(0).src, color: "#2e7d32" },
                    },
                    {
                        name: "Số phòng, số nhà",
                        fact: "3 đến 4 chữ số",
                        text: "Gắn cảnh với chính nơi ấy: phòng 304 là con bướm đậu trên quả trứng đang trôi trên cánh buồm, ngay trước cửa phòng.",
                        art: { src: shape(4).src, color: "#2e7d32" },
                    },
                ],
            },
        ],
    },
    close: {
        line: "Giờ thử dãy dài hơn",
        text: "Trò Ghi nhớ số mở dần từng cấp, mỗi cấp dãy dài thêm. Dùng đúng mười hình bạn vừa học, không cần hình mới.",
        fact: "Chơi được ngay, không cần tài khoản.",
        action: { to: GAME_META.number.route, label: "Chơi Ghi nhớ số" },
        next: { to: "/methods/memory-palace", label: "Dãy quá dài? Xem Căn phòng trí nhớ" },
        motion: "tilt",
        picture: shape(8),
    },
};

export const NumberShapeGuidePage = () => <GuidePage content={CONTENT} />;

export default NumberShapeGuidePage;
