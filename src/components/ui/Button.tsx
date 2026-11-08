import { ActivityIndicator, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { PressableScale } from './PressableScale';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
    style?: StyleProp<ViewStyle>;
    title: string;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
}

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...props }: ButtonProps) {
    const isDisabled = disabled || loading;
    const primary = variant === 'primary';
    return (
        <PressableScale
            accessibilityRole="button"
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            disabled={isDisabled}
            style={[styles.base, primary ? styles.primary : styles.secondary, isDisabled && styles.disabled, style]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={primary ? colors.white : colors.brand} />
            ) : (
                <Text style={[styles.label, { color: primary ? colors.white : colors.brandDeep }]}>{title}</Text>
            )}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    // Cao 52: dễ bấm bằng ngón tay (tối thiểu 44-48)
    base: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    primary: { backgroundColor: colors.brand },
    secondary: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.mint },
    disabled: { opacity: 0.55 },
    label: { fontFamily: fonts.bold, fontSize: 16 },
});
