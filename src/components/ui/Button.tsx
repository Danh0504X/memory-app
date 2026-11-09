import { ActivityIndicator, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { EDGE, colors, fonts, radius } from '@/constants/theme';
import { PressableScale } from './PressableScale';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
    style?: StyleProp<ViewStyle>;
    title: string;
    variant?: 'primary' | 'secondary' | 'sun';
    // Tô nút theo màu của một trò (GAME_META[...].color / .edge)
    tone?: { color: string; edge: string };
    loading?: boolean;
}

// Nút "dày": gờ dưới đậm hơn nền, cả nút lún xuống khi bấm (PressableScale)
export function Button({ title, variant = 'primary', tone, loading = false, disabled, style, ...props }: ButtonProps) {
    const isDisabled = disabled || loading;
    const fill =
        tone ? { backgroundColor: tone.color, borderBottomColor: tone.edge }
        : variant === 'sun' ? styles.sun
        : variant === 'secondary' ? styles.secondary
        : styles.primary;
    const label = variant === 'secondary' && !tone ? colors.brandDeep : variant === 'sun' && !tone ? colors.ink : colors.white;
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            style={[styles.base, fill, isDisabled && styles.disabled, style]}
            {...props}
        >
            {loading ? <ActivityIndicator color={label} /> : <Text style={[styles.label, { color: label }]}>{title}</Text>}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    // Cao 54: dễ bấm bằng ngón tay (tối thiểu 44-48)
    base: {
        minHeight: 54,
        borderRadius: radius,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        borderBottomWidth: EDGE,
    },
    primary: { backgroundColor: colors.brand, borderBottomColor: colors.brandDeep },
    sun: { backgroundColor: colors.sun, borderBottomColor: colors.sunDeep },
    secondary: { backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomColor: colors.edge },
    disabled: { opacity: 0.5 },
    label: { fontFamily: fonts.extrabold, fontSize: 16 },
});
