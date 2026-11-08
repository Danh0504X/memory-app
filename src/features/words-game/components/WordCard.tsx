import { StyleSheet, Text, View } from 'react-native';
import { MemioMark } from '@/components/ui/MemioMark';
import { colors, fonts, radius } from '@/constants/theme';

// Thẻ từ: số thứ tự ở góc, từ ở giữa; chữ tự thu nhỏ để từ dài (tiếng Nga, tiếng Pháp) vẫn nằm gọn
export function WordCard({ word, index, width, height }: { word: string; index: number; width: number; height: number }) {
    const fontSize = Math.min(height * 0.32, width * 0.16);
    return (
        <View style={[styles.card, { width, height }]} accessible accessibilityLabel={`Từ ${index}: ${word}`}>
            <Text style={[styles.index, { fontSize: Math.max(10, fontSize * 0.42) }]}>{index}</Text>
            <Text style={[styles.word, { fontSize }]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.5}>
                {word}
            </Text>
        </View>
    );
}

// Từ chưa xem: úp mặt vàng như lá bài
export function WordBack({ width, height }: { width: number; height: number }) {
    return (
        <View style={[styles.card, styles.back, { width, height }]}>
            <MemioMark size={Math.min(width, height) * 0.5} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: radius,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#d9e2db',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        shadowColor: '#1f2937',
        shadowOpacity: 0.08,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    back: { backgroundColor: colors.sun, borderColor: '#e2b13c' },
    index: { position: 'absolute', top: 4, left: 8, fontFamily: fonts.bold, color: colors.inkSoft },
    word: { fontFamily: fonts.extrabold, color: colors.ink, textAlign: 'center' },
});
