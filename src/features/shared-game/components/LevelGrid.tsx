import { Check, Lock } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';

interface LevelGridProps {
    levels: { level: number; count: number }[];
    unlockedLevel: number;
    selectedLevel: number;
    shortUnit: string;          // "lá", "hình", "người"
    onSelect: (level: number) => void;
    tone?: { color: string; edge: string };  // màu của trò cho ô đang chọn
}

const CELL = 64;
const GAP = 8;

// Dải cấp độ cuộn ngang: chọn lại được mọi cấp đã mở; cấp chưa mở bị khoá tới khi vượt qua cấp trước.
// Mở màn là dải tự cuộn tới cấp đang chọn.
export function LevelGrid({ levels, unlockedLevel, selectedLevel, shortUnit, onSelect, tone }: LevelGridProps) {
    const scroll = useRef<ScrollViewInstance>(null);
    const [width, setWidth] = useState(0);
    const fill = tone ?? { color: colors.brand, edge: colors.brandDeep };

    useEffect(() => {
        if (!width) return;
        const center = (selectedLevel - 1) * (CELL + GAP) + CELL / 2 + spacing.lg;
        scroll.current?.scrollTo({ x: Math.max(0, center - width / 2), animated: true });
    }, [selectedLevel, width]);

    return (
        <ScrollView
            ref={scroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            style={styles.bleed}
            contentContainerStyle={styles.levels}
        >
            {levels.map(({ level, count }) => {
                const locked = level > unlockedLevel;
                const done = level < unlockedLevel;
                const selected = level === selectedLevel;
                return (
                    <PressableScale
                        key={level}
                        disabled={locked}
                        onPress={() => onSelect(level)}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: locked }}
                        accessibilityLabel={`Cấp ${level}, ${count} ${shortUnit}${locked ? ', chưa mở khoá' : done ? ', đã qua' : ''}`}
                        style={[styles.level, selected && { borderColor: fill.color, backgroundColor: fill.color, borderBottomColor: fill.edge }, locked && styles.locked]}
                    >
                        <View style={styles.top}>
                            {locked ? <Lock color={colors.inkSoft} size={12} /> : null}
                            {done ? <Check color={selected ? colors.white : fill.color} size={12} strokeWidth={3} /> : null}
                            <AppText style={[styles.number, selected && styles.selectedText]}>{level}</AppText>
                        </View>
                        <AppText style={[styles.count, selected && styles.selectedText]}>{count} {shortUnit}</AppText>
                    </PressableScale>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    // Tràn ra hai mép màn (Screen có lề spacing.lg) để vuốt tự nhiên
    bleed: { marginHorizontal: -spacing.lg, flexGrow: 0 },
    levels: { gap: GAP, paddingHorizontal: spacing.lg, paddingBottom: 2 },
    level: {
        width: CELL,
        minHeight: 60,
        borderRadius: radius,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedText: { color: colors.white },
    locked: { opacity: 0.45 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    number: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 24, color: colors.ink },
    count: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.inkSoft },
});
