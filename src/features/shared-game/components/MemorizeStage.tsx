import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent, type ScrollViewInstance } from 'react-native';
import Animated, {
    Easing,
    FadeInLeft,
    FadeInRight,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { STAGGER, duration, ease } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';

interface MemorizeStageProps<T> {
    items: T[];
    index: number;          // vị trí đầu của nhóm đang xem
    groupSize: number;
    unit: string;           // "Lá", "Hình", "Người"...
    onJump: (index: number) => void;
    onPrev: () => void;
    onNext: () => void;
    renderBig: (item: T, index: number) => ReactNode;
    // seen: đã xem tới lá này chưa; lá chưa xem hiện úp
    renderMini: (item: T, index: number, seen: boolean) => ReactNode;
    miniWidth: number;      // bề rộng một lá trong dải dưới, để cuộn dải theo lá đang xem
    keyOf: (item: T, index: number) => string;
    // Lá bài, ảnh: nhóm nằm ngang; từ (rộng) thì xếp dọc
    groupDirection?: 'row' | 'column';
    tone?: { color: string; tint: string; edge: string };   // màu của trò (GAME_META)
}

const MINI_GAP = 8;
const MINI_BORDER = 2;
const SWIPE = 40;   // vuốt ngang quá 40px thì lật

// Bàn ghi nhớ: nhóm đang xem ở giữa trên nền tròn màu của trò (chạm hoặc vuốt để lật),
// hàng nút lật ở dưới cho vừa ngón cái, dải mọi lá trong khay cuối màn.
export function MemorizeStage<T>({
    items,
    index,
    groupSize,
    unit,
    onJump,
    onPrev,
    onNext,
    renderBig,
    renderMini,
    miniWidth,
    keyOf,
    groupDirection = 'row',
    tone = { color: colors.brand, tint: colors.mint, edge: colors.brandDeep },
}: MemorizeStageProps<T>) {
    const end = Math.min(index + groupSize, items.length);
    const stripRef = useRef<ScrollViewInstance>(null);
    const [stripWidth, setStripWidth] = useState(0);
    const [stage, setStage] = useState({ width: 0, height: 0 });
    const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
    // Hướng lật (tới hay lùi) để nhóm mới trượt vào từ đúng phía
    const [view, setView] = useState({ index, forward: true });
    if (view.index !== index) setView({ index, forward: index > view.index });
    const forward = view.index !== index ? index > view.index : view.forward;

    // Đánh dấu nhóm đang xem là đã xem ngay trong lúc render để dải lật cùng lúc với lá lớn
    const unseen: number[] = [];
    for (let i = index; i < end; i++) if (!seen.has(i)) unseen.push(i);
    if (unseen.length > 0) setSeen(new Set([...seen, ...unseen]));

    // Giữ lá đang xem ở giữa dải (mỗi lá chiếm bề rộng lá + viền hai bên + khoảng cách)
    useEffect(() => {
        const stride = miniWidth + 2 * MINI_BORDER + MINI_GAP;
        const center = index * stride + ((end - index) * stride) / 2;
        stripRef.current?.scrollTo({ x: Math.max(0, center - stripWidth / 2), animated: true });
    }, [index, end, miniWidth, stripWidth]);

    // Vuốt ngang để lật; chạm (không vuốt) vẫn do Pressable xử lý. Điểm chạm chỉ đọc/ghi trong handler sự kiện.
    const touchStart = useRef({ x: 0, y: 0 });
    const swipe = {
        onTouchStart: (event: GestureResponderEvent) => {
            touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        },
        onMoveShouldSetResponder: (event: GestureResponderEvent) => {
            const dx = event.nativeEvent.pageX - touchStart.current.x;
            const dy = event.nativeEvent.pageY - touchStart.current.y;
            return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy);
        },
        onResponderRelease: (event: GestureResponderEvent) => {
            const dx = event.nativeEvent.pageX - touchStart.current.x;
            if (dx <= -SWIPE) onNext();
            else if (dx >= SWIPE) onPrev();
        },
    };

    // Nền tròn "thở" chậm sau nhóm đang xem; giảm chuyển động thì đứng yên
    const reduceMotion = useReducedMotion();
    const breath = useSharedValue(1);
    useEffect(() => {
        if (!reduceMotion) breath.value = withRepeat(withTiming(1.05, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, true);
    }, [breath, reduceMotion]);
    const glow = useAnimatedStyle(() => ({ transform: [{ scale: breath.value }] }));
    const glowSize = Math.min(stage.width, stage.height) * 0.86;

    const atStart = index === 0;
    const atEnd = end >= items.length;

    return (
        <View style={styles.root}>
            <View style={styles.stage} onLayout={(event) => setStage(event.nativeEvent.layout)} {...swipe}>
                {glowSize > 0 ? (
                    <Animated.View
                        pointerEvents="none"
                        style={[styles.glow, { width: glowSize, height: glowSize, borderRadius: glowSize / 2, backgroundColor: tone.tint }, glow]}
                    />
                ) : null}
                <Pressable
                    onPress={onNext}
                    disabled={atEnd}
                    accessibilityRole="button"
                    accessibilityLabel={`Chạm để xem ${unit.toLowerCase()} tiếp theo`}
                    style={[styles.group, { flexDirection: groupDirection }]}
                >
                    {items.slice(index, end).map((item, offset) => (
                        <Animated.View
                            key={keyOf(item, index + offset)}
                            style={styles.item}
                            entering={(forward ? FadeInRight : FadeInLeft).duration(duration.slide).delay(offset * STAGGER).easing(ease.enter)}
                        >
                            {renderBig(item, index + offset)}
                        </Animated.View>
                    ))}
                </Pressable>
            </View>

            <View style={styles.controls}>
                <PressableScale
                    onPress={onPrev}
                    disabled={atStart}
                    accessibilityRole="button"
                    accessibilityLabel={`${unit} trước`}
                    style={[styles.arrow, atStart && styles.arrowDisabled]}
                >
                    <ChevronLeft color={colors.ink} size={26} strokeWidth={2.6} />
                </PressableScale>
                <View style={styles.counter} accessibilityLiveRegion="polite">
                    <AppText style={styles.counterText}>
                        {groupSize > 1 && end - index > 1 ? `${index + 1}–${end}` : index + 1}
                        <AppText style={styles.counterTotal}> / {items.length}</AppText>
                    </AppText>
                    <AppText style={styles.counterHint}>{atEnd ? 'Đã xem hết, xem lại hoặc bấm nhớ xong' : 'Chạm hoặc vuốt để xem tiếp'}</AppText>
                </View>
                <PressableScale
                    onPress={onNext}
                    disabled={atEnd}
                    accessibilityRole="button"
                    accessibilityLabel={`${unit} sau`}
                    style={[styles.arrow, !atEnd && { backgroundColor: tone.color, borderColor: tone.color, borderBottomColor: tone.edge }, atEnd && styles.arrowDisabled]}
                >
                    <ChevronRight color={atEnd ? colors.ink : colors.white} size={26} strokeWidth={2.6} />
                </PressableScale>
            </View>

            <View style={styles.tray}>
                <ScrollView
                    ref={stripRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
                    // ScrollView mặc định flexGrow: 1; không chặn thì dải giãn chiếm nửa màn và kéo dài viền lá đang xem
                    style={styles.strip}
                    contentContainerStyle={styles.stripContent}
                    accessibilityLabel={`Tất cả ${items.length} ${unit.toLowerCase()}`}
                >
                    {items.map((item, i) => {
                        const current = i >= index && i < end;
                        return (
                            <Pressable
                                key={keyOf(item, i)}
                                onPress={() => onJump(Math.floor(i / groupSize) * groupSize)}
                                accessibilityRole="button"
                                accessibilityLabel={`Xem ${unit.toLowerCase()} ${i + 1}`}
                                style={[styles.mini, current && { borderColor: tone.color, transform: [{ scale: 1.08 }] }, !current && !seen.has(i) && styles.miniUnseen]}
                            >
                                {renderMini(item, i, seen.has(i))}
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    stage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, overflow: 'hidden' },
    glow: { position: 'absolute' },
    group: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    item: { alignItems: 'center', gap: spacing.sm },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    arrow: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
    },
    arrowDisabled: { opacity: 0.35 },
    counter: { flex: 1, alignItems: 'center' },
    counterText: { fontFamily: fonts.extrabold, fontSize: 22, lineHeight: 28, color: colors.ink, fontVariant: ['tabular-nums'] },
    counterTotal: { fontFamily: fonts.bold, fontSize: 16, color: colors.inkSoft },
    counterHint: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.inkSoft, textAlign: 'center' },
    tray: {
        marginHorizontal: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: radius * 1.25,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.line,
    },
    strip: { flexGrow: 0 },
    stripContent: { alignItems: 'center', gap: MINI_GAP, paddingHorizontal: spacing.md, paddingVertical: 10 },
    mini: { borderRadius: 8, borderWidth: MINI_BORDER, borderColor: 'transparent' },
    miniUnseen: { opacity: 0.8 },
});
