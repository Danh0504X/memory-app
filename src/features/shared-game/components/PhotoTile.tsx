import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { MemioMark } from '@/components/ui/MemioMark';
import { colors } from '@/constants/theme';

const cornerRadius = (width: number) => Math.max(6, width * 0.08);

// Ảnh vuông từ backend (game hình ảnh, gương mặt). Store đã tải trước vào cache (Image.prefetch)
// nên ảnh hiện ngay khi vào phase ghi nhớ.
export function PhotoTile({ uri, width, label }: { uri: string; width: number; label: string }) {
    return (
        <Image
            source={{ uri }}
            style={[styles.photo, { width, height: width, borderRadius: cornerRadius(width) }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={120}
            accessibilityLabel={label}
        />
    );
}

// Ảnh chưa xem: úp mặt vàng như lá bài
export function PhotoBack({ width }: { width: number }) {
    return (
        <View style={[styles.photo, styles.back, { width, height: width, borderRadius: cornerRadius(width) }]}>
            <MemioMark size={width * 0.42} />
        </View>
    );
}

const styles = StyleSheet.create({
    photo: { backgroundColor: colors.step, overflow: 'hidden' },
    back: { backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2b13c' },
});
