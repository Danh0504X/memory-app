import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { ArrowRight, ChevronRight } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { Picture } from './pictures';
import type { GuideContent, Tone } from './types';
import { WOODCUT_CREDIT } from './woodcuts';

export const TONES: Record<Tone, string> = { mint: colors.mint, sun: '#f7dc8e', sky: colors.sky };

// Trang hướng dẫn một phương pháp (bản web: GuidePage), xếp dọc cho điện thoại
export function GuideScreen({ content }: { content: GuideContent }) {
    const scroll = useRef<ScrollViewInstance>(null);
    const trialTop = useRef(0);
    const applyTop = useRef(0);
    const [selected, setSelected] = useState(0);
    const { hero, how, index, trial, history, apply, close } = content;
    const tone = TONES[content.tone];
    const current = index.items[selected];
    const jump = (y: number) => scroll.current?.scrollTo({ y: Math.max(0, y - spacing.md), animated: true });

    return (
        <ScrollView ref={scroll} style={{ backgroundColor: colors.wall }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={[styles.hero, { backgroundColor: tone }]}>
                <View style={styles.heroArt}>
                    <View style={styles.heroDisc}>
                        <Shape picture={hero.picture} size={88} />
                    </View>
                    <Image source={hero.woodcut.src} style={styles.heroWoodcut} contentFit="contain" accessibilityLabel={hero.woodcut.alt} />
                </View>
                <AppText variant="title">{content.title}</AppText>
                <AppText variant="body">{content.lead}</AppText>
                <Button title="Chơi thử ngay" onPress={() => jump(trialTop.current)} />
                <Pressable onPress={() => jump(applyTop.current)} accessibilityRole="button" hitSlop={8}>
                    <AppText variant="small" style={styles.link}>Dùng trong trò chơi nào?</AppText>
                </Pressable>
            </View>

            <Section title={how.title}>
                <AppText variant="body">{how.intro}</AppText>
                <View style={styles.flow}>
                    <View style={styles.flowRow}>
                        {how.loose.map((picture, i) => (
                            <View key={`${picture.name}-${i}`} style={{ transform: [{ rotate: `${((i * 37) % 30) - 15}deg` }] }}>
                                <Shape picture={picture} size={32} />
                            </View>
                        ))}
                    </View>
                    <ArrowRight color={colors.inkSoft} size={20} style={{ alignSelf: 'center' }} />
                    <View style={styles.flowRow}>
                        {how.ordered.map(({ picture, label }, i) => (
                            <View key={`${label}-${i}`} style={styles.ordered}>
                                <View style={[styles.orderedDisc, { backgroundColor: tone }]}>
                                    <Shape picture={picture} size={36} />
                                </View>
                                <AppText variant="small" style={styles.orderedLabel}>{label}</AppText>
                            </View>
                        ))}
                    </View>
                </View>
                {how.steps.map((step, i) => (
                    <View key={step.name} style={styles.step}>
                        <View style={[styles.stepNo, { backgroundColor: tone }]}>
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
                        <Pressable
                            key={item.name}
                            onPress={() => setSelected(i)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: i === selected }}
                            style={[styles.name, i === selected && { borderColor: colors.brand, backgroundColor: tone }]}
                        >
                            <AppText variant="small" style={styles.nameText}>{item.name}</AppText>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={[styles.stage, { backgroundColor: tone }]}>{current.art}</View>
                <AppText variant="body" accessibilityLiveRegion="polite">
                    <AppText style={styles.strong}>{current.name}. </AppText>
                    {current.fact}
                </AppText>
            </Section>

            <View onLayout={(event) => (trialTop.current = event.nativeEvent.layout.y)} style={{ gap: spacing.sm }}>
                <AppText variant="heading" accessibilityRole="header">{trial.title}</AppText>
                <AppText variant="body">{trial.intro}</AppText>
                {trial.game}
            </View>

            <Section title={history.title}>
                <AppText variant="body">{history.text}</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plates}>
                    {history.woodcuts.map((woodcut) => (
                        <View key={woodcut.source + woodcut.caption} style={styles.plate}>
                            <Image source={woodcut.src} style={styles.plateImage} contentFit="contain" accessibilityLabel={woodcut.alt} />
                            <AppText variant="small" style={styles.caption}>{woodcut.caption}</AppText>
                            <Pressable onPress={() => void Linking.openURL(woodcut.source)} accessibilityRole="link" hitSlop={6}>
                                <AppText variant="small" style={styles.link}>Ảnh gốc</AppText>
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>
                <AppText variant="small" style={styles.credit}>{WOODCUT_CREDIT}</AppText>
            </Section>

            <View onLayout={(event) => (applyTop.current = event.nativeEvent.layout.y)} style={{ gap: spacing.md }}>
                <AppText variant="heading" accessibilityRole="header">{apply.title}</AppText>
                {apply.groups.map((group) => (
                    <View key={group.name} style={{ gap: spacing.sm }}>
                        <AppText style={styles.groupName}>{group.name}</AppText>
                        {group.items.map((item) => {
                            const Art = item.art.src;
                            const body = (
                                <>
                                    <View style={[styles.applyArt, { backgroundColor: `${item.art.color}22` }]}>
                                        <Art width={36} height={36} />
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
                                <Pressable
                                    key={item.name}
                                    onPress={() => router.push(item.to as Href)}
                                    accessibilityRole="button"
                                    style={({ pressed }) => [styles.applyItem, pressed && { opacity: 0.85 }]}
                                >
                                    {body}
                                </Pressable>
                            ) : (
                                <View key={item.name} style={styles.applyItem}>{body}</View>
                            );
                        })}
                    </View>
                ))}
            </View>

            <View style={[styles.close, { backgroundColor: tone }]}>
                <Shape picture={close.picture} size={72} />
                <AppText variant="heading">{close.line}</AppText>
                <AppText variant="body">{close.text}</AppText>
                <AppText variant="small" style={styles.strong}>{close.fact}</AppText>
                <Button title={close.action.label} onPress={() => router.push(close.action.to as Href)} />
                <Pressable onPress={() => router.replace(close.next.to as Href)} accessibilityRole="link" hitSlop={8}>
                    <AppText variant="small" style={styles.link}>{close.next.label} →</AppText>
                </Pressable>
            </View>
        </ScrollView>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={styles.section}>
            <AppText variant="heading" accessibilityRole="header">{title}</AppText>
            {children}
        </View>
    );
}

function Shape({ picture, size }: { picture: Picture; size: number }) {
    const Art = picture.src;
    return <Art width={size} height={size} />;
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
    hero: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5 },
    heroArt: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
    heroDisc: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    heroWoodcut: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.white },
    link: { fontFamily: fonts.bold, color: colors.brandDeep, textDecorationLine: 'underline' },
    section: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    flow: { gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.wall },
    flowRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
    ordered: { alignItems: 'center', gap: 2 },
    orderedDisc: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    orderedLabel: { fontFamily: fonts.semibold, color: colors.ink, fontSize: 12 },
    step: { flexDirection: 'row', gap: spacing.sm },
    stepNo: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    stepNoText: { fontFamily: fonts.extrabold, fontSize: 14 },
    strong: { fontFamily: fonts.bold, color: colors.ink },
    names: { gap: spacing.sm },
    name: { minHeight: 40, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, justifyContent: 'center', backgroundColor: colors.white },
    nameText: { fontFamily: fonts.semibold, color: colors.ink },
    stage: { minHeight: 170, borderRadius: radius * 1.5, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
    plates: { gap: spacing.md },
    plate: { width: 150, gap: 4 },
    plateImage: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.wall },
    caption: { color: colors.ink },
    credit: { fontSize: 11, lineHeight: 15 },
    groupName: { fontFamily: fonts.bold, color: colors.brandDeep },
    applyItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    applyArt: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    note: { color: colors.brandDeep, fontFamily: fonts.semibold },
    close: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5 },
});
