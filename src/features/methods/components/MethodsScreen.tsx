import { router, type Href } from 'expo-router';
import { ChevronRight, Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { LiveShape } from '@/components/ui/LiveShape';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { GUIDES } from '../guide/content';
import { TONES } from '../guide/GuideScreen';
import { METHODS } from '../methodsData';

const EDGES = { mint: '#a5d6b3', sun: colors.sunDeep, sky: '#a9d3ea' } as const;

// Trang Phương pháp: ba thẻ màu, chạm thẻ để đọc hướng dẫn có trò thử, nút nhỏ để chơi thử ngay
export function MethodsScreen() {
    return (
        <Screen>
            <AppText variant="title">Ba cách để nhớ</AppText>
            <AppText variant="body">Mỗi cách hợp với một kiểu thông tin. Chọn một cách, đọc 2 phút rồi chơi thử.</AppText>

            {METHODS.map((method, i) => {
                const picture = GUIDES[method.id].hero.picture;
                return (
                    <Animated.View entering={enterUp(i + 1)} key={method.id}>
                        <PressableScale
                            onPress={() => router.push(method.guide as Href)}
                            accessibilityRole="button"
                            accessibilityLabel={`${method.name}. ${method.summary}`}
                            style={[styles.card, { backgroundColor: TONES[method.tone], borderBottomColor: EDGES[method.tone] }]}
                        >
                            <View style={styles.head}>
                                <View style={styles.disc}>
                                    <LiveShape art={picture.src} motion={picture.motion} size={48} label={picture.name} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AppText style={styles.step}>Cách {i + 1}</AppText>
                                    <AppText style={styles.name}>{method.name}</AppText>
                                </View>
                                <ChevronRight color={colors.ink} size={24} />
                            </View>
                            <AppText variant="body" style={{ color: colors.ink }}>{method.summary}</AppText>
                            <View style={styles.chips}>
                                <AppText style={styles.chip}>{method.goodFor}</AppText>
                                <AppText style={styles.chip}>{method.level}</AppText>
                            </View>
                        </PressableScale>
                        <PressableScale onPress={() => router.push(method.practice.to as Href)} accessibilityRole="button" style={styles.try}>
                            <Play color={colors.brand} size={16} fill={colors.brand} />
                            <AppText style={styles.tryText}>{method.practice.label}</AppText>
                        </PressableScale>
                    </Animated.View>
                );
            })}
        </Screen>
    );
}

const styles = StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2 },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    disc: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    step: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
    name: { fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 24, color: colors.ink },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
        fontFamily: fonts.semibold,
        fontSize: 12,
        color: colors.ink,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    try: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 4, minHeight: 44 },
    tryText: { fontFamily: fonts.bold, color: colors.brand },
});
