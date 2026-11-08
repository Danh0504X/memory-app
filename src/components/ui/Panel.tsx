import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';
import type { Request } from '@/features/dashboard/hooks/useOverview';
import { AppText } from './AppText';
import { Button } from './Button';

// Khối nội dung có tiêu đề (bản web: .panel)
export function Panel({ title, action, children, style }: { title?: string; action?: ReactNode; children: ReactNode; style?: StyleProp<ViewStyle> }) {
    return (
        <View style={[styles.panel, style]}>
            {title || action ? (
                <View style={styles.head}>
                    {title ? <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>{title}</AppText> : null}
                    {action}
                </View>
            ) : null}
            {children}
        </View>
    );
}

// Mỗi khối tự tải và tự báo lỗi (bản web: BlockState): một API hỏng không làm trắng cả màn
export function BlockState<T>({ request, onRetry, children }: { request: Request<T>; onRetry: () => void; children: (data: T) => ReactNode }) {
    if (request.status === 'ready') return <>{children(request.data)}</>;
    if (request.status === 'loading') {
        return (
            <View style={styles.state}>
                <ActivityIndicator color={colors.brand} />
            </View>
        );
    }
    return (
        <View style={styles.state} accessibilityRole="alert">
            <AppText variant="small" style={{ color: colors.danger }}>{request.message}</AppText>
            <Button title="Thử lại" variant="secondary" onPress={onRetry} />
        </View>
    );
}

const styles = StyleSheet.create({
    panel: { backgroundColor: colors.white, borderRadius: radius * 1.5, borderWidth: 1, borderColor: colors.step, padding: spacing.md, gap: spacing.sm },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    state: { gap: spacing.sm, paddingVertical: spacing.sm },
});
