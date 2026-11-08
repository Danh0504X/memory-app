import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Islands from '@/assets/memio/hero-islands.svg';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Mascot } from '@/components/ui/Mascot';
import { BlockState, Panel } from '@/components/ui/Panel';
import { PressableScale } from '@/components/ui/PressableScale';
import { ease, enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { GAME_META } from '@/features/dashboard/constants';
import { StoryTrial } from '@/features/methods/guide/StoryTrial';
import { TONES } from '@/features/methods/guide/GuideScreen';
import { METHODS } from '@/features/methods/methodsData';
import { Chips } from '@/features/shared-game/components/Chips';

// Trang chủ cho khách (bản web: features/home/pages/HomePage), xếp dọc cho điện thoại.
// Người đã đăng nhập thấy màn Hôm nay thay cho trang này.

const ISLANDS = [
    { word: 'câu chuyện', label: 'Câu chuyện' },
    { word: 'con số', label: 'Con số' },
    { word: 'không gian', label: 'Không gian' },
];
const CYCLE_MS = 3200;
const HERO_FACTS = ['Miễn phí', 'Chơi ngay, không cần tài khoản', 'Vài phút mỗi ván'];

const PARENT_POINTS = [
    ['Học cách tạo liên kết', 'Tìm mối liên hệ giữa những điều cần nhớ.'],
    ['Tập tự nhớ lại', 'Thử nhắc lại hoặc sắp xếp thông tin khi gợi ý đã được giấu đi.'],
    ['Tìm cách hợp với mình', 'Thử lại, thay đổi liên kết và nhận ra cách nào giúp mình nhớ rõ hơn.'],
];

// Số liệu lấy từ luật chơi ở backend (config/games.ts): 10 cấp độ mỗi trò, đạt từ 70%, đúng hết mới mở cấp
const PARENT_FACTS = [
    ['6+', 'Hợp nhất với các bé từ 6 tuổi, nhưng người lớn chơi cũng rèn được trí nhớ.'],
    ['10 cấp độ', 'Mỗi trò chơi đi từ dễ đến khó: từ 6 lên 24 hình, từ 5 lên 52 lá bài.'],
    ['15 phút', 'Mỗi ngày là đủ, tương đương 2 đến 3 ván ngắn.'],
    ['70%', 'Nhớ đúng từ 70% là đạt. Đúng hết mới mở cấp tiếp theo.'],
];

const GAME_STEPS = [
    ['Quan sát', 'Làm quen với một dãy hình ngắn.'],
    ['Tạo liên kết', 'Nối các hình thành câu chuyện hoặc đặt chúng vào những vị trí đã học.'],
    ['Nhớ lại', 'Xếp lại dãy hình khi chúng bị xáo trộn và đối chiếu kết quả.'],
];

const FAQ_GROUPS = [
    {
        id: 'parents',
        label: 'Cho bố mẹ',
        items: [
            [
                'Memio dành cho ai?',
                'Memio được làm chủ yếu cho các bé từ 6 tuổi, nhưng ai muốn rèn trí nhớ cũng chơi được, kể cả bố mẹ. Khi mới bắt đầu, con nên chọn ‘Nối thành câu chuyện’ và trò chơi hình ở cấp 1 (6 hình). Khi đã quen, con có thể thử thêm trò chơi lá bài và cách biến số thành hình.',
            ],
            [
                'Mỗi ngày con nên luyện bao lâu?',
                'Khoảng 10–15 phút, tức 2 đến 3 ván. Mỗi ván chỉ vài phút: trò chơi hình cho 1 phút để ghi nhớ, trò chơi lá bài cho 2 phút. Luyện đều mỗi ngày quan trọng hơn luyện lâu một lần.',
            ],
            ['Memio có mất phí không?', 'Hiện tại Memio miễn phí. Con có thể chơi ngay mà không cần tài khoản, và tạo tài khoản cũng không mất phí.'],
            [
                'Memio lưu những thông tin gì của con?',
                'Chỉ tên người dùng, email và mật khẩu (được mã hoá một chiều) để đăng nhập, cùng kết quả các ván chơi để tính tiến độ. Memio không hỏi họ tên thật, ngày sinh hay trường học của con.',
            ],
            [
                'Luyện tập có giúp con học tốt hơn không?',
                'Luyện tập giúp con quen với việc liên tưởng và sắp xếp thông tin có trật tự, nhờ đó việc học thuộc bài nhẹ nhàng hơn. Memio là bài tập rèn thói quen, không thay thế việc học trên lớp.',
            ],
        ],
    },
    {
        id: 'play',
        label: 'Về cách chơi',
        items: [
            [
                'Chưa biết phương pháp nào thì bắt đầu ở đâu?',
                'Hãy bắt đầu bằng ‘Nối thành câu chuyện’: làm quen với ví dụ rồi thử một dãy hình ngắn. Không cần học hết ba phương pháp trước khi chơi.',
            ],
            [
                'Nếu chưa nhớ đúng thì sao?',
                'Chưa nhớ hết là hoàn toàn bình thường. Sau mỗi ván, bạn thấy rõ chỗ mình quên để đổi câu chuyện hoặc hình ảnh, rồi chơi lại chính cấp độ đó.',
            ],
            [
                'Không đăng nhập thì tiến độ có được lưu không?',
                'Có, nhưng chỉ tạm thời: cấp độ đã mở được giữ 24 giờ kể từ ván gần nhất rồi tự xoá. Khi đăng nhập, Memio lưu lâu dài cấp độ, điểm kinh nghiệm, chuỗi ngày luyện tập và kỷ lục của từng trò chơi.',
            ],
        ],
    },
];

export function HomeScreen() {
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Hero />
                <MethodsTeaser />
                <GameIntro />
                <DailyTeaser />
                <Parents />
                <Faq />
                <Closing />
            </ScrollView>
        </SafeAreaView>
    );
}

// "Nhớ bằng câu chuyện / con số / không gian": tự giới thiệu đủ ba đảo đúng một vòng rồi dừng ở đảo đầu
// (nội dung tự chạy không kéo dài mãi); chạm vào một đảo thì dừng vòng và chọn đảo đó
function Hero() {
    const reduceMotion = useReducedMotion();
    const { width } = useWindowDimensions();
    const [active, setActive] = useState(0);
    const paused = useRef(false);

    useEffect(() => {
        if (reduceMotion) return;
        let steps = 0;
        const timer = setInterval(() => {
            if (paused.current) return;
            steps += 1;
            setActive(steps % ISLANDS.length);
            if (steps >= ISLANDS.length) clearInterval(timer);
        }, CYCLE_MS);
        return () => clearInterval(timer);
    }, [reduceMotion]);

    const artWidth = width - spacing.lg * 2;

    return (
        <Animated.View entering={enterUp(0)} style={styles.hero}>
            <AppText style={styles.heroTitle} accessibilityRole="header">Nhớ bằng</AppText>
            <Animated.View key={active} entering={FadeInDown.duration(420).easing(ease.enter)}>
                <AppText style={[styles.heroTitle, styles.heroWord]}>{ISLANDS[active].word}</AppText>
            </Animated.View>
            <AppText variant="lead">
                Memio giúp rèn luyện trí nhớ qua trò chơi: nối hình thành câu chuyện, biến số thành hình và đặt đồ vật vào một căn phòng quen thuộc.
            </AppText>
            <Chips
                accessibilityLabel="Ba cách nhớ"
                options={ISLANDS.map((island, index) => ({ value: index, label: island.label }))}
                value={active}
                onChange={(index) => {
                    paused.current = true;
                    setActive(index);
                }}
            />
            <View accessible accessibilityRole="image" accessibilityLabel="Ba hòn đảo: câu chuyện, con số và không gian, nối với nhau bằng một con đường">
                {/* Tỉ lệ ảnh 580×456 */}
                <Islands width={artWidth} height={(artWidth * 456) / 580} />
            </View>
            <Button title="Bắt đầu chơi" onPress={() => router.navigate('/games')} />
            <Button title="Xem ba cách nhớ" variant="secondary" onPress={() => router.navigate('/methods')} />
            <View style={styles.facts}>
                {HERO_FACTS.map((fact) => (
                    <View key={fact} style={styles.fact}>
                        <AppText variant="small" style={styles.factText}>{fact}</AppText>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
}

function MethodsTeaser() {
    return (
        <View style={[styles.chapter, { backgroundColor: colors.mint }]}>
            <AppText variant="title">Ba cách nhớ, ba hòn đảo</AppText>
            <AppText variant="body">Mỗi cách hợp với một kiểu thông tin. Thử ngay cách dễ nhất, rồi khám phá hai cách còn lại.</AppText>
            {METHODS.map((method) => (
                <PressableScale key={method.id} onPress={() => router.push(method.guide as Href)} accessibilityRole="button" style={styles.teaserRow}>
                    <View style={[styles.dot, { backgroundColor: TONES[method.tone] }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText style={styles.strong}>{method.name}</AppText>
                        <AppText variant="small">{method.summary}</AppText>
                    </View>
                    <ChevronRight color={colors.inkSoft} size={20} />
                </PressableScale>
            ))}
            <Button title="Xem cả ba cách" onPress={() => router.navigate('/methods')} />
        </View>
    );
}

function GameIntro() {
    return (
        <View style={styles.section}>
            <AppText variant="title">Thử ngay với một dãy hình</AppText>
            {GAME_STEPS.map(([title, text], i) => (
                <View key={title} style={styles.step}>
                    <View style={styles.stepNo}>
                        <AppText style={styles.stepNoText}>{i + 1}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText style={styles.strong}>{title}</AppText>
                        <AppText variant="small">{text}</AppText>
                    </View>
                </View>
            ))}
            <StoryTrial />
        </View>
    );
}

// Mời tham gia thử thách ngày; số liệu hôm nay lấy từ API, chưa tải được thì chỉ hiện lời mời
function DailyTeaser() {
    const daily = useDailyChallenge();
    return (
        <View style={[styles.chapter, { backgroundColor: colors.sky }]}>
            <AppText variant="title">Mỗi ngày một thử thách mới</AppText>
            <AppText variant="body">
                Cả cộng đồng Memio cùng nhớ một đề. Mỗi người một lượt, ai nhớ đúng nhiều và nhanh hơn sẽ đứng đầu bảng xếp hạng.
            </AppText>
            <BlockState request={daily.state} onRetry={daily.reload}>
                {({ challenge, leaderboard }) => {
                    const meta = GAME_META[challenge.gameName];
                    return (
                        <View style={{ gap: spacing.sm }}>
                            <AppText variant="body">
                                Hôm nay: <AppText style={styles.strong}>{meta.label} · {challenge.totalItems} {meta.unit}</AppText> · {challenge.players} người đã chơi
                            </AppText>
                            {leaderboard.slice(0, 3).map((entry) => (
                                <View key={entry.rank} style={styles.topRow}>
                                    <AppText style={styles.rank}>{entry.rank}</AppText>
                                    <AppText style={[styles.strong, { flex: 1 }]} numberOfLines={1}>{entry.username}</AppText>
                                    <AppText variant="small">{entry.correctItems}/{entry.totalItems}</AppText>
                                </View>
                            ))}
                        </View>
                    );
                }}
            </BlockState>
            <Button title="Tham gia thử thách" onPress={() => router.push('/login')} />
            <Button title="Xem thử thách hôm nay" variant="secondary" onPress={() => router.navigate('/daily')} />
        </View>
    );
}

function Parents() {
    return (
        <View style={styles.section}>
            <AppText variant="title">Con sẽ luyện những gì?</AppText>
            <AppText variant="body">
                Memio hướng dẫn con làm quen với các cách ghi nhớ qua hình ảnh, câu chuyện và vị trí. Sau mỗi ví dụ, con được tự thử một nhiệm vụ nhỏ.
            </AppText>
            {PARENT_POINTS.map(([title, text]) => (
                <View key={title} style={{ gap: 2 }}>
                    <AppText style={styles.strong}>{title}</AppText>
                    <AppText variant="small">{text}</AppText>
                </View>
            ))}
            <Panel title="Vài con số bố mẹ cần biết">
                {PARENT_FACTS.map(([figure, meaning]) => (
                    <View key={figure} style={styles.figureRow}>
                        <AppText style={styles.figure}>{figure}</AppText>
                        <AppText variant="small" style={{ flex: 1 }}>{meaning}</AppText>
                    </View>
                ))}
            </Panel>
            <View style={styles.ask}>
                <Mascot size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                    <AppText style={styles.quote}>“Con đã nghĩ ra câu chuyện gì để nhớ những hình này?”</AppText>
                    <AppText variant="small">
                        Một câu hỏi nhỏ để bắt đầu: bố mẹ nghe con giải thích, cùng tạo một liên kết vui rồi để con tự thử lại.
                    </AppText>
                </View>
            </View>
        </View>
    );
}

// Mọi câu trả lời hiện sẵn (taste skill: không accordion); chọn nhóm câu hỏi bằng chip
function Faq() {
    const [group, setGroup] = useState(0);
    return (
        <View style={styles.section}>
            <AppText variant="title">Bạn có thể đang thắc mắc</AppText>
            <Chips accessibilityLabel="Nhóm câu hỏi" options={FAQ_GROUPS.map((item, index) => ({ value: index, label: item.label }))} value={group} onChange={setGroup} />
            <Animated.View key={group} entering={FadeInDown.duration(240).easing(ease.ui)} style={{ gap: spacing.md }}>
                {FAQ_GROUPS[group].items.map(([question, answer]) => (
                    <View key={question} style={styles.faqItem}>
                        <AppText style={styles.strong}>{question}</AppText>
                        <AppText variant="small">{answer}</AppText>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
}

function Closing() {
    return (
        <View style={[styles.chapter, styles.ticket]}>
            <Mascot />
            <AppText variant="title">Bắt đầu bằng một câu chuyện</AppText>
            <AppText variant="body">Khám phá cách ghi nhớ đầu tiên và thử sức với những lá bài.</AppText>
            <Button title="Bắt đầu với Memio" onPress={() => router.navigate('/games')} />
            <Button title="Đã có tài khoản? Đăng nhập" variant="secondary" onPress={() => router.push('/login')} />
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl * 2 },
    hero: { gap: spacing.md },
    heroTitle: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: colors.ink },
    heroWord: { color: colors.brand },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    fact: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.mint },
    factText: { fontFamily: fonts.semibold, color: colors.brandDeep },
    chapter: { gap: spacing.md, padding: spacing.lg, borderRadius: radius * 1.5 },
    section: { gap: spacing.md },
    teaserRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white },
    dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: colors.brandDeep },
    strong: { fontFamily: fonts.bold, color: colors.ink },
    step: { flexDirection: 'row', gap: spacing.sm },
    stepNo: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
    stepNoText: { fontFamily: fonts.extrabold, fontSize: 14 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.white },
    rank: { fontFamily: fonts.extrabold, width: 20, textAlign: 'center' },
    figureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
    figure: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.brand, minWidth: 104 },
    ask: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: '#fff8e1' },
    quote: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: colors.ink },
    faqItem: { gap: 4, paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: colors.step },
    ticket: { backgroundColor: colors.sun },
});
