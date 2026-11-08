import { useRef } from 'react';
import type { LayoutChangeEvent, ScrollViewInstance, TextInputInstance, TextInputProps } from 'react-native';

const MARGIN = 8;

// Dãy ô nhập trong một ScrollView (tên ở gương mặt, từ ở ghi nhớ từ):
// - bấm "Tiếp" trên bàn phím để sang ô sau, ô cuối thì đóng bàn phím;
// - ô vừa được focus cuộn lên đầu vùng cuộn để không bị bàn phím che.
// Gắn scrollRef vào ScrollView, containerProps vào khung chứa các ô, itemProps vào từng ô, inputProps vào TextInput.
export function useFocusChain(count: number) {
    const scrollRef = useRef<ScrollViewInstance>(null);
    const inputs = useRef<(TextInputInstance | null)[]>([]);
    const containerTop = useRef(0);
    const itemTops = useRef<number[]>([]);

    const reveal = (index: number) =>
        scrollRef.current?.scrollTo({ y: Math.max(0, containerTop.current + (itemTops.current[index] ?? 0) - MARGIN), animated: true });

    return {
        scrollRef,
        containerProps: {
            onLayout: (event: LayoutChangeEvent) => {
                containerTop.current = event.nativeEvent.layout.y;
            },
        },
        itemProps: (index: number) => ({
            onLayout: (event: LayoutChangeEvent) => {
                itemTops.current[index] = event.nativeEvent.layout.y;
            },
        }),
        inputProps: (index: number) => {
            const last = index === count - 1;
            return {
                ref: (input: TextInputInstance | null) => {
                    inputs.current[index] = input;
                },
                returnKeyType: last ? 'done' : 'next',
                submitBehavior: last ? 'blurAndSubmit' : 'submit',
                onSubmitEditing: () => inputs.current[index + 1]?.focus(),
                onFocus: () => reveal(index),
            } satisfies TextInputProps & { ref: (input: TextInputInstance | null) => void };
        },
    };
}
