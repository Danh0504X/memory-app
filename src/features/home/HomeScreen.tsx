import { router } from 'expo-router';
import { BookOpen, Trophy } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Islands from '@/assets/memio/hero-islands.svg';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Mascot } from '@/components/ui/Mascot';
import { NavRow } from '@/components/ui/NavRow';
import { Panel } from '@/components/ui/Panel';
import { ease, enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { GAME_IDS, GAME_META } from '@/features/dashboard/constants';
import { StoryTrial } from '@/features/methods/guide/StoryTrial';
import { Chips } from '@/features/shared-game/components/Chips';
import { GameTile } from '@/features/shared-game/components/GameTile';

// Trang chủ cho khách, bản gọn cho điện thoại: chơi ngay trước, giới thiệu sau.
// Người đã đăng nhập thấy màn Hôm nay thay cho trang này.

const WORDS = ['câu chuyện', 'con số', 'không gian'];
const CYCLE_MS = 3200;
const HERO_FACTS = ['Miễn phí', 'Không cần tài khoản', 'Vài phút mỗi ván'];

// Số liệu lấy từ luật chơi ở backend (config/games.ts): 10 cấp độ mỗi trò, đạt từ 70%, đúng hết mới mở cấp
const PARENT_FACTS = [
    { figure: '6+', text: 'tuổi là hợp nhất, người lớn chơi cũng được', tint: colors.mint },
    { figure: '10', text: 'cấp mỗi trò, từ dễ đến khó', tint: colors.sky },
    { figure: '15′', text: 'mỗi ngày là đủ, 2–3 ván ngắn', tint: '#fff3cf' },
    { figure: '70%', text: 'là đạt; đúng hết mới mở cấp mới', tint: '#ffe8f0' },
];

const FAQ_GROUPS = [
    {
        label: 'Cho bố mẹ',
        items: [
            ['Memio dành cho ai?', 'Chủ yếu cho các bé từ 6 tuổi, nhưng ai muốn rèn trí nhớ cũng chơi được. Mới bắt đầu, hãy chọn trò Hình ảnh ở cấp 1 (6 hình) và cách “Nối thành câu chuyện”.'],
            ['Mỗi ngày nên luyện bao lâu?', 'Khoảng 10–15 phút, tức 2 đến 3 ván. Luyện đều mỗi ngày quan trọng hơn luyện lâu một lần.'],
            ['Memio có mất phí không?', 'Hiện tại Memio miễn phí. Có thể chơi ngay mà không cần tài khoản; tạo tài khoản cũng không mất phí.'],
            ['Memio lưu thông tin gì của con?', 'Chỉ tên người dùng, email, mật khẩu (mã hoá một chiều) và kết quả các ván chơi. Memio không hỏi họ tên thật, ngày sinh hay trường học.'],
        ],
    },
    {
        label: 'Về cách chơi',
        items: [
            ['Chưa biết bắt đầu ở đâu?', 'Thử “Nối thành câu chuyện” với dãy hình ngắn ngay trên trang này. Không cần học hết ba cách trước khi chơi.'],
            ['Nếu chưa nhớ đúng thì sao?', 'Hoàn toàn bình thường. Sau mỗi ván bạn thấy rõ chỗ quên để đổi câu chuyện, rồi chơi lại chính cấp đó.'],
            ['Không đăng nhập có lưu tiến độ không?', 'Có, nhưng tạm thời: cấp đã mở giữ 24 giờ kể từ ván gần nhất. Đăng nhập để lưu lâu dài cấp độ, EXP, chuỗi ngày và kỷ lục.'],
        ],
    },
];

export function HomeScreen() {
    const daily = useDailyChallenge();
    const today = daily.state.status === 'ready' ? daily.state.data.challenge : null;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content}>
                <Hero />

                <Animated.View entering={enterUp(2)} style={styles.section}>
                    <AppText style={styles.sectionTitle}>Chọn một trò</AppText>
                    <View style={styles.grid}>
                        {GAME_IDS.map((id) => (
                            <GameTile key={id} game={id} />
                        ))}
                    </View>
                </Animated.View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>Thử trong 1 phút</AppText>
                    <Panel>
                        <AppText variant="body">Nhìn một hàng hình, nối chúng thành câu chuyện, rồi xếp lại sau khi bị xáo.</AppText>
                        <StoryTrial />
                    </Panel>
                </View>

                <View style={styles.section}>
                    <NavRow
                        icon={<Trophy color={colors.sunDeep} size={24} />}
                        tint="#fff3cf"
                        title="Thử thách hôm nay"
                        subtitle={
                            today
                                ? `${GAME_META[today.gameName].label} · ${today.totalItems} ${GAME_META[today.gameName].unit} · ${today.players} người đã chơi`
                                : 'Cả cộng đồng cùng nhớ một đề mỗi ngày'
                        }
                        onPress={() => router.navigate('/daily')}
                    />
                    <NavRow
                        icon={<BookOpen color={colors.brand} size={24} />}
                        tint={colors.mint}
                        title="Ba cách để nhớ"
                        subtitle="Câu chuyện, con số và căn phòng trí nhớ"
                        onPress={() => router.navigate('/methods')}
                    />
                </View>

                <View style={styles.section}>
                    <AppText style={styles.sectionTitle}>Bố mẹ cần biết</AppText>
                    <View style={styles.grid}>
                        {PARENT_FACTS.map((fact) => (
                            <View key={fact.figure} style={[styles.fact, { backgroundColor: fact.tint }]}>
                                <AppText style={styles.figure}>{fact.figure}</AppText>
                                <AppText style={styles.factText}>{fact.text}</AppText>
                            </View>
                        ))}
                    </View>
                </View>

                <Faq />

                <View style={styles.closing}>
                    <Mascot size={80} />
                    <AppText style={styles.closingTitle}>Lưu tiến độ của bạn</AppText>
                    <AppText variant="body" style={{ textAlign: 'center', color: colors.ink }}>Tạo tài khoản miễn phí để giữ EXP, huy hiệu và chuỗi ngày.</AppText>
                    <Button title="Tạo tài khoản" onPress={() => router.push('/register')} style={{ alignSelf: 'stretch' }} />
                    <Button title="Đã có tài khoản? Đăng nhập" variant="secondary" onPress={() => router.push('/login')} style={{ alignSelf: 'stretch' }} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// "Nhớ bằng câu chuyện / con số / không gian": đổi chữ đúng một vòng rồi dừng (nội dung tự chạy không kéo dài mãi)
function Hero() {
    const reduceMotion = useReducedMotion();
    const { width } = useWindowDimensions();
    const [active, setActive] = useState(0);
    const steps = useRef(0);

    useEffect(() => {
        if (reduceMotion) return;
        const timer = setInterval(() => {
            steps.current += 1;
            setActive(steps.current % WORDS.length);
            if (steps.current >= WORDS.length) clearInterval(timer);
        }, CYCLE_MS);
        return () => clearInterval(timer);
    }, [reduceMotion]);

    const artWidth = width - spacing.lg * 2;

    return (
        <Animated.View entering={enterUp(0)} style={styles.hero}>
            <View>
                <AppText style={styles.heroTitle} accessibilityRole="header">Nhớ bằng</AppText>
                <Animated.View key={active} entering={FadeInDown.duration(420).easing(ease.enter)}>
                    <AppText style={[styles.heroTitle, styles.heroWord]}>{WORDS[active]}</AppText>
                </Animated.View>
            </View>
            <View accessible accessibilityRole="image" accessibilityLabel="Ba hòn đảo: câu chuyện, con số và không gian">
                {/* Tỉ lệ ảnh 580×456 */}
                <Islands width={artWidth} height={(artWidth * 456) / 580} />
            </View>
            <AppText variant="body">Rèn trí nhớ qua trò chơi ngắn: nối hình thành câu chuyện, biến số thành hình, đặt đồ vật vào căn phòng quen thuộc.</AppText>
            <Button title="Chơi ngay" onPress={() => router.navigate('/games')} />
            <View style={styles.facts}>
                {HERO_FACTS.map((fact) => (
                    <AppText key={fact} style={styles.heroFact}>{fact}</AppText>
                ))}
            </View>
        </Animated.View>
    );
}

// Mọi câu trả lời hiện sẵn (không accordion); chọn nhóm câu hỏi bằng chip
function Faq() {
    const [group, setGroup] = useState(0);
    return (
        <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Câu hỏi thường gặp</AppText>
            <Chips accessibilityLabel="Nhóm câu hỏi" options={FAQ_GROUPS.map((item, index) => ({ value: index, label: item.label }))} value={group} onChange={setGroup} />
            <Animated.View key={group} entering={FadeInDown.duration(240).easing(ease.ui)} style={styles.faq}>
                {FAQ_GROUPS[group].items.map(([question, answer], i) => (
                    <View key={question} style={[styles.faqItem, i > 0 && styles.divider]}>
                        <AppText style={styles.strong}>{question}</AppText>
                        <AppText variant="small">{answer}</AppText>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xl * 2 },
    hero: { gap: spacing.md },
    heroTitle: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: colors.ink },
    heroWord: { color: colors.brand },
    facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
    heroFact: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.brandDeep,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: colors.mint,
    },
    section: { gap: spacing.sm },
    sectionTitle: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    fact: { flexBasis: '45%', flexGrow: 1, gap: 2, padding: spacing.md, borderRadius: radius * 1.25 },
    figure: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, color: colors.ink },
    factText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.ink },
    strong: { fontFamily: fonts.bold, color: colors.ink },
    faq: {
        borderRadius: radius * 1.25,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
    },
    faqItem: { gap: 4, padding: spacing.md },
    divider: { borderTopWidth: 1, borderTopColor: colors.step },
    closing: {
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.lg,
        borderRadius: radius * 1.5,
        backgroundColor: '#fde9a8',
        borderBottomWidth: EDGE + 2,
        borderBottomColor: colors.sunDeep,
    },
    closingTitle: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink },
});
