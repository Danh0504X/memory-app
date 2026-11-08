import { StyleSheet, Text, type TextProps } from 'react-native';
import { colors, fonts } from '@/constants/theme';

type Variant = 'title' | 'heading' | 'lead' | 'body' | 'small';

// Năm cỡ chữ như bản web; mọi chữ trong app đi qua đây để luôn dùng font Be Vietnam Pro
export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
    return <Text {...props} style={[styles.base, styles[variant], style]} />;
}

const styles = StyleSheet.create({
    base: { color: colors.ink, fontFamily: fonts.regular },
    title: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6 },
    heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
    lead: { fontSize: 18, lineHeight: 27, color: colors.inkSoft },
    body: { fontSize: 16, lineHeight: 24 },
    small: { fontSize: 14, lineHeight: 20, color: colors.inkSoft },
});
