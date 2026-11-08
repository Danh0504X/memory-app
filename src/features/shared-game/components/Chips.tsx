import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/constants/theme';

interface ChipsProps<T extends string | number> {
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    accessibilityLabel: string;
}

// Nhóm nút chọn một trong vài giá trị (thời gian ghi nhớ, số lá mỗi lần xem...)
export function Chips<T extends string | number>({ options, value, onChange, accessibilityLabel }: ChipsProps<T>) {
    return (
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => onChange(option.value)}
                        style={[styles.chip, selected && styles.selected]}
                    >
                        <AppText variant="small" style={[styles.label, selected && styles.selectedLabel]}>
                            {option.label}
                        </AppText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius,
        borderWidth: 1.5,
        borderColor: colors.step,
        backgroundColor: colors.white,
        justifyContent: 'center',
    },
    selected: { borderColor: colors.brand, backgroundColor: colors.mint },
    label: { fontFamily: fonts.semibold, color: colors.ink },
    selectedLabel: { color: colors.brandDeep },
});
