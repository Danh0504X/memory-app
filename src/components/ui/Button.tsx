import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';

interface ButtonProps extends Omit<PressableProps, 'children'> {
    title: string;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...props }: ButtonProps) {
    const isDisabled = disabled || loading;
    const primary = variant === 'primary';
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            style={(state) => [
                styles.base,
                primary ? styles.primary : styles.secondary,
                state.pressed && styles.pressed,
                isDisabled && styles.disabled,
                typeof style === 'function' ? style(state) : style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={primary ? colors.white : colors.brand} />
            ) : (
                <Text style={[styles.label, { color: primary ? colors.white : colors.brandDeep }]}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    // Cao 52: dễ bấm bằng ngón tay (tối thiểu 44-48)
    base: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    primary: { backgroundColor: colors.brand },
    secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.mint },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    disabled: { opacity: 0.55 },
    label: { fontFamily: fonts.bold, fontSize: 16 },
});
