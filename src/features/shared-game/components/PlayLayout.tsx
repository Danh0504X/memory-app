import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { KeyboardSafe } from '@/components/ui/KeyboardSafe';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { GAME_META, type GameName } from '../registry';

interface PlayLayoutProps {
    game: GameName;
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

// Khung của các phase đang chơi (ghi nhớ, nhớ lại, kết quả): thanh trên màu của trò + nội dung chiếm phần còn lại
export function PlayLayout({
    game,
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
    const meta = GAME_META[game];

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
        <View style={styles.root}>
            <StatusBar style="light" />
            <SafeAreaView edges={['top']} style={[styles.top, { backgroundColor: meta.color, borderBottomColor: meta.edge }]}>
                <View style={styles.bar}>
                    <Pressable onPress={exit} hitSlop={8} accessibilityRole="button" accessibilityLabel="Thoát ván" style={styles.close}>
                        <X color={colors.white} size={22} strokeWidth={2.6} />
                    </Pressable>
                    <View style={styles.titles}>
                        <AppText style={styles.title} numberOfLines={1}>
                            {meta.label}
                            {daily ? ' · Thử thách' : level !== null ? ` · Cấp ${level}` : ' · Tự chọn'}
                        </AppText>
                        <AppText style={styles.status} numberOfLines={1}>{status}</AppText>
                    </View>
                    {timeLeft !== undefined ? (
                        <View style={[styles.clock, urgent && styles.clockUrgent]} accessibilityLabel={`Còn ${timeLeft} giây`}>
                            <AppText style={[styles.clockText, { color: urgent ? colors.danger : meta.edge }]}>{formatClock(timeLeft)}</AppText>
                        </View>
                    ) : null}
                </View>
                <View style={styles.progress}>
                    <ProgressBar value={progress} height={6} color={colors.white} track="rgba(255,255,255,0.3)" />
                </View>
            </SafeAreaView>

            <SafeAreaView edges={['bottom']} style={styles.body}>
                {pendingText || error ? (
                    <View style={[styles.notice, error ? styles.noticeError : null]} accessibilityLiveRegion="polite">
                        {pendingText && !error ? <ActivityIndicator size="small" color={meta.color} /> : null}
                        <AppText variant="small" style={error ? { color: colors.danger } : null}>{error ?? pendingText}</AppText>
                    </View>
                ) : null}

                {/* Trò có ô nhập (gương mặt, từ): bàn phím đè lên nội dung, đẩy cả nút hành động lên theo */}
                <KeyboardSafe>
                    <View style={styles.body}>{children}</View>

                    {actionLabel && onAction ? (
                        <View style={styles.footer}>
                            <Button title={actionLabel} tone={{ color: meta.color, edge: meta.edge }} loading={actionBusy} onPress={onAction} />
                        </View>
                    ) : null}
                </KeyboardSafe>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.wall },
    top: { borderBottomWidth: 4, borderBottomLeftRadius: radius * 1.5, borderBottomRightRadius: radius * 1.5 },
    bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
    close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)' },
    titles: { flex: 1 },
    title: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.white },
    status: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
    clock: { minWidth: 72, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.white },
    clockUrgent: { backgroundColor: colors.dangerTint },
    clockText: { fontFamily: fonts.extrabold, fontSize: 17, fontVariant: ['tabular-nums'] },
    progress: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
    notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.white },
    noticeError: { backgroundColor: colors.dangerTint },
    body: { flex: 1 },
    footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
});
