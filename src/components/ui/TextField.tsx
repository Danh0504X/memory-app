import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/constants/theme';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
    label: string;
    error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
    return (
        <View style={styles.field}>
            <AppText variant="small" style={styles.label}>{label}</AppText>
            <TextInput
                placeholderTextColor="#8a94a3"
                accessibilityLabel={label}
                style={[styles.input, error ? styles.inputError : null, style]}
                {...props}
            />
            {error ? <AppText variant="small" style={styles.error}>{error}</AppText> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    field: { gap: 6 },
    label: { fontFamily: fonts.semibold, color: colors.ink },
    input: {
        minHeight: 52,
        borderRadius: radius,
        borderWidth: 2,
        borderColor: colors.step,
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.ink,
    },
    inputError: { borderColor: colors.danger },
    error: { color: colors.danger },
});
