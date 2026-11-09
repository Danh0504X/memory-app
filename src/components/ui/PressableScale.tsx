import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { PRESS_SCALE, duration, ease } from '@/constants/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> };

// Pressable có phản hồi chạm: lún xuống khi đặt ngón tay, trở lại khi nhấc (lớp "press" của taste skill)
export function PressableScale({ style, onPress, onPressIn, onPressOut, ...props }: Props) {
    const reduceMotion = useReducedMotion();
    const pressed = useSharedValue(0);
    const animated = useAnimatedStyle(() => ({
        transform: [{ scale: 1 - pressed.value * (1 - PRESS_SCALE) }],
        opacity: 1 - pressed.value * 0.06,
    }));

    return (
        <AnimatedPressable
            {...props}
            style={[style, reduceMotion ? null : animated]}
            // Rung nhẹ khi bấm thật (không rung lúc chạm để cuộn); máy không hỗ trợ thì bỏ qua
            onPress={
                onPress &&
                ((event) => {
                    void Haptics.selectionAsync().catch(() => undefined);
                    onPress(event);
                })
            }
            onPressIn={(event) => {
                pressed.value = withTiming(1, { duration: duration.press, easing: ease.ui });
                onPressIn?.(event);
            }}
            onPressOut={(event) => {
                pressed.value = withTiming(0, { duration: duration.release, easing: ease.ui });
                onPressOut?.(event);
            }}
        />
    );
}
