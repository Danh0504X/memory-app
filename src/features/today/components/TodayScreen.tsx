import { router, type Href } from 'expo-router';
import { BarChart3, Check, Flame, Lightbulb, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { NavRow } from '@/components/ui/NavRow';
import { BlockState, Panel } from '@/components/ui/Panel';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { GAME_IDS, GAME_META } from '@/features/dashboard/constants';
import { PROFILE_KEY, useCatalog, useProfile, useRecentSessions } from '@/features/dashboard/hooks/useOverview';
import type { GameSession } from '@/features/dashboard/types';
import { PROGRESS_TIME_ZONE, dayKey, formatWeekday, lastDays } from '@/features/dashboard/utils/format';
import { HomeScreen } from '@/features/home/HomeScreen';
import { profileApi, type UserProfile } from '@/features/profile/api/profile.api';
import { formatNumber, getLevelProgress } from '@/features/profile/utils/profileProgress';
import { GameTile } from '@/features/shared-game/components/GameTile';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { setQuery } from '@/lib/queryCache';
import { daysUntilExam, examLine, recommendGame, roundsPerDay } from '../utils/personalize';
import { TIPS, dailyGoals, greet, pickOfDay, sessionsOfDay } from '../utils/today';

const timeZone = PROGRESS_TIME_ZONE;
const WEEKDAY_LETTERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function TodayScreen() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // Khách thấy trang chủ giới thiệu Memio, người đã đăng nhập thấy việc hôm nay
    return isAuthenticated ? <MemberToday /> : <HomeScreen />;
}

// Màn chính của người đã đăng nhập: việc nên làm hôm nay trước, chuỗi ngày và cấp sau.
function MemberToday() {
    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();
    const daily = useDailyChallenge();
    const [skipping, setSkipping] = useState(false);

    const { reload: reloadProfile } = profile;
    const { reload: reloadCatalog } = catalog;
    const { reload: reloadRecent } = recent;
    const { reload: reloadDaily } = daily;
    const reloadAll = () => {
        reloadProfile();
        reloadCatalog();
        reloadRecent();
        reloadDaily();
    };
    // Nộp xong một ván: EXP, chuỗi ngày, mục tiêu và thử thách đều đổi
    useEffect(
        () =>
            onGameSessionRecorded(() => {
                reloadProfile();
                reloadCatalog();
                reloadRecent();
                reloadDaily();
            }),
        [reloadProfile, reloadCatalog, reloadRecent, reloadDaily],
    );

    const sessions = recent.state.status === 'ready' ? recent.state.data : null;
    const profileData = profile.state.status === 'ready' ? profile.state.data : null;
    const games = catalog.state.status === 'ready' ? catalog.state.data : null;
    const hello = profileData ? greet(profileData, sessions, timeZone) : null;
    const preferences = profileData?.preferences ?? null;
    const { game: recommended, reason } = recommendGame(sessions, preferences, GAME_IDS);
    const now = new Date();
    const date = formatWeekday(now, timeZone);
    const exam = examLine(daysUntilExam(preferences, dayKey(now, timeZone)), roundsPerDay(preferences));
    // Chưa trả lời cũng chưa bỏ qua câu hỏi mục tiêu thì hỏi một lần ở đây
    const askGoals = preferences?.status === 'unset';
    const levelOf = (id: (typeof GAME_IDS)[number]) => {
        const game = games?.find((item) => item.gameName === id);
        return game ? { level: game.player?.unlockedLevel ?? 1, maxLevel: game.maxLevel } : {};
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
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={reloadAll} tintColor={colors.brand} />}>
                <Animated.View entering={enterUp(0)} style={styles.header}>
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="small" style={styles.date}>{date.charAt(0).toUpperCase() + date.slice(1)}</AppText>
                        <AppText variant="title" numberOfLines={2}>{hello?.title ?? 'Chào bạn'}</AppText>
                    </View>
                    {profileData ? (
                        <View style={[styles.streakPill, profileData.playedToday && styles.streakOn]} accessibilityLabel={`Chuỗi ${profileData.streaks} ngày`}>
                            <Flame color={profileData.playedToday ? '#ffffff' : '#e8590c'} size={20} />
                            <AppText style={[styles.streakText, profileData.playedToday && { color: colors.white }]}>{profileData.streaks}</AppText>
                        </View>
                    ) : null}
                </Animated.View>
                {hello ? <AppText variant="body" style={hello.urgent ? styles.urgent : null}>{hello.line}</AppText> : null}
                {exam ? (
                    <View style={[styles.banner, exam.urgent && styles.bannerUrgent]}>
                        <AppText style={styles.bannerText}>{exam.text}</AppText>
                    </View>
                ) : null}

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
                        const done = goals.filter((goal) => goal.done).length;
                        return (
                            <Panel>
                                <View style={styles.goalsHead}>
                                    <ProgressRing value={done / goals.length} size={64} stroke={8}>
                                        <AppText style={styles.ringText}>{done}/{goals.length}</AppText>
                                    </ProgressRing>
                                    <View style={{ flex: 1 }}>
                                        <AppText variant="heading">Mục tiêu hôm nay</AppText>
                                        <AppText variant="small">{done === goals.length ? 'Xong hết rồi, giỏi lắm!' : 'Hoàn thành để giữ nhịp luyện tập.'}</AppText>
                                    </View>
                                </View>
                                {goals.map((goal) => (
                                    <Pressable
                                        key={goal.id}
                                        disabled={goal.done}
                                        onPress={() => router.push(goal.to as Href)}
                                        accessibilityRole="button"
                                        accessibilityState={{ checked: goal.done }}
                                        style={styles.goal}
                                    >
                                        <View style={[styles.check, goal.done && styles.checkDone]}>{goal.done ? <Check color={colors.white} size={16} strokeWidth={3} /> : null}</View>
                                        <AppText style={[styles.goalLabel, goal.done && styles.goalDone]}>{goal.label}</AppText>
                                    </Pressable>
                                ))}
                            </Panel>
                        );
                    }}
                </BlockState>

                <AppText style={styles.section}>Chơi tiếp</AppText>
                <GameTile game={recommended} size="large" note={reason ?? undefined} {...levelOf(recommended)} />
                <View style={styles.grid}>
                    {GAME_IDS.filter((id) => id !== recommended).map((id) => (
                        <GameTile key={id} game={id} {...levelOf(id)} />
                    ))}
                </View>

                <BlockState request={daily.state} onRetry={reloadDaily}>
                    {({ challenge, me }) => {
                        const meta = GAME_META[challenge.gameName];
                        let line = `${meta.label} · ${challenge.totalItems} ${meta.unit} · ${challenge.players} người đã chơi`;
                        if (me?.status === 'completed' && me.entry) line = `Bạn đứng hạng ${me.entry.rank}/${challenge.players} hôm nay`;
                        else if (me?.status === 'missed') line = 'Bạn đã dùng lượt hôm nay. Hẹn bạn ngày mai.';
                        else if (me?.status === 'playing') line = 'Bạn đang chơi dở, vào chơi tiếp nhé.';
                        return (
                            <NavRow
                                icon={<Trophy color={colors.sunDeep} size={24} />}
                                tint="#fff3cf"
                                title="Thử thách hôm nay"
                                subtitle={line}
                                onPress={() => router.navigate('/daily')}
                            />
                        );
                    }}
                </BlockState>

                <BlockState request={profile.state} onRetry={reloadProfile}>
                    {(data) => <StreakAndLevel profile={data} sessions={sessions} />}
                </BlockState>

                <View style={styles.tip}>
                    <Lightbulb color={colors.brandDeep} size={22} />
                    <AppText variant="body" style={{ flex: 1 }}>{pickOfDay(TIPS)}</AppText>
                </View>

                <NavRow
                    icon={<BarChart3 color={colors.brand} size={24} />}
                    tint={colors.mint}
                    title="Xem tiến độ"
                    subtitle="Biểu đồ, lịch luyện tập và các ván đã chơi"
                    onPress={() => router.push('/progress')}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// Chuỗi ngày, dải 14 ngày (ngày nào có chơi) và cấp tài khoản
function StreakAndLevel({ profile, sessions }: { profile: UserProfile; sessions: GameSession[] | null }) {
    const progress = getLevelProgress(profile.level);
    const playedDays = new Set((sessions ?? []).map((session) => dayKey(session.playedAt, timeZone)));
    const days = lastDays(14, timeZone);
    const today = days[days.length - 1].key;

    return (
        <Panel>
            <View style={styles.levelRow}>
                <ProgressRing value={progress.percentage / 100} size={72} stroke={8} color={colors.sunDeep} track="#fff3cf">
                    <AppText style={styles.levelNumber}>{profile.level.level}</AppText>
                </ProgressRing>
                <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="heading">Cấp {profile.level.level}</AppText>
                    <AppText variant="small">
                        {formatNumber(profile.level.expIntoLevel)}/{formatNumber(profile.level.expForNextLevel)} EXP · còn {formatNumber(progress.remaining)} lên cấp {progress.nextLevel}
                    </AppText>
                </View>
            </View>
            <AppText style={styles.stripTitle}>
                Chuỗi {profile.streaks} ngày · dài nhất {profile.longestStreak}
            </AppText>
            <View style={styles.strip} accessibilityLabel={`${days.filter((day) => playedDays.has(day.key)).length} trong 14 ngày gần nhất có luyện tập`}>
                {days.map((day) => {
                    const played = playedDays.has(day.key);
                    return (
                        <View key={day.key} style={styles.day}>
                            <View style={[styles.dot, played && styles.dotOn, day.key === today && styles.dotToday]}>
                                {played ? <Flame color={colors.white} size={12} /> : null}
                            </View>
                            <AppText style={styles.dayLabel}>{WEEKDAY_LETTERS[day.date.getDay()]}</AppText>
                        </View>
                    );
                })}
            </View>
        </Panel>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    date: { fontFamily: fonts.bold, color: colors.brandDeep },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#fff0e6',
        borderBottomWidth: 3,
        borderBottomColor: '#ffd8bf',
    },
    streakOn: { backgroundColor: '#e8590c', borderBottomColor: '#c2410c' },
    streakText: { fontFamily: fonts.extrabold, fontSize: 18, color: '#e8590c' },
    urgent: { color: '#c2410c', fontFamily: fonts.semibold },
    banner: { padding: spacing.md, borderRadius: radius, backgroundColor: colors.sky },
    bannerUrgent: { backgroundColor: '#ffe3d1' },
    bannerText: { fontFamily: fonts.bold, color: colors.ink },
    ask: { backgroundColor: '#fff8e1', borderColor: colors.sun, borderBottomColor: colors.sunDeep },
    goalsHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 4 },
    ringText: { fontFamily: fonts.extrabold, fontSize: 15 },
    goal: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
    check: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    checkDone: { backgroundColor: colors.brand, borderColor: colors.brand },
    goalLabel: { flex: 1, fontFamily: fonts.semibold, color: colors.ink },
    goalDone: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink, marginTop: spacing.sm },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    levelNumber: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.ink },
    stripTitle: { fontFamily: fonts.bold, color: colors.ink, marginTop: spacing.sm },
    strip: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: 2 },
    dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.step, alignItems: 'center', justifyContent: 'center' },
    dotOn: { backgroundColor: '#e8590c' },
    dotToday: { borderWidth: 2, borderColor: colors.ink },
    dayLabel: { fontSize: 9, lineHeight: 12, color: colors.inkSoft, fontFamily: fonts.semibold },
    tip: {
        flexDirection: 'row',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius * 1.25,
        backgroundColor: colors.sky,
        borderBottomWidth: EDGE,
        borderBottomColor: '#a9d3ea',
    },
});
