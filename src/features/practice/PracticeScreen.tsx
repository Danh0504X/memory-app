import { router, type Href } from 'expo-router';
import { useState, type FC, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import room0 from '@/assets/memio/practice/room-step0.svg';
import room1 from '@/assets/memio/practice/room-step1.svg';
import room2 from '@/assets/memio/practice/room-step2.svg';
import room3 from '@/assets/memio/practice/room-step3.svg';
import room4 from '@/assets/memio/practice/room-step4.svg';
import candle from '@/assets/memio/practice/candle.svg';
import egg from '@/assets/memio/practice/egg.svg';
import snowman from '@/assets/memio/practice/snowman.svg';
import swan from '@/assets/memio/practice/swan.svg';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LiveShape } from '@/components/ui/LiveShape';
import { Screen } from '@/components/ui/Screen';
import { ease } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { pictureOf } from '@/features/methods/guide/pictures';

// Bài thực hành có hướng dẫn (bản web: features/practice/pages): đề cố định, đi từng bước xem đề, che đề tự nhớ, xem đáp án

interface PracticeStep {
    title: string;
    prompt: string;
    visual: ReactNode;
    action: string;     // nút sang bước sau; bước cuối quay lại bước đầu
}

interface Practice {
    title: string;
    guide: string;      // trang hướng dẫn của phương pháp (/methods/[slug])
    steps: PracticeStep[];
}

const CARDS = ['Mèo', 'Ô', 'Bánh', 'Xe đạp'].map(pictureOf);

function Cards({ hidden }: { hidden: boolean }) {
    return (
        <View style={styles.row}>
            {CARDS.map((card, i) => (
                <View key={card.name} style={styles.cell}>
                    <View style={styles.disc}>
                        {hidden ? <AppText style={styles.mark}>?</AppText> : <LiveShape art={card.src} motion={card.motion} size={48} label={card.name} />}
                    </View>
                    <AppText variant="small" style={styles.label}>{i + 1} · {hidden ? '?' : card.name}</AppText>
                </View>
            ))}
        </View>
    );
}

const DIGITS: { digit: string; name: string; art: FC<SvgProps>; motion: string }[] = [
    { digit: '2', name: 'Thiên nga', art: swan, motion: 'glide' },
    { digit: '0', name: 'Trứng', art: egg, motion: 'wobble' },
    { digit: '1', name: 'Nến', art: candle, motion: 'flicker' },
    { digit: '8', name: 'Người tuyết', art: snowman, motion: 'tilt' },
];

function Digits({ hidden }: { hidden: boolean }) {
    return (
        <View style={styles.row} accessibilityLabel={hidden ? 'Bốn ô đã che' : 'Dãy số 2 0 1 8'}>
            {DIGITS.map(({ digit }) => (
                <View key={digit} style={styles.digitBox}>
                    <AppText style={styles.digit}>{hidden ? '?' : digit}</AppText>
                </View>
            ))}
        </View>
    );
}

function DigitShapes() {
    return (
        <View style={{ gap: spacing.md }}>
            <View style={styles.row}>
                {DIGITS.map((item, i) => (
                    <View key={item.digit} style={styles.cell}>
                        <View style={styles.disc}>
                            <LiveShape art={item.art} motion={item.motion} size={48} label={item.name} />
                        </View>
                        <AppText variant="small" style={styles.label}>{i + 1} · {item.name}</AppText>
                    </View>
                ))}
            </View>
            <AppText style={styles.chain}>Thiên nga → Trứng → Nến → Người tuyết → 2018</AppText>
        </View>
    );
}

// Ảnh căn phòng 944×300: mỗi bước một ảnh, mở dần từng vị trí
function Room({ art: Art, step }: { art: FC<SvgProps>; step: number }) {
    return (
        <View accessible accessibilityRole="image" accessibilityLabel={`Căn phòng trí nhớ bước ${step}`} style={{ alignItems: 'center' }}>
            <Art width="100%" height={110} preserveAspectRatio="xMidYMid meet" />
        </View>
    );
}

export const PRACTICES: Record<string, Practice> = {
    story: {
        title: 'Nối thành câu chuyện',
        guide: '/methods/story-linking',
        steps: [
            { title: 'Xem đề', prompt: 'Nhìn dãy hình theo thứ tự và tạo câu chuyện.', visual: <Cards hidden={false} />, action: 'Che dãy hình và tự nhớ' },
            { title: 'Che đề · tự nhớ', prompt: 'Đề đã được che. Hãy kể lại câu chuyện và nhớ bốn vị trí.', visual: <Cards hidden />, action: 'Xem đáp án' },
            { title: 'Hiện đáp án', prompt: 'Bây giờ đối chiếu thứ tự bạn vừa nhớ.', visual: <Cards hidden={false} />, action: 'Thử lại lượt khác' },
        ],
    },
    numbers: {
        title: 'Biến số thành hình',
        guide: '/methods/number-shape',
        steps: [
            { title: 'Xem đề', prompt: 'Nhìn 2018. Hãy đổi mỗi chữ số thành một hình.', visual: <Digits hidden={false} />, action: 'Che dãy số và tự nhớ' },
            { title: 'Che đề · tự nhớ', prompt: 'Đề đã được che. Hãy nhớ lại bốn hình tương ứng với dãy số 2, 0, 1, 8.', visual: <Digits hidden />, action: 'Xem đáp án' },
            { title: 'Hiện đáp án', prompt: 'Đối chiếu sau khi bạn tự trả lời: 2, 0, 1, 8.', visual: <DigitShapes />, action: 'Thử lại lượt khác' },
        ],
    },
    loci: {
        title: 'Căn phòng trí nhớ',
        guide: '/methods/memory-palace',
        steps: [
            { title: 'Xem đề', prompt: 'Quan sát: Táo ở cửa → Mèo ở bàn → Bóng ở giường.', visual: <Room art={room0} step={0} />, action: 'Che hình và tự nhớ' },
            { title: 'Che hình · nhớ vị trí 1', prompt: 'Giấu hình. Nhấn "Mở cửa" sau khi đã tự nhớ.', visual: <Room art={room1} step={1} />, action: 'Mở cửa' },
            { title: 'Mở vị trí 1 · nhớ vị trí 2', prompt: 'Đúng rồi! Cửa có quả táo. Giờ nhớ xem bàn học có gì?', visual: <Room art={room2} step={2} />, action: 'Mở bàn học' },
            { title: 'Mở vị trí 2 · nhớ vị trí 3', prompt: 'Bàn học có chú mèo! Cuối cùng, giường ngủ có gì nào?', visual: <Room art={room3} step={3} />, action: 'Mở giường ngủ' },
            { title: 'Xem cả ba', prompt: 'Tuyệt vời! Bạn đã hoàn thành toàn bộ lộ trình căn phòng trí nhớ.', visual: <Room art={room4} step={4} />, action: 'Thử lại lượt khác' },
        ],
    },
};

export function PracticeScreen({ practice }: { practice: Practice }) {
    const [step, setStep] = useState(0);
    const current = practice.steps[step];
    const last = step === practice.steps.length - 1;

    return (
        <Screen edges={['bottom']}>
            <AppText variant="small" style={styles.overline}>Bài thực hành · {practice.title}</AppText>
            <AppText variant="title" accessibilityLiveRegion="polite">{current.title}</AppText>
            <View style={styles.board}>
                <AppText variant="body">{current.prompt}</AppText>
                {/* Mỗi bước một khung: bước mới hiện mờ dần thay cho bước cũ */}
                <Animated.View key={step} entering={FadeIn.duration(250).easing(ease.ui)} style={styles.stage}>
                    {current.visual}
                </Animated.View>
            </View>
            <Button title={current.action} onPress={() => setStep(last ? 0 : step + 1)} />
            <Button title="Xem lại hướng dẫn" variant="secondary" onPress={() => router.replace(practice.guide as Href)} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    overline: { fontFamily: fonts.bold, color: colors.brandDeep },
    board: { gap: spacing.md, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    stage: { minHeight: 150, justifyContent: 'center', padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: '#eaf8ef' },
    row: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    cell: { alignItems: 'center', gap: 6, width: 72 },
    disc: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    mark: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.inkSoft },
    label: { color: colors.ink, textAlign: 'center' },
    digitBox: { width: 60, height: 76, borderRadius: radius, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    digit: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 48 },
    chain: { fontFamily: fonts.semibold, textAlign: 'center', color: colors.brandDeep },
});
