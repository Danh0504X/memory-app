import { Check, Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/constants/theme';

interface LevelGridProps {
    levels: { level: number; count: number }[];
    unlockedLevel: number;
    selectedLevel: number;
    shortUnit: string;          // "lá", "hình", "người"
    onSelect: (level: number) => void;
}

// Lưới cấp độ: chọn lại được mọi cấp đã mở; cấp chưa mở bị khoá tới khi vượt qua cấp trước
export function LevelGrid({ levels, unlockedLevel, selectedLevel, shortUnit, onSelect }: LevelGridProps) {
    return (
        <View style={styles.levels}>
            {levels.map(({ level, count }) => {
                const locked = level > unlockedLevel;
                const done = level < unlockedLevel;
                const selected = level === selectedLevel;
                return (
                    <Pressable
                        key={level}
                        disabled={locked}
                        onPress={() => onSelect(level)}
                        accessibilityRole="button"
                        accessibilityState={{ selected, disabled: locked }}
                        accessibilityLabel={`Cấp ${level}, ${count} ${shortUnit}${locked ? ', chưa mở khoá' : done ? ', đã qua' : ''}`}
                        style={[styles.level, selected && styles.selected, locked && styles.locked]}
                    >
                        <View style={styles.top}>
                            {locked ? <Lock color={colors.inkSoft} size={12} /> : null}
                            {done ? <Check color={colors.brand} size={12} /> : null}
                            <AppText style={styles.number}>{level}</AppText>
                        </View>
                        <AppText variant="small" style={styles.count}>{count} {shortUnit}</AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    level: {
        width: 62,
        minHeight: 56,
        borderRadius: radius,
        borderWidth: 1.5,
        borderColor: colors.step,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selected: { borderColor: colors.brand, backgroundColor: colors.mint },
    locked: { opacity: 0.45 },
    top: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    number: { fontFamily: fonts.extrabold, fontSize: 18 },
    count: { fontSize: 12, lineHeight: 16 },
});
