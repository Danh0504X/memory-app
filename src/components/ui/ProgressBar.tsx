import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { duration, ease } from '@/constants/motion';

interface ProgressBarProps {
    value: number;          // 0..1
    color?: ColorValue;
    track?: ColorValue;
    height?: number;
}

// Thanh tiến độ: lần đầu dài ra từ 0, sau đó trượt tới giá trị mới.
// Chỉ đổi scaleX (taste skill: không animate width).
export function ProgressBar({ value, color = colors.brand, track = colors.step, height = 8 }: ProgressBarProps) {
    const reduceMotion = useReducedMotion();
    const target = Math.min(1, Math.max(0, value));
    const scale = useSharedValue(reduceMotion ? target : 0);
    const first = useSharedValue(true);

    useEffect(() => {
        if (reduceMotion) {
            scale.value = target;
            return;
        }
        // Lần đầu: dài ra chậm như một "khoảnh khắc"; các lần sau: trượt nhanh theo thao tác
        scale.value = withTiming(target, first.value ? { duration: 700, easing: ease.enter } : { duration: duration.slide, easing: ease.ui });
        first.value = false;
    }, [target, reduceMotion, scale, first]);

    const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: scale.value }] }));

    return (
        <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}>
            <Animated.View style={[styles.fill, { backgroundColor: color, borderRadius: height / 2 }, fill]} />
        </View>
    );
}

const styles = StyleSheet.create({
    track: { overflow: 'hidden' },
    fill: { flex: 1, transformOrigin: 'left' },
});
