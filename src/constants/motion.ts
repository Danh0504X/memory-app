import { Easing, FadeInDown } from 'react-native-reanimated';

// Token chuyển động, theo taste skill (references/motion.md): một đường cong UI, một đường cong "vào màn",
// không nảy, không vượt quá điểm dừng; chỉ đổi transform và opacity.
export const ease = {
    ui: Easing.bezier(0.2, 0.8, 0.2, 1),
    enter: Easing.bezier(0.22, 1, 0.36, 1),
    expo: Easing.bezier(0.16, 1, 0.3, 1),
};

export const duration = {
    press: 90,
    release: 120,
    slide: 240,
    enter: 520,
    shapePop: 600,
    shapeMotion: 1100,
};

// Lún nhẹ khi chạm: điện thoại không có hover nên phản hồi bấm phải thấy được (web dùng .985 cho chuột)
export const PRESS_SCALE = 0.97;
export const STAGGER = 60;

// Khối đầu màn trồi lên 12px và hiện dần, khối sau cách khối trước 60ms; chạy một lần khi màn mở.
// Layout animation của Reanimated tự bỏ qua khi máy bật "Giảm chuyển động".
export const enterUp = (index = 0) =>
    FadeInDown.duration(duration.enter)
        .delay(index * STAGGER)
        .easing(ease.enter)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
