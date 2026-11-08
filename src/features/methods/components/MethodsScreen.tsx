import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { LiveShape } from '@/components/ui/LiveShape';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { GUIDES } from '../guide/content';
import { TONES } from '../guide/GuideScreen';
import { METHODS } from '../methodsData';

// Trang Phương pháp: ba cách nhớ, mỗi cách một thẻ màu dẫn tới hướng dẫn có trò thử, rồi bảng so sánh nhanh
export function MethodsScreen() {
    return (
        <ScrollView style={{ backgroundColor: colors.wall }} contentContainerStyle={styles.content}>
            <AppText variant="title">Ba cách để nhớ</AppText>
            <AppText variant="lead">Mỗi cách hợp với một kiểu thông tin. Chọn cách hợp với điều bạn hay phải nhớ, đọc hướng dẫn rồi chơi thử ngay.</AppText>

            {METHODS.map((method, i) => {
                const picture = GUIDES[method.id].hero.picture;
                return (
                    <Animated.View entering={enterUp(i + 1)} key={method.id} style={[styles.chapter, { backgroundColor: TONES[method.tone] }]}>
                        <View style={styles.chapterHead}>
                            <View style={styles.disc}>
                                <LiveShape art={picture.src} motion={picture.motion} size={44} label={picture.name} tappable />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="small" style={styles.island}>{method.island}</AppText>
                                <AppText variant="heading">{method.name}</AppText>
                            </View>
                        </View>
                        <AppText variant="body">{method.lead}</AppText>
                        {method.steps.map((step, i) => (
                            <AppText key={step} variant="small" style={styles.step}>
                                {i + 1}. {step}
                            </AppText>
                        ))}
                        <AppText variant="small" style={styles.example}>Ví dụ: {method.example}</AppText>
                        <Button title="Hướng dẫn và chơi thử" onPress={() => router.push(method.guide as Href)} />
                    </Animated.View>
                );
            })}

            <Panel title="So sánh nhanh">
                {METHODS.map((method) => (
                    <View key={method.id} style={styles.compareRow}>
                        <View style={[styles.dot, { backgroundColor: TONES[method.tone] }]} />
                        <View style={{ flex: 1, gap: 2 }}>
                            <AppText style={styles.strong}>{method.name}</AppText>
                            <AppText variant="small">Hợp để nhớ: {method.goodFor}</AppText>
                            <AppText variant="small">Bắt đầu với: {method.startWith}</AppText>
                            <AppText variant="small">Độ khó: {method.level}</AppText>
                        </View>
                    </View>
                ))}
            </Panel>

            <AppText variant="body">Đã chọn được cách? Thử dùng nó trong một ván chơi.</AppText>
            <Button title="Chọn trò chơi" variant="secondary" onPress={() => router.navigate('/games')} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    chapter: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5 },
    chapterHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    disc: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    island: { fontFamily: fonts.bold, color: colors.brandDeep, textTransform: 'uppercase' },
    step: { color: colors.ink },
    example: { fontStyle: 'italic' },
    compareRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.step },
    dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
    strong: { fontFamily: fonts.bold, color: colors.ink },
});
