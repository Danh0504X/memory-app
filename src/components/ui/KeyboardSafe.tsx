import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet, View } from 'react-native';

// Đẩy nội dung lên khỏi bàn phím trên cả iOS và Android.
// - behavior "padding" cho cả Android: SDK 58 bật edge-to-edge nên Android không tự thu cửa sổ; nếu máy vẫn thu
//   thì phần bị bàn phím đè bằng 0 và KeyboardAvoidingView không đẩy thêm (không bị đẩy hai lần).
// - KeyboardAvoidingView tính vị trí theo view cha, không theo màn hình: dưới header hay thanh trên của ván chơi
//   nó đẩy thiếu đúng bằng phần ở trên. Đo vị trí thật trên màn rồi truyền vào keyboardVerticalOffset.
export function KeyboardSafe({ children }: { children: ReactNode }) {
    const ref = useRef<ComponentRef<typeof View>>(null);
    const [top, setTop] = useState(0);
    return (
        <View ref={ref} style={styles.fill} onLayout={() => ref.current?.measureInWindow((_x, y) => setTop(y))}>
            <KeyboardAvoidingView style={styles.fill} behavior="padding" keyboardVerticalOffset={top}>
                {children}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
});
