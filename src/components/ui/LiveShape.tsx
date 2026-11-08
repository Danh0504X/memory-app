import { useEffect, type FC } from 'react';
import { Pressable, type TransformsStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';
import { duration, ease } from '@/constants/motion';

export type ShapeMotion = 'wobble' | 'flicker' | 'glide' | 'flap' | 'rock' | 'swing' | 'spin' | 'tilt' | 'bob' | 'hop';

// Khung hình của từng kiểu cử động, chép từ bản web (memory-web/src/index.css: @keyframes shape-*).
// Khoảng dịch tính theo hình 80px của web, rồi nhân theo cỡ hình thật.
const FRAMES: Record<ShapeMotion, { at: number[]; rotate?: number[]; x?: number[]; y?: number[]; scaleX?: number[]; scaleY?: number[]; skewX?: number[] }> = {
    wobble: { at: [0, 0.2, 0.4, 0.6, 0.8, 1], rotate: [0, -10, 8, -5, 3, 0] },
    flicker: { at: [0, 0.2, 0.4, 0.6, 0.8, 1], scaleY: [1, 1.06, 0.97, 1.04, 0.99, 1], skewX: [0, 2, -2, 1, 0, 0] },
    glide: { at: [0, 0.4, 0.75, 1], x: [0, 10, -4, 0], rotate: [0, -3, 1, 0] },
    flap: { at: [0, 0.15, 0.3, 0.45, 0.6, 1], scaleX: [1, 0.55, 1, 0.6, 1, 1] },
    rock: { at: [0, 0.2, 0.45, 0.7, 0.9, 1], rotate: [0, 8, -7, 4, -1, 0] },
    swing: { at: [0, 0.2, 0.45, 0.7, 0.9, 1], rotate: [0, 14, -10, 6, -2, 0] },
    spin: { at: [0, 1], rotate: [0, 360] },
    tilt: { at: [0, 0.3, 0.65, 1], rotate: [0, -8, 6, 0] },
    bob: { at: [0, 0.3, 0.6, 0.8, 1], y: [0, -14, 0, -6, 0] },
    hop: { at: [0, 0.35, 0.7, 1], y: [0, -10, 0, 0], scaleY: [1, 1.04, 0.96, 1] },
};

// Điểm xoay như web: hình đứng (trứng, nến, thuyền) xoay quanh chân, hình treo (lưỡi câu, anh đào) quanh đỉnh
const ORIGIN: Partial<Record<ShapeMotion, string>> = {
    wobble: '50% 90%',
    rock: '50% 90%',
    tilt: '50% 90%',
    flicker: '50% 90%',
    swing: '50% 8%',
};

interface LiveShapeProps {
    art: FC<SvgProps>;
    motion: string;
    size: number;
    label?: string;
    // Chạm vào hình để xem lại cử động (bản web: rê chuột lên hình)
    tappable?: boolean;
}

// Hình móc số / đồ vật của Memio: bật ra khi vừa hiện rồi cử động đúng tính cách của nó một lần.
// Không lặp mãi (taste skill: không vòng lặp trên trang không phải công nghệ); "Giảm chuyển động" thì đứng yên.
export function LiveShape({ art: Art, motion, size, label, tappable = false }: LiveShapeProps) {
    const reduceMotion = useReducedMotion();
    const pop = useSharedValue(reduceMotion ? 1 : 0);
    const progress = useSharedValue(reduceMotion ? 1 : 0);
    const kind = (motion in FRAMES ? motion : 'wobble') as ShapeMotion;
    const scale = size / 80;

    const play = (withPop: boolean) => {
        if (reduceMotion) return;
        if (withPop) {
            pop.value = 0;
            pop.value = withTiming(1, { duration: duration.shapePop, easing: ease.expo });
        }
        progress.value = 0;
        progress.value = withDelay(withPop ? 250 : 0, withTiming(1, { duration: duration.shapeMotion, easing: ease.enter }));
    };

    useEffect(() => {
        play(true);
        // play chỉ đổi khi "Giảm chuyển động" đổi; chạy một lần lúc hình vừa hiện
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reduceMotion]);

    const animated = useAnimatedStyle(() => {
        const frames = FRAMES[kind];
        const at = (values?: number[], fallback = 0) => (values ? interpolate(progress.value, frames.at, values) : fallback);
        const transform: TransformsStyle['transform'] = [
            { translateX: at(frames.x) * scale },
            { translateY: at(frames.y) * scale },
            { rotate: `${at(frames.rotate)}deg` },
            { skewX: `${at(frames.skewX)}deg` },
            { scaleX: at(frames.scaleX, 1) * (0.6 + 0.4 * pop.value) },
            { scaleY: at(frames.scaleY, 1) * (0.6 + 0.4 * pop.value) },
        ];
        return { opacity: pop.value, transform };
    });

    const shape = (
        <Animated.View style={[{ width: size, height: size, transformOrigin: ORIGIN[kind] ?? '50% 50%' }, animated]}>
            <Art width={size} height={size} />
        </Animated.View>
    );

    if (!tappable) return label ? <Animated.View accessible accessibilityRole="image" accessibilityLabel={label}>{shape}</Animated.View> : shape;
    return (
        <Pressable onPress={() => play(false)} accessibilityRole="image" accessibilityLabel={label} accessibilityHint="Chạm để xem hình cử động">
            {shape}
        </Pressable>
    );
}
