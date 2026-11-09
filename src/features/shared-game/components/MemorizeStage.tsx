import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { STAGGER, duration, ease } from '@/constants/motion';
import { EDGE, colors, spacing } from '@/constants/theme';

interface MemorizeStageProps<T> {
    items: T[];
    index: number;          // vị trí đầu của nhóm đang xem
    groupSize: number;
    unit: string;           // "Lá" hoặc "Hình"
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
}

const MINI_GAP = 6;
const MINI_BORDER = 2;

// Bàn ghi nhớ: nhóm đang xem ở giữa (chạm để lật tiếp), hai nút lật hai bên, dải mọi lá bên dưới
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
}: MemorizeStageProps<T>) {
    const end = Math.min(index + groupSize, items.length);
    const stripRef = useRef<ScrollViewInstance>(null);
    const [stripWidth, setStripWidth] = useState(0);
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

    const atStart = index === 0;
    const atEnd = end >= items.length;

    return (
        <View style={styles.root}>
            <View style={styles.stage}>
                <Pressable
                    onPress={onPrev}
                    disabled={atStart}
                    accessibilityRole="button"
                    accessibilityLabel={`${unit} trước`}
                    style={[styles.arrow, atStart && styles.arrowDisabled]}
                >
                    <ChevronLeft color={colors.brandDeep} size={30} />
                </Pressable>

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
                            <AppText variant="small">
                                {unit} {index + offset + 1} / {items.length}
                            </AppText>
                        </Animated.View>
                    ))}
                </Pressable>

                <Pressable
                    onPress={onNext}
                    disabled={atEnd}
                    accessibilityRole="button"
                    accessibilityLabel={`${unit} sau`}
                    style={[styles.arrow, atEnd && styles.arrowDisabled]}
                >
                    <ChevronRight color={colors.brandDeep} size={30} />
                </Pressable>
            </View>

            <ScrollView
                ref={stripRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onLayout={(event) => setStripWidth(event.nativeEvent.layout.width)}
                contentContainerStyle={styles.strip}
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
                            style={[styles.mini, current && styles.miniCurrent]}
                        >
                            {renderMini(item, i, seen.has(i))}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    stage: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
    arrow: { width: 48, height: 96, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge },
    arrowDisabled: { opacity: 0.3 },
    group: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, alignSelf: 'stretch' },
    item: { alignItems: 'center', gap: spacing.sm },
    strip: { gap: MINI_GAP, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    mini: { borderRadius: 6, borderWidth: MINI_BORDER, borderColor: 'transparent' },
    miniCurrent: { borderColor: colors.sunDeep },
});
