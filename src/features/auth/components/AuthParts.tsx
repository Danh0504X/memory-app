import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Mascot } from '@/components/ui/Mascot';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// Phần dùng chung của các màn tài khoản (đăng nhập, đăng ký, quên/đặt/đổi mật khẩu)

// Đầu màn: linh vật (hoặc biểu tượng) trong vòng màu, tiêu đề to, một dòng giải thích
export function AuthHeader({ title, line, icon, tint = colors.mint }: { title: string; line?: string; icon?: ReactNode; tint?: string }) {
    return (
        <View style={styles.header}>
            <Animated.View entering={ZoomIn.delay(100).springify()} style={[styles.disc, { backgroundColor: tint }]}>
                {icon ?? <Mascot size={72} />}
            </Animated.View>
            <AppText style={styles.title} accessibilityRole="header">{title}</AppText>
            {line ? <AppText variant="body" style={styles.line}>{line}</AppText> : null}
        </View>
    );
}

export function FormError({ children }: { children: ReactNode }) {
    if (!children) return null;
    return (
        <View style={styles.error} accessibilityRole="alert">
            <AppText variant="small" style={styles.errorText}>{children}</AppText>
        </View>
    );
}

// Link chữ cho hành động phụ ("Quên mật khẩu?"), thay cho nút viền to
export function TextLink({ label, lead, onPress, align = 'center' }: { label: string; lead?: string; onPress: () => void; align?: 'center' | 'right' }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={[styles.link, align === 'right' && { alignSelf: 'flex-end' }]}>
            <AppText variant="small" style={{ textAlign: align }}>
                {lead ? `${lead} ` : ''}
                <AppText variant="small" style={styles.linkText}>{label}</AppText>
            </AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    header: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    disc: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.ink, textAlign: 'center' },
    line: { textAlign: 'center' },
    error: { padding: spacing.sm, borderRadius: radius, backgroundColor: colors.dangerTint },
    errorText: { color: colors.danger, fontFamily: fonts.semibold },
    link: { minHeight: 44, justifyContent: 'center', alignSelf: 'center' },
    linkText: { fontFamily: fonts.bold, color: colors.brand },
});
