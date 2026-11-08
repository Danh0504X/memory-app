import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LiveShape } from '@/components/ui/LiveShape';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { Picture } from './pictures';

// Khung chung của ba trò thử trong trang hướng dẫn: tiêu đề theo bước và nút chọn độ dài
export function TrialFrame({
    title,
    levels,
    level,
    unit,
    onLevel,
    locked = false,
    children,
}: {
    title: string;
    levels: number[];
    level: number;
    unit: string;
    onLevel: (index: number) => void;
    locked?: boolean;
    children: ReactNode;
}) {
    return (
        <View style={styles.trial}>
            <AppText style={styles.title} accessibilityLiveRegion="polite">{title}</AppText>
            <View style={styles.levels} accessibilityRole="radiogroup">
                {levels.map((size, index) => (
                    <Pressable
                        key={size}
                        disabled={locked}
                        onPress={() => onLevel(index)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: index === level, disabled: locked }}
                        style={[styles.level, index === level && styles.levelOn, locked && { opacity: 0.5 }]}
                    >
                        <AppText variant="small" style={styles.levelText}>{size} {unit}</AppText>
                    </Pressable>
                ))}
            </View>
            {children}
        </View>
    );
}

// Một hình trong đĩa tròn, kèm tên bên dưới (tuỳ chọn)
export function Disc({ picture, size = 56, label, tone }: { picture: Picture; size?: number; label?: string; tone?: 'ok' | 'bad' }) {
    return (
        <View style={styles.cell}>
            <View
                style={[styles.disc, { width: size, height: size, borderRadius: size / 2 }, tone === 'ok' && styles.ok, tone === 'bad' && styles.bad]}
                accessible
                accessibilityLabel={picture.name}
            >
                <LiveShape art={picture.src} motion={picture.motion} size={size * 0.66} />
            </View>
            {label ? <AppText variant="small" style={styles.label} numberOfLines={2}>{label}</AppText> : null}
        </View>
    );
}

export function EmptyDisc({ size = 56, text }: { size?: number; text?: string }) {
    return (
        <View style={styles.cell}>
            <View style={[styles.disc, styles.empty, { width: size, height: size, borderRadius: size / 2 }]}>
                {text ? <AppText style={styles.emptyText}>{text}</AppText> : null}
            </View>
        </View>
    );
}

// Lựa chọn dạng ô: hình + tên, mờ đi khi đã dùng
export function Choice({ picture, disabled, onPress }: { picture: Picture; disabled?: boolean; onPress: () => void }) {
    const Shape = picture.src;
    return (
        <PressableScale
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={picture.name}
            style={[styles.choice, disabled && { opacity: 0.3 }]}
        >
            <Shape width={40} height={40} />
            <AppText variant="small" style={styles.label} numberOfLines={1}>{picture.name}</AppText>
        </PressableScale>
    );
}

export const trialStyles = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
    lead: { color: colors.ink },
    hint: { fontStyle: 'italic' },
    actions: { gap: spacing.sm },
});

const styles = StyleSheet.create({
    trial: { gap: spacing.md, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    title: { fontFamily: fonts.bold, fontSize: 17 },
    levels: { flexDirection: 'row', gap: spacing.sm },
    level: { minHeight: 40, paddingHorizontal: 14, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, justifyContent: 'center' },
    levelOn: { borderColor: colors.brand, backgroundColor: colors.mint },
    levelText: { fontFamily: fonts.semibold, color: colors.ink },
    cell: { alignItems: 'center', gap: 4, maxWidth: 76 },
    disc: { backgroundColor: colors.wall, borderWidth: 1.5, borderColor: colors.step, alignItems: 'center', justifyContent: 'center' },
    ok: { borderColor: colors.brand, backgroundColor: '#eef8f0' },
    bad: { borderColor: colors.danger, backgroundColor: '#fdecea' },
    empty: { borderStyle: 'dashed', backgroundColor: colors.white },
    emptyText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.inkSoft },
    label: { textAlign: 'center', fontSize: 12, lineHeight: 15, color: colors.ink },
    choice: { width: 84, alignItems: 'center', gap: 4, padding: 8, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white },
});
