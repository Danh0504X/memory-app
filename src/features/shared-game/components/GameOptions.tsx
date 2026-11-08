import { Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { Chips } from './Chips';

// Màn hình điện thoại hẹp: xem tối đa 3 lá/hình một lần (bản web cho tới 5)
export const MAX_GROUP = 3;

interface GameOptionsProps {
    unit: string;                       // "lá", "hình"
    groups: number;
    onGroupsChange: (groups: number) => void;
    hideTimer: boolean;
    onHideTimerChange: (hideTimer: boolean) => void;
    // Ván tự chọn số lượng; bỏ trống khi trò không cho tự chọn (backend trả customItems: null)
    custom?: {
        enabled: boolean;
        count: number;
        min: number;
        max: number;
        onEnabledChange: (enabled: boolean) => void;
        onCountChange: (count: number) => void;
    };
}

// Tuỳ chọn chung của các trò xem lần lượt rồi xếp lại (thẻ bài, hình ảnh)
export function GameOptions({ unit, groups, onGroupsChange, hideTimer, onHideTimerChange, custom }: GameOptionsProps) {
    return (
        <View style={styles.options}>
            <AppText variant="small" style={styles.title}>Số {unit} mỗi lần xem</AppText>
            <Chips
                accessibilityLabel={`Số ${unit} mỗi lần xem`}
                options={Array.from({ length: MAX_GROUP }, (_, i) => ({ value: i + 1, label: `${i + 1} ${unit}` }))}
                value={Math.min(MAX_GROUP, Math.max(1, groups || 1))}
                onChange={onGroupsChange}
            />

            <View style={styles.switchRow}>
                <AppText variant="small" style={styles.title}>Ẩn đồng hồ khi ghi nhớ</AppText>
                <Switch value={hideTimer} onValueChange={onHideTimerChange} trackColor={{ true: colors.brand }} accessibilityLabel="Ẩn đồng hồ khi ghi nhớ" />
            </View>

            {custom ? (
                <>
                    <View style={styles.switchRow}>
                        <AppText variant="small" style={styles.title}>Tự chọn số {unit} (không mở cấp)</AppText>
                        <Switch
                            value={custom.enabled}
                            onValueChange={custom.onEnabledChange}
                            trackColor={{ true: colors.brand }}
                            accessibilityLabel={`Tự chọn số ${unit}`}
                        />
                    </View>
                    {custom.enabled ? (
                        <View style={styles.stepper}>
                            <StepButton label={`Bớt 1 ${unit}`} disabled={custom.count <= custom.min} onPress={() => custom.onCountChange(custom.count - 1)}>
                                <Minus color={colors.brandDeep} size={20} />
                            </StepButton>
                            <AppText style={styles.stepValue} accessibilityLiveRegion="polite">{custom.count} {unit}</AppText>
                            <StepButton label={`Thêm 1 ${unit}`} disabled={custom.count >= custom.max} onPress={() => custom.onCountChange(custom.count + 1)}>
                                <Plus color={colors.brandDeep} size={20} />
                            </StepButton>
                            <AppText variant="small">({custom.min}–{custom.max})</AppText>
                        </View>
                    ) : null}
                </>
            ) : null}
        </View>
    );
}

function StepButton({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children: ReactNode }) {
    return (
        <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} style={[styles.step, disabled && styles.disabled]}>
            {children}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    options: { gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    title: { fontFamily: fonts.semibold, color: colors.ink, flex: 1 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
    disabled: { opacity: 0.4 },
    stepValue: { fontFamily: fonts.bold, fontSize: 18, minWidth: 64, textAlign: 'center' },
});
