import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/constants/theme';
import { ease } from '@/constants/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
    value: number;          // 0..1
    size?: number;
    stroke?: number;
    color?: string;
    track?: string;
    children?: ReactNode;   // nội dung ở giữa vòng (vd. "2/3")
}

// Vòng tiến độ: cung tròn chạy tới giá trị mới (mục tiêu ngày, cấp tài khoản)
export function ProgressRing({ value, size = 72, stroke = 8, color = colors.brand, track = colors.step, children }: ProgressRingProps) {
    const reduceMotion = useReducedMotion();
    const target = Math.min(1, Math.max(0, value));
    const progress = useSharedValue(reduceMotion ? target : 0);
    const r = (size - stroke) / 2;
    const length = 2 * Math.PI * r;

    useEffect(() => {
        progress.value = reduceMotion ? target : withTiming(target, { duration: 800, easing: ease.enter });
    }, [target, reduceMotion, progress]);

    const arc = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.value) }));

    return (
        <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(target * 100) }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
                <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
                <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${length} ${length}`}
                    animatedProps={arc}
                    // Bắt đầu từ đỉnh vòng thay vì bên phải
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            <View style={styles.center}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
