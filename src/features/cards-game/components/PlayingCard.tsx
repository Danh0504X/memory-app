import { StyleSheet, Text, View } from 'react-native';
import { MemioMark } from '@/components/ui/MemioMark';
import { colors, fonts } from '@/constants/theme';
import type { Card } from '../types/types';
import { cardLabel, SUIT_SYMBOLS } from '../utils/cardLabels';

// Tỉ lệ lá bài thật (cao / rộng)
export const CARD_RATIO = 1.4;
// Từ bề rộng này trở lên vẽ lá đầy đủ (số ở hai góc, chất ở giữa); nhỏ hơn thì xếp số trên chất dưới
const FULL_FACE_WIDTH = 80;

const RED = '#c62828';

// Lá bài trắng; cỡ chữ tính theo bề rộng nên dùng được từ dải lá nhỏ tới lá lớn khi ghi nhớ
export function PlayingCard({ card, width }: { card: Card; width: number }) {
    const color = card.suit === 'hearts' || card.suit === 'diamonds' ? RED : colors.ink;
    const symbol = SUIT_SYMBOLS[card.suit];
    const frame = { width, height: width * CARD_RATIO, borderRadius: Math.max(4, width * 0.1) };

    if (width < FULL_FACE_WIDTH) {
        return (
            <View style={[styles.card, frame, styles.center]} accessible accessibilityRole="image" accessibilityLabel={cardLabel(card)}>
                <Text style={[styles.rank, { color, fontSize: width * 0.38 }]}>{card.rank}</Text>
                <Text style={[styles.symbol, { color, fontSize: width * 0.36 }]}>{symbol}</Text>
            </View>
        );
    }

    const corner = { color, fontSize: width * 0.16, lineHeight: width * 0.18 };
    return (
        <View style={[styles.card, frame]} accessible accessibilityRole="image" accessibilityLabel={cardLabel(card)}>
            <View style={[styles.corner, { top: width * 0.06, left: width * 0.08 }]}>
                <Text style={[styles.rank, corner]}>{card.rank}</Text>
                <Text style={[styles.symbol, corner]}>{symbol}</Text>
            </View>
            <View style={[StyleSheet.absoluteFill, styles.center]}>
                <Text style={[styles.symbol, { color, fontSize: width * 0.5 }]}>{symbol}</Text>
            </View>
            <View style={[styles.corner, styles.flipped, { bottom: width * 0.06, right: width * 0.08 }]}>
                <Text style={[styles.rank, corner]}>{card.rank}</Text>
                <Text style={[styles.symbol, corner]}>{symbol}</Text>
            </View>
        </View>
    );
}

// Mặt sau vàng mang dấu Memio, như bản web
export function CardBack({ width }: { width: number }) {
    return (
        <View style={[styles.card, styles.back, styles.center, { width, height: width * CARD_RATIO, borderRadius: Math.max(4, width * 0.1) }]}>
            <MemioMark size={width * 0.42} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: '#d9e2db',
        overflow: 'hidden',
        shadowColor: '#1f2937',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
    },
    back: { backgroundColor: colors.sun, borderColor: '#e2b13c' },
    center: { alignItems: 'center', justifyContent: 'center' },
    corner: { position: 'absolute', alignItems: 'center' },
    flipped: { transform: [{ rotate: '180deg' }] },
    rank: { fontFamily: fonts.extrabold, includeFontPadding: false },
    symbol: { fontFamily: fonts.regular, includeFontPadding: false },
});
