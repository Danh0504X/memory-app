import { router, type Href } from 'expo-router';
import { Check, ChevronRight, Flame, Flag, Gamepad2, Lightbulb, Sparkles, Star, Target, Trophy, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState, type FC } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import celebrating from '@/assets/memio/mascot-celebrating.svg';
import mascot from '@/assets/memio/mascot.svg';
import lociArt from '@/assets/memio/methods/method-loci.svg';
import numbersArt from '@/assets/memio/methods/method-numbers.svg';
import storyArt from '@/assets/memio/methods/method-story.svg';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LiveShape } from '@/components/ui/LiveShape';
import { BlockState, Panel } from '@/components/ui/Panel';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { GAME_IDS, GAME_META } from '@/features/dashboard/constants';
import { PROFILE_KEY, useProfile, useRecentSessions } from '@/features/dashboard/hooks/useOverview';
import type { GameSession } from '@/features/dashboard/types';
import { PROGRESS_TIME_ZONE, dayKey, formatWeekday, lastDays } from '@/features/dashboard/utils/format';
import { HomeScreen } from '@/features/home/HomeScreen';
import { TONES, TONE_EDGES } from '@/features/methods/guide/GuideScreen';
import { METHODS, type Method, type MethodId } from '@/features/methods/methodsData';
import { profileApi, type UserProfile } from '@/features/profile/api/profile.api';
import { formatNumber, getLevelProgress } from '@/features/profile/utils/profileProgress';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { setQuery } from '@/lib/queryCache';
import { appStorage } from '@/lib/storage';
import { METHOD_FOR_GAME, daysUntilExam, examLine, recommendGame, roundsPerDay } from '../utils/personalize';
import { TIPS, dailyGoals, greet, pickOfDay, sessionsOfDay } from '../utils/today';

const timeZone = PROGRESS_TIME_ZONE;
const WEEKDAY_LETTERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const METHOD_ART: Record<MethodId, FC<SvgProps>> = { story: storyArt, numbers: numbersArt, loci: lociArt };
// Ngày đã "khởi động" (mở bài thực hành của cách ôn hôm nay): backend không ghi nên giữ trên máy
const WARM_KEY = 'memio.warmupDay';
// Đường đi zig-zag: mỗi bước lệch sang phải một chút rồi quay lại
const PATH_OFFSETS = [0, 44, 80, 44, 0];

export function TodayScreen() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // Khách thấy trang chủ giới thiệu Memio, người đã đăng nhập thấy việc hôm nay
    return isAuthenticated ? <MemberToday /> : <HomeScreen />;
}

interface PathStep {
    id: string;
    label: string;
    hint: string;
    icon: LucideIcon;
    done: boolean;
    onPress: () => void;
}

// Màn chính của người đã đăng nhập: lộ trình việc hôm nay, cách ôn hợp với ván gợi ý, nhịp tuần này.
function MemberToday() {
    const profile = useProfile();
    const recent = useRecentSessions();
    const daily = useDailyChallenge();
    const [skipping, setSkipping] = useState(false);
    const todayKey = dayKey(new Date(), timeZone);
    const [warmedUp, setWarmedUp] = useState(() => appStorage.getItem(WARM_KEY) === todayKey);

    const { reload: reloadProfile } = profile;
    const { reload: reloadRecent } = recent;
    const { reload: reloadDaily } = daily;
    const requests = [profile, recent, daily];
    const reloadAll = () => requests.forEach((request) => request.refresh());
    const refreshing = requests.some((request) => request.refreshing);
    // Nộp xong một ván: EXP, chuỗi ngày, lộ trình và thử thách đều đổi
    useEffect(
        () =>
            onGameSessionRecorded(() => {
                reloadProfile();
                reloadRecent();
                reloadDaily();
            }),
        [reloadProfile, reloadRecent, reloadDaily],
    );

    const sessions = recent.state.status === 'ready' ? recent.state.data : null;
    const profileData = profile.state.status === 'ready' ? profile.state.data : null;
    const hello = profileData ? greet(profileData, sessions, timeZone) : null;
    const preferences = profileData?.preferences ?? null;
    const { game: recommended } = recommendGame(sessions, preferences, GAME_IDS);
    const method = METHODS.find((item) => item.id === METHOD_FOR_GAME[recommended]) ?? METHODS[0];
    const date = formatWeekday(new Date(), timeZone);
    const exam = examLine(daysUntilExam(preferences, todayKey), roundsPerDay(preferences));
    // Chưa trả lời cũng chưa bỏ qua câu hỏi mục tiêu thì hỏi một lần ở đây
    const askGoals = preferences?.status === 'unset';

    const warmUp = () => {
        appStorage.setItem(WARM_KEY, todayKey);
        setWarmedUp(true);
        router.push(method.practice.to as Href);
    };

    const skipGoals = async () => {
        setSkipping(true);
        try {
            const { data } = await profileApi.skipPreferences();
            setQuery(PROFILE_KEY, data.profile);
            reloadProfile();
        } catch {
            // Không lưu được thì lần sau hỏi lại; không chặn người dùng
        } finally {
            setSkipping(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reloadAll} tintColor={colors.brand} />}>
                <Animated.View entering={enterUp(0)} style={{ gap: spacing.sm }}>
                    <View style={styles.header}>
                        <View style={{ flex: 1, gap: 2 }}>
                            <AppText variant="small" style={styles.date}>{date.charAt(0).toUpperCase() + date.slice(1)}</AppText>
                            <AppText variant="title" numberOfLines={2}>{hello?.title ?? 'Chào bạn'}</AppText>
                        </View>
                        {profileData ? (
                            <View style={{ gap: 6, alignItems: 'flex-end' }}>
                                <View style={[styles.pill, styles.streakPill, profileData.playedToday && styles.streakOn]} accessibilityLabel={`Chuỗi ${profileData.streaks} ngày`}>
                                    <Flame color={profileData.playedToday ? colors.white : '#e8590c'} size={18} />
                                    <AppText style={[styles.pillText, { color: profileData.playedToday ? colors.white : '#e8590c' }]}>{profileData.streaks}</AppText>
                                </View>
                                <View style={[styles.pill, styles.levelPill]} accessibilityLabel={`Cấp ${profileData.level.level}`}>
                                    <Star color={colors.sunDeep} size={16} fill={colors.sun} />
                                    <AppText style={[styles.pillText, { color: '#8a6100' }]}>{profileData.level.level}</AppText>
                                </View>
                            </View>
                        ) : null}
                    </View>
                    {hello ? <AppText variant="body" style={hello.urgent ? styles.urgent : null}>{hello.line}</AppText> : null}
                    {exam ? (
                        <View style={[styles.banner, exam.urgent && styles.bannerUrgent]}>
                            <AppText style={styles.bannerText}>{exam.text}</AppText>
                        </View>
                    ) : null}
                </Animated.View>

                {askGoals ? (
                    <Panel title="Bạn luyện trí nhớ để làm gì?" style={styles.ask}>
                        <AppText variant="body">Chọn mục tiêu để Memio gợi ý đúng trò và số ván mỗi ngày.</AppText>
                        <Button title="Chọn mục tiêu" onPress={() => router.push('/goals')} />
                        <Button title="Bỏ qua" variant="secondary" loading={skipping} onPress={() => void skipGoals()} />
                    </Panel>
                ) : null}

                <BlockState request={recent.state} onRetry={reloadRecent}>
                    {(data) => {
                        const goals = dailyGoals(sessionsOfDay(data, timeZone), recommended, preferences);
                        const challenge = daily.state.status === 'ready' ? daily.state.data.challenge : null;
                        const steps: PathStep[] = [
                            { id: 'warm', label: 'Khởi động 1 phút', hint: method.name, icon: Sparkles, done: warmedUp, onPress: warmUp },
                            ...goals.map((goal) => ({
                                id: goal.id,
                                label: goal.label,
                                hint:
                                    goal.id === 'daily'
                                        ? challenge
                                            ? `${GAME_META[challenge.gameName].label} · ${challenge.players} người đã chơi`
                                            : 'Một đề cho mọi người'
                                        : `Gợi ý: ${GAME_META[recommended].label}`,
                                icon: goal.id === 'daily' ? Trophy : goal.id === 'pass' ? Target : Gamepad2,
                                done: goal.done,
                                onPress: () => router.push(goal.to as Href),
                            })),
                        ];
                        return (
                            <Animated.View entering={enterUp(1)}>
                                <TodayPath steps={steps} />
                            </Animated.View>
                        );
                    }}
                </BlockState>

                <Animated.View entering={enterUp(2)}>
                    <MethodOfDay method={method} gameLabel={GAME_META[recommended].label} onPractice={warmUp} />
                </Animated.View>

                <BlockState request={profile.state} onRetry={reloadProfile}>
                    {(data) => (
                        <Animated.View entering={enterUp(3)}>
                            <WeekCard profile={data} sessions={sessions} />
                        </Animated.View>
                    )}
                </BlockState>
            </ScrollView>
        </SafeAreaView>
    );
}

// Lộ trình hôm nay: các việc nối thành đường zig-zag, linh vật đứng ở việc đang làm, xong hết thì ăn mừng ở đích
function TodayPath({ steps }: { steps: PathStep[] }) {
    const doneCount = steps.filter((step) => step.done).length;
    const current = steps.findIndex((step) => !step.done);
    const allDone = current === -1;

    return (
        <View style={styles.path}>
            <View style={styles.pathHead}>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.pathTitle}>Lộ trình hôm nay</AppText>
                    <AppText variant="small">{allDone ? 'Xong hết rồi, giỏi lắm! Hẹn bạn ngày mai.' : `Còn ${steps.length - doneCount} việc nữa là về đích.`}</AppText>
                </View>
                <ProgressRing value={doneCount / steps.length} size={56} stroke={7}>
                    <AppText style={styles.ringText}>{doneCount}/{steps.length}</AppText>
                </ProgressRing>
            </View>

            {steps.map((step, i) => (
                <View key={step.id}>
                    {i > 0 ? <Connector from={offsetAt(i - 1)} to={offsetAt(i)} done={steps[i - 1].done} /> : null}
                    <PathNode step={step} offset={offsetAt(i)} current={i === current} />
                </View>
            ))}

            <Connector from={offsetAt(steps.length - 1)} to={offsetAt(steps.length)} done={allDone} />
            <View style={[styles.finish, { marginLeft: offsetAt(steps.length) }]}>
                <View style={[styles.node, allDone ? styles.finishDone : styles.nodeLocked]}>
                    {allDone ? <LiveShape art={celebrating} motion="hop" size={46} label="Linh vật ăn mừng" /> : <Flag color={colors.inkSoft} size={24} />}
                </View>
                <AppText style={[styles.stepLabel, !allDone && { color: colors.inkSoft }]}>Về đích</AppText>
            </View>
        </View>
    );
}

const NODE = 60;
const offsetAt = (index: number) => PATH_OFFSETS[index % PATH_OFFSETS.length];

// Ba chấm nối từ bước trước xuống bước sau, nằm giữa hai tâm nút; bước trước xong thì tô màu
function Connector({ from, to, done }: { from: number; to: number; done: boolean }) {
    return (
        <View style={[styles.connector, { marginLeft: (from + to) / 2 + NODE / 2 - 3 }]}>
            {[0, 1, 2].map((dot) => (
                <View key={dot} style={[styles.dot, done && styles.dotDone]} />
            ))}
        </View>
    );
}

function PathNode({ step, offset, current }: { step: PathStep; offset: number; current: boolean }) {
    const Icon = step.icon;
    return (
        <PressableScale
            onPress={step.onPress}
            disabled={step.done}
            accessibilityRole="button"
            accessibilityState={{ checked: step.done }}
            accessibilityLabel={`${step.label}${step.done ? ', đã xong' : ''}`}
            style={[styles.step, { marginLeft: offset }]}
        >
            <View>
                {current ? <NodePulse /> : null}
                <View style={[styles.node, step.done ? styles.nodeDone : current ? styles.nodeCurrent : styles.nodeLocked]}>
                    {step.done ? <Check color={colors.white} size={28} strokeWidth={3} /> : <Icon color={current ? colors.brand : colors.inkSoft} size={26} strokeWidth={2.4} />}
                </View>
            </View>
            <View style={{ flex: 1 }}>
                <AppText style={[styles.stepLabel, step.done && styles.stepDone]} numberOfLines={2}>{step.label}</AppText>
                <AppText variant="small" numberOfLines={1}>{step.hint}</AppText>
            </View>
            {current ? <LiveShape art={mascot} motion="hop" size={44} label="Linh vật Memio" /> : null}
        </PressableScale>
    );
}

// Vòng sáng nhấp nháy quanh việc đang làm; giảm chuyển động thì đứng yên
function NodePulse() {
    const reduceMotion = useReducedMotion();
    const pulse = useSharedValue(1);
    useEffect(() => {
        if (!reduceMotion) pulse.value = withRepeat(withTiming(1.18, { duration: 900, easing: Easing.out(Easing.quad) }), -1, true);
    }, [pulse, reduceMotion]);
    const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2.2 - pulse.value * 1.6 }));
    return <Animated.View pointerEvents="none" style={[styles.pulse, ring]} />;
}

// Cách ôn hôm nay: cách nhớ hợp với trò được gợi ý, kèm mẹo trong ngày
function MethodOfDay({ method, gameLabel, onPractice }: { method: Method; gameLabel: string; onPractice: () => void }) {
    const Art = METHOD_ART[method.id];
    return (
        <View style={[styles.method, { backgroundColor: TONES[method.tone], borderBottomColor: TONE_EDGES[method.tone] }]}>
            <AppText style={styles.overline}>Cách ôn hôm nay · hợp với {gameLabel}</AppText>
            <View style={styles.methodHead}>
                <View style={styles.methodArt}>
                    <Art width={56} height={56} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <AppText style={styles.methodName}>{method.name}</AppText>
                    <AppText variant="small" style={{ color: colors.ink }}>{method.summary}</AppText>
                </View>
            </View>
            <View style={styles.methodActions}>
                <Button title="Đọc cách làm" variant="secondary" onPress={() => router.push(method.guide as Href)} style={{ flex: 1 }} />
                <Button title="Thử 1 phút" onPress={onPractice} style={{ flex: 1 }} />
            </View>
            <View style={styles.tip}>
                <Lightbulb color={colors.sunDeep} size={18} />
                <AppText variant="small" style={{ flex: 1, color: colors.ink }}>{pickOfDay(TIPS)}</AppText>
            </View>
        </View>
    );
}

// Tuần này: 7 ngày gần nhất (ngày có chơi hiện ngọn lửa) và thanh EXP lên cấp; chạm để sang tab Tiến độ
function WeekCard({ profile, sessions }: { profile: UserProfile; sessions: GameSession[] | null }) {
    const progress = getLevelProgress(profile.level);
    const playedDays = new Set((sessions ?? []).map((session) => dayKey(session.playedAt, timeZone)));
    const days = lastDays(7, timeZone);
    const today = days[days.length - 1].key;
    const played = days.filter((day) => playedDays.has(day.key)).length;

    return (
        <PressableScale onPress={() => router.navigate('/progress')} accessibilityRole="button" accessibilityLabel={`Tuần này luyện ${played} trên 7 ngày. Xem tiến độ`} style={styles.week}>
            <View style={styles.weekHead}>
                <AppText style={[styles.pathTitle, { flex: 1 }]}>Tuần này</AppText>
                <AppText variant="small">{played}/7 ngày · dài nhất {profile.longestStreak}</AppText>
                <ChevronRight color={colors.inkSoft} size={20} />
            </View>
            <View style={styles.strip}>
                {days.map((day) => {
                    const on = playedDays.has(day.key);
                    return (
                        <View key={day.key} style={styles.day}>
                            <View style={[styles.dayDot, on && styles.dayOn, day.key === today && styles.dayToday]}>
                                {on ? <Flame color={colors.white} size={16} /> : null}
                            </View>
                            <AppText style={styles.dayLabel}>{WEEKDAY_LETTERS[day.date.getDay()]}</AppText>
                        </View>
                    );
                })}
            </View>
            <View style={{ gap: 4 }}>
                <ProgressBar value={progress.percentage / 100} color={colors.sun} track={colors.step} />
                <AppText variant="small">
                    Cấp {profile.level.level} · còn {formatNumber(progress.remaining)} EXP lên cấp {progress.nextLevel}
                </AppText>
            </View>
        </PressableScale>
    );
}

const THICK = { borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge } as const;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    date: { fontFamily: fonts.bold, color: colors.brandDeep },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderBottomWidth: 3 },
    pillText: { fontFamily: fonts.extrabold, fontSize: 16 },
    streakPill: { backgroundColor: '#fff0e6', borderBottomColor: '#ffd8bf' },
    streakOn: { backgroundColor: '#e8590c', borderBottomColor: '#c2410c' },
    levelPill: { backgroundColor: '#fff3cf', borderBottomColor: '#f4dc93' },
    urgent: { color: '#c2410c', fontFamily: fonts.semibold },
    banner: { padding: spacing.md, borderRadius: radius, backgroundColor: colors.sky },
    bannerUrgent: { backgroundColor: '#ffe3d1' },
    bannerText: { fontFamily: fonts.bold, color: colors.ink },
    ask: { backgroundColor: '#fff8e1', borderColor: colors.sun, borderBottomColor: colors.sunDeep },
    path: { padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, ...THICK },
    pathHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
    pathTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
    ringText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink },
    connector: { gap: 4, paddingVertical: 4 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.step },
    dotDone: { backgroundColor: colors.brand },
    step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: NODE },
    node: { width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
    nodeDone: { backgroundColor: colors.brand, borderBottomColor: colors.brandDeep },
    nodeCurrent: { backgroundColor: colors.white, borderWidth: 3, borderColor: colors.brand, borderBottomColor: colors.brandDeep },
    nodeLocked: { backgroundColor: colors.step, borderBottomColor: colors.edge },
    pulse: { position: 'absolute', top: 0, left: 0, width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: colors.mint },
    stepLabel: { fontFamily: fonts.bold, color: colors.ink },
    stepDone: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    finish: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
    finishDone: { backgroundColor: '#fde9a8', borderBottomColor: colors.sunDeep },
    method: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, borderBottomWidth: EDGE + 2 },
    overline: { fontFamily: fonts.bold, fontSize: 12, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 },
    methodHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    methodArt: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    methodName: { fontFamily: fonts.extrabold, fontSize: 19, lineHeight: 24, color: colors.ink },
    methodActions: { flexDirection: 'row', gap: spacing.sm },
    tip: { flexDirection: 'row', gap: spacing.sm, padding: spacing.sm, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.7)' },
    week: { gap: spacing.md, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.white, ...THICK },
    weekHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    strip: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: 4 },
    dayDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.step, alignItems: 'center', justifyContent: 'center' },
    dayOn: { backgroundColor: '#e8590c' },
    dayToday: { borderWidth: 2, borderColor: colors.ink },
    dayLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.inkSoft },
});
