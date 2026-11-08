import type { FC } from 'react';
import { StyleSheet, View } from 'react-native';
import { LiveShape } from '@/components/ui/LiveShape';
import type { SvgProps } from 'react-native-svg';
import roomAll from '@/assets/memio/practice/room-all.svg';
import cakeBike from '@/assets/memio/guides/story-cake-bike.svg';
import catUmbrella from '@/assets/memio/guides/story-cat-umbrella.svg';
import umbrellaCake from '@/assets/memio/guides/story-umbrella-cake.svg';
import { GAME_META } from '@/features/shared-game/registry';
import type { MethodId } from '../methodsData';
import { DIGIT_SHAPES, PLACE_PICTURES, pictureOf, type Picture } from './pictures';
import { NumberTrial } from './NumberTrial';
import { RouteTrial } from './RouteTrial';
import { StoryTrial } from './StoryTrial';
import type { GuideContent } from './types';
import { WOODCUTS } from './woodcuts';

// Nội dung ba trang hướng dẫn, chép từ bản web (StoryGuidePage, NumberShapeGuidePage, MemoryPalaceGuidePage).
// Hình minh hoạ vẽ bằng component SVG thay cho <img>.

const ART_WIDTH = 260;

// Cảnh nằm ngang (ảnh rộng), giữ đúng tỉ lệ của file SVG
function Scene({ art: Art, ratio, label }: { art: FC<SvgProps>; ratio: number; label: string }) {
    return (
        <View accessible accessibilityRole="image" accessibilityLabel={label}>
            <Art width={ART_WIDTH} height={ART_WIDTH * ratio} />
        </View>
    );
}

function Shapes({ pictures }: { pictures: Picture[] }) {
    return (
        <View style={styles.shapes} accessible accessibilityLabel={pictures.map((picture) => picture.name).join(', ')}>
            {pictures.map((picture) => <LiveShape key={picture.name} art={picture.src} motion={picture.motion} size={56} />)}
        </View>
    );
}

function Big({ picture }: { picture: Picture }) {
    return <LiveShape art={picture.src} motion={picture.motion} size={120} label={picture.name} tappable />;
}

// Chỗ trong phòng to, đồ vật đặt vào nhỏ hơn đè lên một góc
function Place({ place: PlaceArt, item, label }: { place: FC<SvgProps>; item: string; label: string }) {
    const Item = pictureOf(item).src;
    return (
        <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.place}>
            <PlaceArt width={110} height={130} />
            <View style={styles.placeItem}>
                <Item width={64} height={64} />
            </View>
        </View>
    );
}

const FOUR = ['Mèo', 'Ô', 'Bánh', 'Xe đạp'].map(pictureOf);
const shape = (digit: number) => DIGIT_SHAPES[digit];

const STORY: GuideContent = {
    id: 'story',
    tone: 'mint',
    crumb: 'Nối thành câu chuyện',
    title: 'Nối thành câu chuyện',
    lead: 'Một danh sách rời rất dễ lẫn thứ tự. Cho mỗi hình làm gì đó với hình kế tiếp, rồi khi kể lại, câu chuyện kéo cả dãy ra đúng thứ tự.',
    hero: { picture: pictureOf('Mèo'), woodcut: WOODCUTS.snake },
    how: {
        title: 'Từ hình rời đến một chuỗi',
        intro: 'Một hàng tên thì đọc qua là quên, còn một cảnh có hành động thì đọng lại. Ba bước dưới đây biến các hình rời thành một chuỗi, mỗi mắt xích gọi ra mắt xích sau.',
        loose: ['Quả táo', 'Xe đạp', 'Mèo', 'Quả bóng', 'Bánh', 'Ô'].map(pictureOf),
        ordered: FOUR.map((picture) => ({ picture, label: picture.name })),
        steps: [
            { name: 'Gọi tên từng hình', text: 'Nhìn và gọi tên thành tiếng, đi theo một chiều: mèo, ô, bánh, xe đạp. Chưa nhận ra đủ hình thì chưa vội kể.' },
            {
                name: 'Cho hình hành động',
                text: 'Hình trước làm gì đó với hình sau: mèo giương ô, ô hứng chiếc bánh rơi, bánh lăn lên xe đạp. Càng to, càng lạ, càng có chuyển động thì càng dễ nhớ.',
            },
            { name: 'Kể lại', text: 'Che hình đi, bắt đầu từ hình đầu tiên và để từng hành động dẫn tới hình kế. Quên ở đâu thì chỉ làm lại đúng đoạn đó.' },
        ],
    },
    index: {
        title: 'Từng mắt xích',
        hint: 'Chọn một đoạn để xem cảnh và vì sao nó dễ nhớ.',
        items: [
            { name: 'Bốn hình rời', art: <Shapes pictures={FOUR} />, fact: 'Đọc một hàng như thế này rất dễ đảo thứ tự, vì không có gì nối hình này với hình kia.' },
            {
                name: 'Mèo giương ô',
                art: <Scene art={catUmbrella} ratio={120 / 400} label="Chú mèo giương chiếc ô" />,
                fact: 'Hình đầu tiên cần một hành động rõ ràng: đó là chỗ bạn bắt đầu khi kể lại.',
            },
            {
                name: 'Ô hứng bánh',
                art: <Scene art={umbrellaCake} ratio={120 / 400} label="Chiếc ô lật ngược hứng chiếc bánh rơi" />,
                fact: 'Chiếc bánh rơi từ trên cao xuống: chuyển động làm cảnh khó quên hơn một bức tranh đứng yên.',
            },
            {
                name: 'Bánh lăn lên xe đạp',
                art: <Scene art={cakeBike} ratio={120 / 400} label="Chiếc bánh lăn lên xe đạp" />,
                fact: 'Chiếc bánh to bằng bánh xe: kích thước khác thường làm cảnh nổi bật giữa những cảnh khác.',
            },
        ],
    },
    trial: {
        title: 'Chơi thử',
        intro: 'Các hình ngẫu nhiên hiện theo một hàng. Kể một câu chuyện nối chúng, rồi xếp lại sau khi bị xáo trộn. Bắt đầu với 4 hình.',
        game: <StoryTrial />,
    },
    history: {
        title: 'Hình phải sống động',
        text: 'Sách dạy ghi nhớ của Johann Romberch (1520) vẽ chữ cái thành con vật đang làm gì đó: rắn đang cuộn, rồng há miệng, chim nghiêng đầu. Người xưa đã biết điều mà câu chuyện của bạn cần: hình có hành động thì bám lâu hơn hình đứng yên.',
        woodcuts: [WOODCUTS.head, WOODCUTS.snake, WOODCUTS.dragon, WOODCUTS.birds],
    },
    apply: {
        title: 'Áp dụng ngay',
        groups: [
            {
                name: 'Trong Memio',
                items: [
                    {
                        name: GAME_META.word.label,
                        fact: 'Hợp nhất',
                        text: 'Đổi mỗi từ thành một hình, rồi nối các hình thành câu chuyện theo đúng thứ tự của danh sách.',
                        note: 'Từ khó hình dung như “gió mùa”: chọn một hình đại diện, ví dụ chiếc ô bị gió lật.',
                        to: GAME_META.word.route,
                        art: { src: pictureOf('Ô').src, color: GAME_META.word.color },
                    },
                    {
                        name: GAME_META.image.label,
                        fact: 'Hợp nhất',
                        text: 'Các bức ảnh đã là hình sẵn: chỉ cần nối ảnh trước với ảnh sau bằng một hành động, rồi xếp lại theo câu chuyện.',
                        to: GAME_META.image.route,
                        art: { src: pictureOf('Bánh').src, color: GAME_META.image.color },
                    },
                    {
                        name: GAME_META.facename.label,
                        fact: 'Kết hợp',
                        text: 'Nối tên với một nét nổi bật trên gương mặt bằng một cảnh nhỏ: chị Mai tóc xoăn, một cành mai cài trên lọn tóc.',
                        note: 'Tên nước ngoài: tách thành từ quen, như David thành “đá vít”.',
                        to: GAME_META.facename.route,
                        art: { src: pictureOf('Mèo').src, color: GAME_META.facename.color },
                    },
                    {
                        name: GAME_META.card.label,
                        fact: 'Kết hợp',
                        text: 'Mỗi lá bài là một nhân vật, câu chuyện đi qua các lá theo thứ tự. Dùng thêm Biến số thành hình để có hình cho số trên lá.',
                        to: GAME_META.card.route,
                        art: { src: pictureOf('Xe đạp').src, color: GAME_META.card.color },
                    },
                ],
            },
            {
                name: 'Ngoài đời',
                items: [
                    {
                        name: 'Danh sách đi chợ',
                        fact: '5 đến 10 món',
                        text: 'Trứng, sữa, rau, cá: quả trứng lăn vào hộp sữa, sữa tràn lên bó rau, bó rau quất vào con cá.',
                        art: { src: pictureOf('Quả trứng').src, color: '#2e7d32' },
                    },
                    {
                        name: 'Các bước theo thứ tự',
                        fact: 'công thức, thủ tục',
                        text: 'Mỗi bước của một công thức nấu ăn hay một thủ tục là một hình; câu chuyện giữ các bước đúng thứ tự.',
                        art: { src: pictureOf('Bánh').src, color: '#2e7d32' },
                    },
                    {
                        name: 'Ý chính bài thuyết trình',
                        fact: '3 đến 7 ý',
                        text: 'Mỗi ý một hình. Khi nói, kể câu chuyện trong đầu để đi hết các ý mà không bỏ sót.',
                        art: { src: pictureOf('Cây nến').src, color: '#2e7d32' },
                    },
                ],
            },
        ],
    },
    close: {
        line: 'Giờ thử với từ ngữ',
        text: 'Trò Ghi nhớ từ đưa ra một danh sách từ theo thứ tự. Đổi từng từ thành hình và kể đúng kiểu câu chuyện bạn vừa luyện.',
        fact: 'Mỗi từ một hình, mỗi đoạn một hành động.',
        action: { to: GAME_META.word.route, label: 'Chơi Ghi nhớ từ' },
        next: { to: '/methods/number-shape', label: 'Cần nhớ con số? Xem Biến số thành hình' },
        motion: 'swing',
        picture: pictureOf('Ô'),
    },
};

const NUMBERS: GuideContent = {
    id: 'numbers',
    tone: 'sun',
    crumb: 'Biến số thành hình',
    title: 'Biến số thành hình',
    lead: 'Số 2 cong như cổ thiên nga, số 8 là người tuyết. Đổi mỗi chữ số thành một hình quen, nối các hình thành một cảnh, và cả dãy số được nhớ đúng thứ tự.',
    hero: { picture: shape(2), woodcut: WOODCUTS.ladder },
    how: {
        title: 'Từ số rời đến một cảnh',
        intro: 'Chữ số trông giống nhau và không gợi gì, nên dễ trôi. Hình thì có dáng và có hành động. Ba bước dưới đây biến một dãy số rời thành một cảnh nhỏ, rồi đổi ngược cảnh ấy về số.',
        loose: [7, 3, 9, 5, 6, 4].map(shape),
        ordered: [2, 0, 1, 8].map((digit) => ({ picture: shape(digit), label: String(digit) })),
        steps: [
            { name: 'Thuộc mười hình', text: 'Học hình của 0 đến 9 một lần và giữ cố định. Thấy số 2 là nghĩ ngay đến thiên nga, không phải chọn giữa nhiều hình.' },
            {
                name: 'Nối thành cảnh',
                text: 'Đổi từng số theo thứ tự và cho hình trước làm gì đó với hình sau: thiên nga cõng quả trứng, quả trứng lăn vào cây nến, nến làm chảy người tuyết.',
            },
            { name: 'Đổi về số', text: 'Khi cần, lần theo cảnh từ đầu đến cuối và đọc từng hình thành chữ số: thiên nga, trứng, nến, người tuyết là 2018.' },
        ],
    },
    index: {
        title: 'Mười hình',
        hint: 'Chọn một số để xem hình của nó và vì sao hình ấy hợp với dáng số.',
        items: DIGIT_SHAPES.map((item) => ({ name: `${item.digit} ${item.name.toLowerCase()}`, art: <Big picture={item} />, fact: item.why })),
    },
    trial: {
        title: 'Chơi thử',
        intro: 'Một dãy số ngẫu nhiên hiện kèm hình của từng chữ số. Nhìn, nối thành cảnh, rồi gõ lại. Bắt đầu với 4 số; đúng hết thì thử dãy dài hơn.',
        game: <NumberTrial />,
    },
    history: {
        title: 'Mẹo này đã 500 tuổi',
        text: 'Năm 1520, tu sĩ Johann Romberch in một cuốn sách dạy cách ghi nhớ. Trong đó mỗi chữ cái được vẽ thành một đồ vật có cùng dáng: A là cái thang, B là cây đàn luýt. Memio làm đúng điều ấy với mười chữ số.',
        woodcuts: [WOODCUTS.ladder, WOODCUTS.lute, WOODCUTS.horn, WOODCUTS.fish],
    },
    apply: {
        title: 'Áp dụng ngay',
        groups: [
            {
                name: 'Trong Memio',
                items: [
                    {
                        name: GAME_META.number.label,
                        fact: 'Hợp nhất',
                        text: 'Trong lúc dãy số hiện ra, đổi từng chữ số thành hình và nối thành cảnh. Lúc gõ lại, lần theo cảnh để đọc ra số.',
                        note: 'Đặt nhóm chữ số 2 2 hoặc 3 2 trong Tùy chọn: mỗi nhóm thành một cảnh riêng.',
                        to: GAME_META.number.route,
                        art: { src: shape(2).src, color: GAME_META.number.color },
                    },
                    {
                        name: GAME_META.card.label,
                        fact: 'Kết hợp',
                        text: 'Số trên lá bài cũng là chữ số: lá 7 là boomerang. Cho chất của lá vào cảnh để phân biệt bốn lá cùng số; với A, J, Q, K hãy chọn thêm bốn hình riêng.',
                        note: '7 Cơ: chiếc boomerang cắm vào một trái tim.',
                        to: GAME_META.card.route,
                        art: { src: shape(7).src, color: GAME_META.card.color },
                    },
                ],
            },
            {
                name: 'Ngoài đời',
                items: [
                    {
                        name: 'Số điện thoại',
                        fact: '10 chữ số',
                        text: 'Chia theo cách đọc quen, 4 số rồi 3 số rồi 3 số, mỗi nhóm là một cảnh nhỏ.',
                        note: '0912: quả trứng buộc vào bóng bay, bóng bay kéo cây nến, nến soi con thiên nga.',
                        art: { src: shape(9).src, color: '#2e7d32' },
                    },
                    {
                        name: 'Mã PIN, mật mã',
                        fact: '4 đến 6 chữ số',
                        text: 'Một cảnh cho cả mã, đặt ở nơi bạn hay dùng mã ấy: trước cửa nhà, ở quầy ATM, trên màn hình điện thoại.',
                        art: { src: shape(5).src, color: '#2e7d32' },
                    },
                    {
                        name: 'Ngày tháng',
                        fact: 'ngày và tháng',
                        text: 'Ngày sinh, ngày hẹn: 20/08 là thiên nga, hai quả trứng, người tuyết. Thêm một hình cho sự kiện, như chiếc bánh cho sinh nhật.',
                        art: { src: shape(0).src, color: '#2e7d32' },
                    },
                    {
                        name: 'Số phòng, số nhà',
                        fact: '3 đến 4 chữ số',
                        text: 'Gắn cảnh với chính nơi ấy: phòng 304 là con bướm đậu trên quả trứng đang trôi trên cánh buồm, ngay trước cửa phòng.',
                        art: { src: shape(4).src, color: '#2e7d32' },
                    },
                ],
            },
        ],
    },
    close: {
        line: 'Giờ thử dãy dài hơn',
        text: 'Trò Ghi nhớ số mở dần từng cấp, mỗi cấp dãy dài thêm. Dùng đúng mười hình bạn vừa học, không cần hình mới.',
        fact: 'Chơi được ngay, không cần tài khoản.',
        action: { to: GAME_META.number.route, label: 'Chơi Ghi nhớ số' },
        next: { to: '/methods/memory-palace', label: 'Dãy quá dài? Xem Căn phòng trí nhớ' },
        motion: 'tilt',
        picture: shape(8),
    },
};

const DOOR: Picture = { name: 'Cửa phòng', src: PLACE_PICTURES.door, motion: 'rock' };

const LOCI: GuideContent = {
    id: 'loci',
    tone: 'sky',
    crumb: 'Căn phòng trí nhớ',
    title: 'Căn phòng trí nhớ',
    lead: 'Đường đi trong nhà mình thì bạn đã thuộc. Đặt mỗi điều cần nhớ vào một chỗ trên đường ấy, rồi đi lại trong đầu để nhặt chúng lên theo đúng thứ tự.',
    hero: { picture: DOOR, woodcut: WOODCUTS.tower },
    how: {
        title: 'Từ danh sách đến lộ trình',
        intro: 'Danh sách dài thì khó nhớ, nhưng con đường trong nhà thì bạn không quên. Ba bước dưới đây gắn từng mục của danh sách vào một chỗ trên con đường quen.',
        loose: ['Quả táo', 'Ô', 'Mèo', 'Quả trứng', 'Quả bóng', 'Bánh'].map(pictureOf),
        ordered: [
            { picture: pictureOf('Quả táo'), label: 'Cửa' },
            { picture: pictureOf('Mèo'), label: 'Bàn học' },
            { picture: pictureOf('Quả bóng'), label: 'Giường' },
        ],
        steps: [
            { name: 'Chọn lộ trình', text: 'Chọn vài chỗ quen theo một chiều cố định: cửa, bàn học, giường. Đi thử trong đầu vài lần trước khi đặt đồ vào.' },
            { name: 'Đặt đồ vào chỗ', text: 'Mỗi chỗ giữ một đồ vật, và đồ phải chạm vào chỗ ấy: quả táo khổng lồ chắn cửa, chú mèo nằm giữa vở trên bàn.' },
            { name: 'Đi lại để nhặt', text: 'Đi đúng lộ trình, dừng ở từng chỗ và hỏi: ở đây có gì? Chỗ gọi ra đồ vật, còn chiều đi giữ thứ tự của danh sách.' },
        ],
    },
    index: {
        title: 'Ba chỗ trong phòng',
        hint: 'Chọn một chỗ để xem đồ vật được đặt ở đó.',
        items: [
            {
                name: 'Cửa phòng',
                art: <Place place={PLACE_PICTURES.door} item="Quả táo" label="Quả táo chắn cửa phòng" />,
                fact: 'Quả táo khổng lồ chắn lối, phải đẩy mới vào được. Đồ chạm vào chỗ, nên nhìn cửa là thấy táo.',
            },
            {
                name: 'Bàn học',
                art: <Place place={PLACE_PICTURES.desk} item="Mèo" label="Chú mèo nằm trên bàn học" />,
                fact: 'Chú mèo nằm giữa quyển vở đang mở: một điểm cụ thể trên bàn, không phải đâu đó gần bàn.',
            },
            {
                name: 'Giường',
                art: <Place place={PLACE_PICTURES.bed} item="Quả bóng" label="Quả bóng nảy trên giường" />,
                fact: 'Quả bóng nảy liên tục trên gối: chuyển động giữ cho hình không mờ đi.',
            },
            {
                name: 'Cả lộ trình',
                art: <Scene art={roomAll} ratio={300 / 944} label="Căn phòng với quả táo ở cửa, mèo trên bàn học và quả bóng trên giường" />,
                fact: 'Đi một chiều cửa, bàn, giường là đọc lại danh sách táo, mèo, bóng đúng thứ tự.',
            },
        ],
    },
    trial: {
        title: 'Chơi thử',
        intro: 'Một lộ trình trong nhà với 3 chỗ. Xem đồ vật được đặt ở từng chỗ, rồi đi lại và chọn đúng đồ. Đúng hết thì lộ trình dài thêm.',
        game: <RouteTrial />,
    },
    history: {
        title: 'Ba phòng, ba mươi chỗ',
        text: 'Romberch (1520) chia đại sảnh, thư viện và nhà nguyện thành các ô đánh số, mỗi ô giữ sẵn một đồ vật. Người học thuộc các ô theo thứ tự, rồi đặt điều cần nhớ vào đó. Căn nhà của bạn làm được việc tương tự.',
        woodcuts: [WOODCUTS.aula, WOODCUTS.biblioteca, WOODCUTS.capella, WOODCUTS.tower],
    },
    apply: {
        title: 'Áp dụng ngay',
        groups: [
            {
                name: 'Trong Memio',
                items: [
                    {
                        name: GAME_META.card.label,
                        fact: 'Hợp nhất',
                        text: 'Một lộ trình dài, mỗi chỗ giữ một hoặc hai lá. Đổi lá thành hình (số trên lá dùng hình của Biến số thành hình) rồi đặt vào chỗ.',
                        note: '26 chỗ, mỗi chỗ 2 lá là đủ cả bộ 52 lá.',
                        to: GAME_META.card.route,
                        art: { src: PLACE_PICTURES.desk, color: GAME_META.card.color },
                    },
                    {
                        name: GAME_META.word.label,
                        fact: 'Hợp nhất',
                        text: 'Danh sách dài: mỗi từ thành một hình và đặt vào một chỗ. Đi lại lộ trình là đọc lại danh sách đúng thứ tự.',
                        to: GAME_META.word.route,
                        art: { src: PLACE_PICTURES.door, color: GAME_META.word.color },
                    },
                    {
                        name: GAME_META.number.label,
                        fact: 'Kết hợp',
                        text: 'Dãy số dài: chia thành nhóm 2 đến 3 chữ số, mỗi nhóm thành một cảnh bằng Biến số thành hình, mỗi cảnh đặt ở một chỗ.',
                        to: GAME_META.number.route,
                        art: { src: DIGIT_SHAPES[8].src, color: GAME_META.number.color },
                    },
                    {
                        name: GAME_META.image.label,
                        fact: 'Kết hợp',
                        text: 'Mỗi bức ảnh đặt vào một chỗ trên lộ trình. Khi xếp lại, đi lộ trình để biết ảnh nào đứng trước.',
                        to: GAME_META.image.route,
                        art: { src: PLACE_PICTURES.bed, color: GAME_META.image.color },
                    },
                ],
            },
            {
                name: 'Ngoài đời',
                items: [
                    {
                        name: 'Đồ cần mang theo',
                        fact: 'trước khi ra khỏi nhà',
                        text: 'Chìa khoá treo ở cửa, ví nằm trong chiếc giày ở kệ, điện thoại ngồi trên sofa. Ra đến cửa là đi lại lộ trình một lượt.',
                        art: { src: pictureOf('Quả táo').src, color: '#2e7d32' },
                    },
                    {
                        name: 'Dàn ý bài nói',
                        fact: 'mỗi phần một chỗ',
                        text: 'Đặt từng phần của bài nói vào một chỗ trong lớp học hay phòng họp quen. Nói đến đâu, đi lộ trình đến đó.',
                        art: { src: pictureOf('Cây nến').src, color: '#2e7d32' },
                    },
                    {
                        name: 'Từ vựng theo chủ đề',
                        fact: 'mỗi phòng một chủ đề',
                        text: 'Bếp giữ từ về đồ ăn, phòng tắm giữ từ về sức khoẻ; mỗi chỗ trong phòng giữ một từ.',
                        art: { src: pictureOf('Bánh').src, color: '#2e7d32' },
                    },
                ],
            },
        ],
    },
    close: {
        line: 'Giờ thử với cả bộ bài',
        text: 'Thẻ bài là nơi lộ trình phát huy nhất: bắt đầu với vài lá, rồi tăng dần khi lộ trình của bạn dài thêm.',
        fact: 'Một lộ trình, dùng lại cho mọi danh sách.',
        action: { to: GAME_META.card.route, label: 'Chơi Thẻ bài' },
        next: { to: '/methods/story-linking', label: 'Mới bắt đầu? Xem Nối thành câu chuyện' },
        motion: 'hop',
        picture: pictureOf('Quả bóng'),
    },
};

export const GUIDES: Record<MethodId, GuideContent> = { story: STORY, numbers: NUMBERS, loci: LOCI };

// Đường dẫn giống bản web (methodsData.guide), để link chéo giữa các trang vẫn đúng
export const GUIDE_SLUGS: Record<string, MethodId> = {
    'story-linking': 'story',
    'number-shape': 'numbers',
    'memory-palace': 'loci',
};

const styles = StyleSheet.create({
    shapes: { flexDirection: 'row', gap: 8 },
    place: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
    placeItem: { position: 'absolute', right: 0, bottom: 0 },
});
