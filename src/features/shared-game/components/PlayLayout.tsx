import { useKeepAwake } from 'expo-keep-awake';
import { X } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface PlayLayoutProps {
    gameName: string;
    level: number | null;
    daily?: boolean;
    status: string;
    progress: number;               // 0..1
    timeLeft?: number;              // giây; bỏ trống khi người chơi ẩn đồng hồ
    actionLabel?: string;
    actionBusy?: boolean;
    onAction?: () => void;
    // Thoát ván: hỏi lại trước, vì ván đang chơi sẽ mất
    onExit: () => void;
    confirmExit?: boolean;
    pendingText?: string | null;
    error?: string | null;
    children: ReactNode;
}

const formatClock = (seconds: number) =>
    `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

// Khung của các phase đang chơi (ghi nhớ, nhớ lại, kết quả): thanh trên cùng + nội dung chiếm phần còn lại
export function PlayLayout({
    gameName,
    level,
    daily = false,
    status,
    progress,
    timeLeft,
    actionLabel,
    actionBusy = false,
    onAction,
    onExit,
    confirmExit = true,
    pendingText,
    error,
    children,
}: PlayLayoutProps) {
    // Đang ghi nhớ mà màn hình tự tắt là mất ván
    useKeepAwake();

    const exit = () => {
        if (!confirmExit) return onExit();
        Alert.alert('Thoát ván này?', 'Ván đang chơi sẽ không được tính.', [
            { text: 'Chơi tiếp', style: 'cancel' },
            { text: 'Thoát', style: 'destructive', onPress: onExit },
        ]);
    };
    const urgent = timeLeft !== undefined && timeLeft <= 10;

    // Nút Back cứng của Android: hỏi như nút X thay vì rời màn hình khi ván còn đang chạy
    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            exit();
            return true;
        });
        return () => subscription.remove();
    });

    return (
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
            <View style={styles.bar}>
                <Pressable onPress={exit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Thoát ván" style={styles.close}>
                    <X color={colors.ink} size={22} />
                </Pressable>
                <View style={styles.titles}>
                    <AppText style={styles.title} numberOfLines={1}>
                        {gameName}
                        {daily ? ' · Thử thách ngày' : level !== null ? ` · Cấp ${level}` : ' · Tự chọn'}
                    </AppText>
                    <AppText variant="small" numberOfLines={1}>{status}</AppText>
                </View>
                {timeLeft !== undefined ? (
                    <View style={[styles.clock, urgent && styles.clockUrgent]} accessibilityLabel={`Còn ${timeLeft} giây`}>
                        <AppText style={[styles.clockText, urgent && styles.clockTextUrgent]}>{formatClock(timeLeft)}</AppText>
                    </View>
                ) : null}
            </View>
            <View style={{ marginHorizontal: spacing.md }}>
                <ProgressBar value={progress} height={4} />
            </View>

            {pendingText || error ? (
                <View style={[styles.notice, error ? styles.noticeError : null]} accessibilityLiveRegion="polite">
                    {pendingText && !error ? <ActivityIndicator size="small" color={colors.brand} /> : null}
                    <AppText variant="small" style={error ? { color: colors.danger } : null}>{error ?? pendingText}</AppText>
                </View>
            ) : null}

            {/* Trò có ô nhập (gương mặt, từ): bàn phím iOS đè lên nội dung, đẩy cả nút hành động lên theo */}
            <KeyboardAvoidingView style={styles.body} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.body}>{children}</View>

                {actionLabel && onAction ? (
                    <View style={styles.footer}>
                        <Button title={actionLabel} loading={actionBusy} onPress={onAction} />
                    </View>
                ) : null}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
    titles: { flex: 1 },
    title: { fontFamily: fonts.bold, fontSize: 16 },
    clock: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    clockUrgent: { backgroundColor: '#fdecea', borderColor: '#f5c2bd' },
    clockText: { fontFamily: fonts.bold, fontSize: 17, fontVariant: ['tabular-nums'] },
    clockTextUrgent: { color: colors.danger },
    notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.white },
    noticeError: { backgroundColor: '#fdecea' },
    body: { flex: 1 },
    footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
});
