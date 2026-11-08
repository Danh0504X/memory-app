import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';

const COLORS = ['#f4c95d', '#ffffff', '#cdebd6', '#cfe7f3', '#f7dc8e', '#2e7d32'];
const COUNT = 36;
const FALL = 360;

// Vị trí và nhịp rơi tính từ thứ tự mảnh, không ngẫu nhiên, như bản web (Confetti.tsx)
const PIECES = Array.from({ length: COUNT }, (_, i) => ({
    left: `${(i * 37) % 100}%` as const,
    color: COLORS[i % COLORS.length],
    delay: (i % 9) * 90,
    duration: 1600 + ((i * 53) % 900),
    rotate: ((i * 71) % 540) - 270,
}));

// Pháo giấy rơi một lần trên bảng điểm khi đạt. Bản web lặp mãi; ở app chỉ rơi một lần
// (taste skill: chuyển động kéo dài quá 5 giây phải có nút dừng). Giảm chuyển động thì không hiện.
export function Confetti() {
    const reduceMotion = useReducedMotion();
    if (reduceMotion) return null;
    return (
        <View style={styles.layer} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {PIECES.map((piece, i) => (
                <Piece key={i} {...piece} />
            ))}
        </View>
    );
}

function Piece({ left, color, delay, duration, rotate }: (typeof PIECES)[number]) {
    const fall = useSharedValue(0);
    useEffect(() => {
        fall.value = withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.3, 0.6, 0.5, 1) }));
    }, [fall, delay, duration]);
    const style = useAnimatedStyle(() => ({
        // Hiện lúc bắt đầu rơi, mờ dần ở cuối đường rơi
        opacity: fall.value === 0 ? 0 : 1 - Math.max(0, fall.value - 0.7) / 0.3,
        transform: [{ translateY: fall.value * FALL }, { rotate: `${fall.value * rotate}deg` }],
    }));
    return <Animated.View style={[styles.piece, { left, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
    layer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
    piece: { position: 'absolute', top: -16, width: 9, height: 15, borderRadius: 2 },
});
