import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Stepper } from '@/components/ui/Stepper';
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
                        <Stepper
                            value={custom.count}
                            min={custom.min}
                            max={custom.max}
                            onChange={custom.onCountChange}
                            format={(value) => `${value} ${unit}`}
                            label={`số ${unit}`}
                        />
                    ) : null}
                </>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    options: { gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    title: { fontFamily: fonts.semibold, color: colors.ink, flex: 1 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
});
