import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { EDGE, fonts, radius } from '@/constants/theme';
import { GAME_ICONS } from '../gameIcons';
import { GAME_META, type GameName } from '../registry';

interface GameTileProps {
    game: GameName;
    level?: number;         // cấp đang mở; bỏ trống khi chưa tải xong luật chơi
    maxLevel?: number;
    note?: string;          // dòng nhỏ thay cho cấp (vd. lý do gợi ý)
    size?: 'large' | 'small';
    style?: StyleProp<ViewStyle>;
}

// Ô trò chơi màu: nền màu của trò, gờ dưới đậm hơn, biểu tượng trắng; chạm để vào trò
export function GameTile({ game, level, maxLevel, note, size = 'small', style }: GameTileProps) {
    const meta = GAME_META[game];
    const Icon = GAME_ICONS[game];
    const large = size === 'large';
    const progress = level && maxLevel ? level / maxLevel : 0;

    return (
        <PressableScale
            onPress={() => router.push(meta.route)}
            accessibilityRole="button"
            accessibilityLabel={`${meta.label}${level ? `, cấp ${level}${maxLevel ? ` trên ${maxLevel}` : ''}` : ''}`}
            style={[styles.tile, large && styles.large, { backgroundColor: meta.color, borderBottomColor: meta.edge }, style]}
        >
            <View style={[styles.badge, large && styles.badgeLarge]}>
                <Icon color="#ffffff" size={large ? 34 : 26} strokeWidth={2.4} />
            </View>
            <View style={{ flex: large ? 1 : undefined, gap: 2 }}>
                <AppText style={[styles.title, large && styles.titleLarge]} numberOfLines={2}>{meta.label}</AppText>
                {note ? <AppText style={styles.note} numberOfLines={2}>{note}</AppText> : null}
                {level ? (
                    <View style={styles.levelRow}>
                        <AppText style={styles.level}>Cấp {level}{maxLevel ? `/${maxLevel}` : ''}</AppText>
                        {maxLevel ? (
                            <View style={styles.track}>
                                <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} />
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>
        </PressableScale>
    );
}

const styles = StyleSheet.create({
    tile: {
        flexGrow: 1,
        flexBasis: '45%',
        minHeight: 132,
        padding: 14,
        gap: 10,
        borderRadius: radius * 1.5,
        borderBottomWidth: EDGE + 2,
        justifyContent: 'space-between',
    },
    large: { flexBasis: '100%', minHeight: 0, flexDirection: 'row', alignItems: 'center', padding: 18, gap: 16 },
    badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
    badgeLarge: { width: 64, height: 64, borderRadius: 32 },
    title: { fontFamily: fonts.extrabold, fontSize: 17, lineHeight: 22, color: '#ffffff' },
    titleLarge: { fontSize: 22, lineHeight: 28 },
    note: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.9)' },
    levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
    level: { fontFamily: fonts.bold, fontSize: 13, color: '#ffffff' },
    track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
    fill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 3 },
});
