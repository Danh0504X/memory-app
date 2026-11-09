import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { colors, radius, spacing } from '@/constants/theme';

// Khung chờ thay cho vòng quay: vài thanh xám nhấp nháy đúng chỗ nội dung sắp hiện.
// Giảm chuyển động thì đứng yên.
export function Skeleton({ lines = 3 }: { lines?: number }) {
    const reduceMotion = useReducedMotion();
    const pulse = useSharedValue(0.55);
    useEffect(() => {
        if (!reduceMotion) pulse.value = withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true);
    }, [pulse, reduceMotion]);
    const fade = useAnimatedStyle(() => ({ opacity: pulse.value }));

    return (
        <Animated.View style={[styles.box, fade]} accessibilityLabel="Đang tải" accessibilityRole="progressbar">
            {Array.from({ length: lines }, (_, i) => (
                <View key={i} style={[styles.bar, { width: i === lines - 1 ? '60%' : '100%' }]} />
            ))}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    box: { gap: spacing.sm, paddingVertical: spacing.sm },
    bar: { height: 14, borderRadius: radius / 2, backgroundColor: colors.step },
});
