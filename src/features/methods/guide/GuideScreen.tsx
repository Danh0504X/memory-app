import { router, type Href } from 'expo-router';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LiveShape } from '@/components/ui/LiveShape';
import { PressableScale } from '@/components/ui/PressableScale';
import { ease, enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import type { GuideContent, Tone } from './types';

export const TONES: Record<Tone, string> = { mint: colors.mint, sun: '#f7dc8e', sky: colors.sky };
// Gờ dưới đậm hơn nền của từng tông (thẻ "dày")
export const TONE_EDGES: Record<Tone, string> = { mint: '#a5d6b3', sun: colors.sunDeep, sky: '#a9d3ea' };

// Trang hướng dẫn một phương pháp, bản gọn cho điện thoại: cách làm, ví dụ, chơi thử, dùng ở đâu
export function GuideScreen({ content }: { content: GuideContent }) {
    const scroll = useRef<ScrollViewInstance>(null);
    const trialTop = useRef(0);
    const [selected, setSelected] = useState(0);
    const { hero, how, index, trial, apply, close } = content;
    const tone = TONES[content.tone];
    const edge = TONE_EDGES[content.tone];
    const current = index.items[selected];
    const jump = (y: number) => scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });

    return (
        <ScrollView ref={scroll} style={{ backgroundColor: colors.wall }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Animated.View entering={enterUp(0)} style={[styles.hero, { backgroundColor: tone, borderBottomColor: edge }]}>
                <View style={styles.heroDisc}>
                    <LiveShape art={hero.picture.src} motion={hero.picture.motion} size={88} label={hero.picture.name} tappable />
                </View>
                <AppText style={styles.heroTitle}>{content.title}</AppText>
                <AppText variant="body" style={{ color: colors.ink, textAlign: 'center' }}>{content.lead}</AppText>
                <Button title="Chơi thử ngay" onPress={() => jump(trialTop.current)} style={{ alignSelf: 'stretch' }} />
            </Animated.View>

            <Section title={how.title}>
                <AppText variant="body">{how.intro}</AppText>
                <View style={[styles.flow, { backgroundColor: tone }]}>
                    <View style={styles.flowRow}>
                        {how.loose.map((picture, i) => {
                            const Art = picture.src;
                            return (
                                <View key={`${picture.name}-${i}`} style={{ transform: [{ rotate: `${((i * 37) % 30) - 15}deg` }] }}>
                                    <Art width={32} height={32} />
                                </View>
                            );
                        })}
                    </View>
                    <ArrowRight color={colors.ink} size={20} style={{ alignSelf: 'center', transform: [{ rotate: '90deg' }] }} />
                    <View style={styles.flowRow}>
                        {how.ordered.map(({ picture, label }, i) => (
                            <View key={`${label}-${i}`} style={styles.ordered}>
                                <View style={styles.orderedDisc}>
                                    <LiveShape art={picture.src} motion={picture.motion} size={36} />
                                </View>
                                <AppText style={styles.orderedLabel}>{label}</AppText>
                            </View>
                        ))}
                    </View>
                </View>
                {how.steps.map((step, i) => (
                    <View key={step.name} style={styles.step}>
                        <View style={[styles.stepNo, { backgroundColor: tone, borderBottomColor: edge }]}>
                            <AppText style={styles.stepNoText}>{i + 1}</AppText>
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <AppText style={styles.strong}>{step.name}</AppText>
                            <AppText variant="small">{step.text}</AppText>
                        </View>
                    </View>
                ))}
            </Section>

            <Section title={index.title}>
                <AppText variant="small">{index.hint}</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.names}>
                    {index.items.map((item, i) => (
                        <PressableScale
                            key={item.name}
                            onPress={() => setSelected(i)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: i === selected }}
                            style={[styles.name, i === selected && { borderColor: edge, backgroundColor: tone }]}
                        >
                            <AppText style={styles.nameText}>{item.name}</AppText>
                        </PressableScale>
                    ))}
                </ScrollView>
                <Animated.View key={selected} entering={FadeIn.duration(220).easing(ease.ui)} style={[styles.stage, { backgroundColor: tone }]}>
                    {current.art}
                </Animated.View>
                <AppText variant="body" accessibilityLiveRegion="polite">
                    <AppText style={styles.strong}>{current.name}. </AppText>
                    {current.fact}
                </AppText>
            </Section>

            <View onLayout={(event) => (trialTop.current = event.nativeEvent.layout.y)} style={{ gap: spacing.sm }}>
                <AppText style={styles.sectionTitle} accessibilityRole="header">{trial.title}</AppText>
                <AppText variant="body">{trial.intro}</AppText>
                {trial.game}
            </View>

            <View style={{ gap: spacing.sm }}>
                <AppText style={styles.sectionTitle} accessibilityRole="header">{apply.title}</AppText>
                {apply.groups.map((group) => (
                    <View key={group.name} style={{ gap: spacing.sm }}>
                        <AppText style={styles.groupName}>{group.name}</AppText>
                        {group.items.map((item) => {
                            const Art = item.art.src;
                            const body = (
                                <>
                                    <View style={[styles.applyArt, { backgroundColor: `${item.art.color}22` }]}>
                                        <Art width={34} height={34} />
                                    </View>
                                    <View style={{ flex: 1, gap: 2 }}>
                                        <AppText style={styles.strong}>
                                            {item.name} <AppText variant="small" style={{ color: item.art.color }}>· {item.fact}</AppText>
                                        </AppText>
                                        <AppText variant="small">{item.text}</AppText>
                                        {item.note ? <AppText variant="small" style={styles.note}>{item.note}</AppText> : null}
                                    </View>
                                    {item.to ? <ChevronRight color={colors.inkSoft} size={20} /> : null}
                                </>
                            );
                            return item.to ? (
                                <PressableScale key={item.name} onPress={() => router.push(item.to as Href)} accessibilityRole="button" style={styles.applyItem}>
                                    {body}
                                </PressableScale>
                            ) : (
                                <View key={item.name} style={styles.applyItem}>{body}</View>
                            );
                        })}
                    </View>
                ))}
            </View>

            <View style={[styles.close, { backgroundColor: tone, borderBottomColor: edge }]}>
                <LiveShape art={close.picture.src} motion={close.motion} size={72} label={close.picture.name} tappable />
                <AppText style={styles.closeTitle}>{close.line}</AppText>
                <AppText variant="body" style={{ color: colors.ink, textAlign: 'center' }}>{close.text}</AppText>
                <AppText variant="small" style={[styles.strong, { textAlign: 'center' }]}>{close.fact}</AppText>
                <Button title={close.action.label} onPress={() => router.push(close.action.to as Href)} style={{ alignSelf: 'stretch' }} />
                <Pressable onPress={() => router.replace(close.next.to as Href)} accessibilityRole="link" hitSlop={8} style={styles.nextLink}>
                    <AppText style={styles.link}>{close.next.label} →</AppText>
                </Pressable>
            </View>
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <AppText style={styles.sectionTitle} accessibilityRole="header">{title}</AppText>
            {children}
        </View>
    );
}

const THICK = { borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge } as const;

const styles = StyleSheet.create({
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
    hero: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2 },
    heroDisc: { width: 128, height: 128, borderRadius: 64, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, color: colors.ink, textAlign: 'center' },
    link: { fontFamily: fonts.bold, color: colors.brandDeep },
    nextLink: { minHeight: 44, justifyContent: 'center' },
    section: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, ...THICK },
    sectionTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
    flow: { gap: spacing.sm, padding: spacing.md, borderRadius: radius },
    flowRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
    ordered: { alignItems: 'center', gap: 2 },
    orderedDisc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
    orderedLabel: { fontFamily: fonts.bold, color: colors.ink, fontSize: 12, lineHeight: 16 },
    step: { flexDirection: 'row', gap: spacing.sm },
    stepNo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 },
    stepNoText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink },
    strong: { fontFamily: fonts.bold, color: colors.ink },
    names: { gap: spacing.sm, paddingBottom: 2 },
    name: { minHeight: 44, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: colors.white, ...THICK },
    nameText: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
    stage: { minHeight: 170, borderRadius: radius * 1.5, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
    groupName: { fontFamily: fonts.bold, color: colors.brandDeep },
    applyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.25, backgroundColor: colors.white, ...THICK },
    applyArt: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    note: { color: colors.brandDeep, fontFamily: fonts.semibold },
    close: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2 },
    closeTitle: { fontFamily: fonts.extrabold, fontSize: 20, lineHeight: 26, color: colors.ink, textAlign: 'center' },
});
