import { useRef } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance, TextInputInstance, TextInputProps } from 'react-native';

const MARGIN = 8;

// Dãy ô nhập trong một ScrollView (tên ở gương mặt, từ ở ghi nhớ từ):
// - bấm "Tiếp" trên bàn phím để sang ô sau, ô cuối thì đóng bàn phím;
// - ô vừa được focus cuộn lên đầu vùng cuộn để không bị bàn phím che.
// Gắn scrollRef vào ScrollView, onContainerLayout vào khung chứa các ô, onItemLayout vào từng ô,
// register/next/reveal vào TextInput. Các hàm này chỉ chạy trong handler sự kiện, không đọc ref lúc render.
export function useFocusChain(count: number) {
    const scrollRef = useRef<ScrollViewInstance>(null);
    const inputs = useRef<(TextInputInstance | null)[]>([]);
    const containerTop = useRef(0);
    const itemTops = useRef<number[]>([]);

    return {
        scrollRef,
        onContainerLayout: (event: LayoutChangeEvent) => {
            containerTop.current = event.nativeEvent.layout.y;
        },
        onItemLayout: (index: number, event: LayoutChangeEvent) => {
            itemTops.current[index] = event.nativeEvent.layout.y;
        },
        register: (index: number, input: TextInputInstance | null) => {
            inputs.current[index] = input;
        },
        next: (index: number) => inputs.current[index + 1]?.focus(),
        reveal: (index: number) =>
            scrollRef.current?.scrollTo({ y: Math.max(0, containerTop.current + (itemTops.current[index] ?? 0) - MARGIN), animated: true }),
        // Nút trên bàn phím: "Tiếp" cho các ô, "Xong" cho ô cuối
        keyProps: (index: number) =>
            (index === count - 1
                ? { returnKeyType: 'done', submitBehavior: 'blurAndSubmit' }
                : { returnKeyType: 'next', submitBehavior: 'submit' }) satisfies TextInputProps,
    };
}
