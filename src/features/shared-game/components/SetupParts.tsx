import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { GAME_ICONS } from '../gameIcons';
import { GAME_META, type GameName } from '../registry';

// Phần dùng chung của ba màn cài đặt ván (RoundSetup, Gương mặt & Tên, Ghi nhớ số)

export const levelLabel = (level: number) => (level <= 3 ? 'Mức căn bản' : level <= 6 ? 'Mức trung cấp' : 'Mức nâng cao');

export const toneOf = (game: GameName) => ({ color: GAME_META[game].color, edge: GAME_META[game].edge });

interface DealBandProps {
    game: GameName;
    overline: string;           // "Cấp 3 · Mức căn bản"
    count: number | string;
    unit: string;               // "lá bài cần nhớ"
    line?: string;              // dòng nhỏ dưới số (thời gian, điểm đạt)
    children?: ReactNode;       // hình minh hoạ (xấp bài úp xoè ra)
}

// Dải đầu màn màu của trò: cấp, số lượng cần nhớ thật to, hình minh hoạ
export function DealBand({ game, overline, count, unit, line, children }: DealBandProps) {
    const meta = GAME_META[game];
    const Icon = GAME_ICONS[game];
    return (
        <Animated.View entering={enterUp(0)} style={[styles.band, { backgroundColor: meta.color, borderBottomColor: meta.edge }]}>
            <View style={styles.bandTop}>
                <View style={styles.bandIcon}>
                    <Icon color={colors.white} size={16} strokeWidth={2.6} />
                </View>
                <AppText style={styles.overline}>{overline}</AppText>
            </View>
            {children}
            <AppText style={styles.count}>
                {count} <AppText style={styles.unit}>{unit}</AppText>
            </AppText>
            {line ? <AppText style={styles.line}>{line}</AppText> : null}
        </Animated.View>
    );
}

export function ToolButton({ icon, label, open, onPress }: { icon: ReactNode; label: string; open?: boolean; onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={open === undefined ? undefined : { expanded: open }}
            style={[styles.tool, open && styles.toolOpen]}
        >
            {icon}
            <AppText style={styles.toolLabel} numberOfLines={1}>{label}</AppText>
        </PressableScale>
    );
}

export function ToolRow({ children }: { children: ReactNode }) {
    return <View style={styles.tools}>{children}</View>;
}

// Khung trắng "dày" cho tuỳ chọn, cách chơi, thống kê
export function SetupPanel({ children }: { children: ReactNode }) {
    return <View style={styles.panel}>{children}</View>;
}

export function SectionTitle({ title, note }: { title: string; note?: string }) {
    return (
        <View style={{ gap: 2 }}>
            <AppText style={styles.section}>{title}</AppText>
            {note ? <AppText variant="small">{note}</AppText> : null}
        </View>
    );
}

// Dòng nhắc cho khách: một câu, có link đăng nhập
export function GuestNote({ text = 'Chơi khách: tiến độ chỉ giữ tạm, không nhận EXP.' }: { text?: string }) {
    return (
        <AppText variant="small" style={{ textAlign: 'center' }}>
            {text}{' '}
            <AppText variant="small" style={styles.link} onPress={() => router.push('/login')}>Đăng nhập</AppText>
        </AppText>
    );
}

export const setupStyles = StyleSheet.create({
    title: { fontFamily: fonts.bold, color: colors.ink },
    goal: { fontFamily: fonts.semibold, color: colors.ink, textAlign: 'center' },
    error: { color: colors.danger, textAlign: 'center' },
});

const styles = StyleSheet.create({
    band: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2 },
    bandTop: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'stretch', justifyContent: 'center' },
    bandIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    overline: { fontFamily: fonts.bold, fontSize: 13, color: 'rgba(255,255,255,0.92)' },
    count: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 48, color: colors.white, fontVariant: ['tabular-nums'] },
    unit: { fontFamily: fonts.bold, fontSize: 17, color: 'rgba(255,255,255,0.92)' },
    line: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
    tools: { flexDirection: 'row', gap: spacing.sm },
    tool: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        minHeight: 64,
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderRadius: radius,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
        backgroundColor: colors.white,
    },
    toolOpen: { borderColor: colors.brand, borderBottomColor: colors.brandDeep, backgroundColor: colors.mint },
    toolLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.brandDeep },
    panel: {
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius * 1.25,
        backgroundColor: colors.white,
        borderWidth: 2,
        borderColor: colors.line,
        borderBottomWidth: EDGE,
        borderBottomColor: colors.edge,
    },
    section: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
});
