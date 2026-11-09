import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface NavRowProps {
    icon: ReactNode;
    tint: string;           // nền vòng tròn sau biểu tượng
    title: string;
    subtitle?: string;
    onPress: () => void;
    right?: ReactNode;      // thay cho mũi tên (vd. số người chơi)
    style?: StyleProp<ViewStyle>;
}

// Một hàng dẫn tới màn khác: thẻ trắng "dày", biểu tượng trong vòng màu, mũi tên bên phải
export function NavRow({ icon, tint, title, subtitle, onPress, right, style }: NavRowProps) {
    return (
        <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title} style={[styles.row, style]}>
            <View style={[styles.icon, { backgroundColor: tint }]}>{icon}</View>
            <View style={{ flex: 1, gap: 2 }}>
                <AppText style={styles.title}>{title}</AppText>
                {subtitle ? <AppText variant="small" numberOfLines={2}>{subtitle}</AppText> : null}
            </View>
            {right ?? <ChevronRight color={colors.inkSoft} size={22} />}
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius * 1.25,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
    },
    icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
});
