import { Minus, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts } from '@/constants/theme';
import { AppText } from './AppText';

interface StepperProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    format: (value: number) => string;   // "12 lá", "60 giây"
    label: string;                        // cho trình đọc màn hình
}

// Bộ chỉnh số bằng nút −/+ (dễ bấm hơn ô nhập số trên điện thoại); luôn giữ trong [min, max]
export function Stepper({ value, min, max, step = 1, onChange, format, label }: StepperProps) {
    const set = (next: number) => onChange(Math.max(min, Math.min(max, next)));
    return (
        <View style={styles.row} accessibilityLabel={label}>
            <StepButton label={`Giảm ${label}`} disabled={value <= min} onPress={() => set(value - step)}>
                <Minus color={colors.brandDeep} size={20} />
            </StepButton>
            <AppText style={styles.value} accessibilityLiveRegion="polite">{format(value)}</AppText>
            <StepButton label={`Tăng ${label}`} disabled={value >= max} onPress={() => set(value + step)}>
                <Plus color={colors.brandDeep} size={20} />
            </StepButton>
            <AppText variant="small">({format(min)}–{format(max)})</AppText>
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    step: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.line, borderBottomWidth: 4, borderBottomColor: colors.edge, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
    disabled: { opacity: 0.4 },
    value: { fontFamily: fonts.bold, fontSize: 18, minWidth: 72, textAlign: 'center' },
});
