import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { enterUp } from '@/constants/motion';
import { colors, spacing } from '@/constants/theme';
import { KeyboardSafe } from './KeyboardSafe';

interface ScreenProps {
    children: ReactNode;
    // Màn có header của Stack thì header đã lo phần tai thỏ phía trên
    edges?: Edge[];
    // Nút chính dính đáy màn (vd. "Bắt đầu"), nằm ngoài phần cuộn và đi lên theo bàn phím
    footer?: ReactNode;
}

// Khung chung của mọi màn: nền Memio, tránh tai thỏ, cuộn được và đẩy nội dung lên khi bàn phím mở.
// Nội dung vào màn một lần khi mở (taste skill: mỗi màn có một lần "vào màn"), không chạy lại khi cuộn.
export function Screen({ children, edges = ['top'], footer }: ScreenProps) {
    return (
        <SafeAreaView style={styles.safe} edges={edges}>
            <KeyboardSafe>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={enterUp(0)} style={styles.inner}>
                        {children}
                    </Animated.View>
                </ScrollView>
                {footer ? <View style={styles.footer}>{footer}</View> : null}
            </KeyboardSafe>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, flexGrow: 1 },
    inner: { gap: spacing.md, flexGrow: 1 },
    footer: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 2, borderTopColor: colors.line, backgroundColor: colors.wall },
});
