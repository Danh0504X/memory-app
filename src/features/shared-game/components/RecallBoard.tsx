import { Undo2, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PressableScale } from '@/components/ui/PressableScale';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { ease } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface RecallBoardProps<T> {
    slots: (T | null)[];
    selectedIndex: number | null;
    unit: string;                   // "lá" hoặc "hình"
    slotsPerRow: number;            // lá bài: 6, ảnh: 4
    itemRatio: number;              // cao / rộng: lá bài 1.4, ảnh 1
    deckItemWidth: number;
    onSelectSlot: (index: number) => void;
    onClearSlot: (index: number) => void;
    deckTitle: string;
    groups: { label?: string; items: T[] }[];
    isUsed: (item: T) => boolean;
    onPick: (item: T) => void;
    keyOf: (item: T) => string;
    labelOf: (item: T) => string;
    renderItem: (item: T, width: number) => ReactNode;
}

const GAP = 8;

// Bàn nhớ lại: lưới ô trả lời ở trên (ô sắp điền viền vàng), bộ bài để chọn ở dưới.
// Bộ bài có nhãn (chất) thì mỗi nhóm một hàng vuốt ngang, để cả bộ vừa nửa dưới màn hình.
export function RecallBoard<T>({
    slots,
    selectedIndex,
    unit,
    slotsPerRow,
    itemRatio,
    deckItemWidth,
    onSelectSlot,
    onClearSlot,
    deckTitle,
    groups,
    isUsed,
    onPick,
    keyOf,
    labelOf,
    renderItem,
}: RecallBoardProps<T>) {
    const { width, height } = useWindowDimensions();
    const slotWidth = Math.floor((width - spacing.md * 2 - GAP * (slotsPerRow - 1)) / slotsPerRow);
    const target = selectedIndex ?? slots.findIndex((slot) => slot === null);
    const lastFilled = slots.findLastIndex((slot) => slot !== null);
    const labelled = groups.some((group) => group.label);

    let hint = `Chọn ${unit} ở dưới, nó sẽ vào ô viền vàng (ô ${target + 1}).`;
    if (target === -1) hint = 'Đã điền đủ. Chạm một ô để gỡ ra, hoặc nộp bài.';
    else if (selectedIndex !== null) hint = `Đang chọn ô ${target + 1}. Chọn ${unit} để đặt vào.`;

    return (
        <View style={styles.root}>
            <View style={styles.head}>
                <AppText variant="small" style={styles.hint}>{hint}</AppText>
                <Pressable
                    onPress={() => onClearSlot(lastFilled)}
                    disabled={lastFilled === -1}
                    accessibilityRole="button"
                    accessibilityLabel={`Gỡ ${unit} cuối`}
                    style={[styles.undo, lastFilled === -1 && styles.disabled]}
                >
                    <Undo2 color={colors.brandDeep} size={18} />
                    <AppText variant="small" style={styles.undoLabel}>Gỡ {unit} cuối</AppText>
                </Pressable>
            </View>

            <ScrollView style={styles.slotsScroll} contentContainerStyle={styles.slots}>
                {slots.map((item, index) => {
                    const isTarget = item === null && index === target;
                    return (
                        <View key={index} style={{ width: slotWidth, alignItems: 'center', gap: 2 }}>
                            <AppText variant="small" style={styles.slotNo}>{index + 1}</AppText>
                            <PressableScale
                                onPress={() => (item === null ? onSelectSlot(index) : onClearSlot(index))}
                                accessibilityRole="button"
                                accessibilityLabel={item === null ? `Ô ${index + 1}, trống` : `Ô ${index + 1}: ${labelOf(item)}. Chạm để gỡ ra`}
                                style={[
                                    styles.slot,
                                    { width: slotWidth, height: slotWidth * itemRatio },
                                    isTarget && styles.slotTarget,
                                    item !== null && styles.slotFilled,
                                ]}
                            >
                                {item !== null ? (
                                    <>
                                        <Animated.View key={keyOf(item)} entering={ZoomIn.duration(200).easing(ease.enter)}>
                                            {renderItem(item, slotWidth - 4)}
                                        </Animated.View>
                                        <View style={styles.clear}>
                                            <X color={colors.white} size={12} />
                                        </View>
                                    </>
                                ) : null}
                            </PressableScale>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.deck}>
                <AppText variant="small" style={styles.deckTitle}>
                    {deckTitle} · {unit === 'lá' ? 'lá' : 'hình'} đã dùng sẽ mờ đi
                </AppText>
                <ScrollView style={{ maxHeight: height * 0.42 }} contentContainerStyle={styles.deckRows}>
                    {groups.map((group, groupIndex) => {
                        const picks = group.items.map((item) => {
                            const used = isUsed(item);
                            return (
                                <PressableScale
                                    key={keyOf(item)}
                                    disabled={used}
                                    onPress={() => onPick(item)}
                                    accessibilityRole="button"
                                    accessibilityLabel={used ? `${labelOf(item)}, đã dùng` : `Đặt ${labelOf(item)}`}
                                    style={used && styles.used}
                                >
                                    {renderItem(item, deckItemWidth)}
                                </PressableScale>
                            );
                        });
                        return (
                            <View key={group.label ?? groupIndex} style={styles.group}>
                                {group.label ? <AppText variant="small" style={styles.groupLabel}>{group.label}</AppText> : null}
                                {labelled ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowItems}>
                                        {picks}
                                    </ScrollView>
                                ) : (
                                    <View style={[styles.rowItems, styles.wrap]}>{picks}</View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    hint: { flex: 1, color: colors.ink },
    undo: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 40, paddingHorizontal: 10, borderRadius: radius, backgroundColor: colors.white },
    undoLabel: { fontFamily: fonts.semibold, color: colors.brandDeep },
    disabled: { opacity: 0.4 },
    slotsScroll: { flex: 1 },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
    slotNo: { fontSize: 12, lineHeight: 14 },
    slot: {
        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#c9d6cc',
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotTarget: { borderColor: colors.sun, borderStyle: 'solid', backgroundColor: '#fff8e1' },
    slotFilled: { borderWidth: 0, backgroundColor: 'transparent' },
    clear: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.inkSoft, alignItems: 'center', justifyContent: 'center' },
    deck: {
        backgroundColor: colors.white,
        borderTopLeftRadius: radius * 1.5,
        borderTopRightRadius: radius * 1.5,
        borderTopWidth: 1,
        borderColor: colors.step,
        paddingTop: spacing.sm,
    },
    deckTitle: { paddingHorizontal: spacing.md, fontFamily: fonts.semibold },
    deckRows: { gap: spacing.sm, paddingVertical: spacing.sm },
    group: { gap: 4 },
    groupLabel: { paddingHorizontal: spacing.md, fontFamily: fonts.bold, color: colors.ink },
    rowItems: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.md },
    wrap: { flexWrap: 'wrap' },
    used: { opacity: 0.25 },
});
