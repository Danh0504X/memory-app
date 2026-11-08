import { router, type Href } from 'expo-router';
import { Check, ChevronRight, Flame, Lightbulb } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useDailyChallenge } from '@/features/daily/hooks/useDailyChallenge';
import { HomeScreen } from '@/features/home/HomeScreen';
import { GAME_IDS, GAME_META } from '@/features/dashboard/constants';
import { PROFILE_KEY, useCatalog, useProfile, useRecentSessions } from '@/features/dashboard/hooks/useOverview';
import type { DashboardSummary } from '@/features/dashboard/types';
import { PROGRESS_TIME_ZONE, dayKey, formatPercent, formatTotalDuration, formatWeekday } from '@/features/dashboard/utils/format';
import { profileApi, type UserProfile } from '@/features/profile/api/profile.api';
import { formatNumber, getLevelProgress } from '@/features/profile/utils/profileProgress';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { setQuery } from '@/lib/queryCache';
import { daysUntilExam, examLine, recommendGame, roundsPerDay } from '../utils/personalize';
import { TIPS, dailyGoals, greet, lastWeekSummary, pickOfDay, sessionsOfDay } from '../utils/today';

const timeZone = PROGRESS_TIME_ZONE;

export function TodayScreen() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    // Khách thấy trang chủ giới thiệu Memio (bản web: trang "/"), người đã đăng nhập thấy việc hôm nay
    return isAuthenticated ? <MemberToday /> : <HomeScreen />;
}

// Màn chính của người đã đăng nhập: việc nên làm hôm nay đứng trước, số liệu tóm tắt đứng sau.
function MemberToday() {
    const profile = useProfile();
    const catalog = useCatalog();
    const recent = useRecentSessions();
    const daily = useDailyChallenge();
    const [skipping, setSkipping] = useState(false);

    const reloadAll = () => {
        profile.reload();
        catalog.reload();
        recent.reload();
        daily.reload();
    };
    // Nộp xong một ván: EXP, chuỗi ngày, mục tiêu và thử thách đều đổi
    const { reload: reloadProfile } = profile;
    const { reload: reloadCatalog } = catalog;
    const { reload: reloadRecent } = recent;
    const { reload: reloadDaily } = daily;
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
    const hello = profileData ? greet(profileData, sessions, timeZone) : null;
    const preferences = profileData?.preferences ?? null;
    const { game: recommended, reason } = recommendGame(sessions, preferences, GAME_IDS);
    const now = new Date();
    const date = formatWeekday(now, timeZone);
    const exam = examLine(daysUntilExam(preferences, dayKey(now, timeZone)), roundsPerDay(preferences));
    // Chưa trả lời cũng chưa bỏ qua câu hỏi mục tiêu thì hỏi một lần ở đây
    const askGoals = preferences?.status === 'unset';

    const skipGoals = async () => {
        setSkipping(true);
        try {
            const { data } = await profileApi.skipPreferences();
            setQuery(PROFILE_KEY, data.profile);
            profile.reload();
        } catch {
            // Không lưu được thì lần sau hỏi lại; không chặn người dùng
        } finally {
            setSkipping(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={reloadAll} tintColor={colors.brand} />}>
                <Animated.View entering={enterUp(0)} style={styles.hello}>
                    <AppText variant="small" style={styles.overline}>{date.charAt(0).toUpperCase() + date.slice(1)}</AppText>
                    <AppText variant="title">{hello?.title ?? 'Chào bạn'}</AppText>
                    <AppText variant="lead" style={hello?.urgent ? styles.urgent : null}>{hello?.line ?? 'Đang tải việc hôm nay…'}</AppText>
                    {exam ? <AppText variant="body" style={[styles.exam, exam.urgent && styles.urgent]}>{exam.text}</AppText> : null}
                </Animated.View>

                {askGoals ? (
                    <Panel title="Bạn luyện trí nhớ để làm gì?" style={styles.ask}>
                        <AppText variant="body">Chọn mục tiêu để Memio gợi ý đúng trò và số ván mỗi ngày. Đổi lại được trong Hồ sơ.</AppText>
                        <Button title="Chọn mục tiêu" onPress={() => router.push('/goals')} />
                        <Button title="Bỏ qua" variant="secondary" loading={skipping} onPress={() => void skipGoals()} />
                    </Panel>
                ) : null}

                <BlockState request={catalog.state} onRetry={catalog.reload}>
                    {(games) => {
                        const meta = GAME_META[recommended];
                        const game = games.find((item) => item.gameName === recommended);
                        return (
                            <Animated.View entering={enterUp(1)} style={[styles.next, { borderColor: meta.color }]}>
                                <AppText variant="small" style={styles.overline}>Chơi tiếp</AppText>
                                <AppText variant="heading">{meta.label}</AppText>
                                <AppText variant="small">
                                    {game ? `Cấp ${game.player?.unlockedLevel ?? 1}/${game.maxLevel}` : ''}
                                    {reason ? ` · ${reason}` : ''}
                                </AppText>
                                <Button title="Chơi ngay" onPress={() => router.push(meta.route)} />
                            </Animated.View>
                        );
                    }}
                </BlockState>

                <Panel title="Mục tiêu hôm nay">
                    <BlockState request={recent.state} onRetry={recent.reload}>
                        {(data) => (
                            <View>
                                {dailyGoals(sessionsOfDay(data, timeZone), recommended, preferences).map((goal) => (
                                    <Pressable
                                        key={goal.id}
                                        disabled={goal.done}
                                        onPress={() => router.push(goal.to as Href)}
                                        accessibilityRole="button"
                                        accessibilityState={{ checked: goal.done }}
                                        style={styles.goal}
                                    >
                                        <View style={[styles.check, goal.done && styles.checkDone]}>{goal.done ? <Check color={colors.white} size={14} /> : null}</View>
                                        <AppText style={[styles.goalLabel, goal.done && styles.goalDone]}>{goal.label}</AppText>
                                        {!goal.done ? <ChevronRight color={colors.inkSoft} size={18} /> : null}
                                    </Pressable>
                                ))}
                            </View>
                        )}
                    </BlockState>
                </Panel>

                <Panel title="Chuỗi ngày & cấp tài khoản">
                    <BlockState request={profile.state} onRetry={profile.reload}>
                        {(data) => <StreakAndLevel profile={data} />}
                    </BlockState>
                </Panel>

                <DailyMini request={daily.state} onRetry={daily.reload} />
                <Tip />

                <Panel title="7 ngày qua" action={<Link label="Xem tiến độ" onPress={() => router.push('/progress')} />}>
                    <BlockState request={recent.state} onRetry={recent.reload}>
                        {(data) => <WeekStats {...lastWeekSummary(data)} />}
                    </BlockState>
                </Panel>
            </ScrollView>
        </SafeAreaView>
    );
}

function StreakAndLevel({ profile }: { profile: UserProfile }) {
    const progress = getLevelProgress(profile.level);
    return (
        <View style={{ gap: spacing.sm }}>
            <View style={styles.streakRow}>
                <Flame color={profile.playedToday ? '#e8590c' : colors.inkSoft} size={28} />
                <View style={{ flex: 1 }}>
                    <AppText style={styles.streakValue}>{profile.streaks} ngày</AppText>
                    <AppText variant="small">
                        {profile.playedToday ? 'Hôm nay đã giữ chuỗi.' : 'Chơi 1 ván hôm nay để giữ chuỗi.'} Dài nhất: {profile.longestStreak} ngày
                    </AppText>
                </View>
            </View>
            <AppText style={styles.levelTitle}>Cấp {profile.level.level}</AppText>
            <ProgressBar value={progress.percentage / 100} />
            <AppText variant="small">
                {formatNumber(profile.level.expIntoLevel)}/{formatNumber(profile.level.expForNextLevel)} EXP · còn {formatNumber(progress.remaining)} EXP lên cấp {progress.nextLevel}
            </AppText>
        </View>
    );
}

function DailyMini({ request, onRetry }: { request: ReturnType<typeof useDailyChallenge>['state']; onRetry: () => void }) {
    return (
        <Panel title="Thử thách hôm nay" action={<Link label="Xem" onPress={() => router.navigate('/daily')} />}>
            <BlockState request={request} onRetry={onRetry}>
                {({ challenge, me }) => {
                    const meta = GAME_META[challenge.gameName];
                    let line = 'Đăng nhập để có tên trên bảng xếp hạng.';
                    if (me?.status === 'completed' && me.entry) line = `Bạn đứng hạng ${me.entry.rank}/${challenge.players}.`;
                    else if (me?.status === 'missed') line = 'Bạn đã dùng lượt hôm nay. Hẹn bạn ngày mai.';
                    else if (me?.status === 'playing') line = 'Bạn đang chơi dở, vào chơi tiếp nhé.';
                    else if (me) line = `Chưa chơi · ${challenge.players} người đã tham gia.`;
                    return (
                        <Pressable onPress={() => router.navigate('/daily')} accessibilityRole="button" style={{ gap: 2 }}>
                            <AppText style={styles.goalLabel}>
                                {meta.label} · {challenge.totalItems} {meta.unit}
                            </AppText>
                            <AppText variant="small">{line}</AppText>
                        </Pressable>
                    );
                }}
            </BlockState>
        </Panel>
    );
}

function Tip() {
    return (
        <View style={styles.tip}>
            <Lightbulb color={colors.brandDeep} size={20} />
            <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="small" style={styles.overline}>Mẹo hôm nay</AppText>
                <AppText variant="body">{pickOfDay(TIPS)}</AppText>
                <Link label="Xem các phương pháp" onPress={() => router.navigate('/methods')} />
            </View>
        </View>
    );
}

function WeekStats({ summary, previousSummary }: { summary: DashboardSummary; previousSummary: DashboardSummary }) {
    const delta = summary.played - previousSummary.played;
    return (
        <View style={styles.tiles}>
            <Tile label="Ván đã chơi" value={String(summary.played)} note={delta === 0 ? 'bằng 7 ngày trước' : `${delta > 0 ? '+' : ''}${delta} so với 7 ngày trước`} />
            <Tile label="Chính xác" value={formatPercent(summary.accuracy)} />
            <Tile label="Hoàn hảo" value={String(summary.perfectCount)} />
            <Tile label="Thời gian" value={formatTotalDuration(summary.durationSec)} />
        </View>
    );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
    return (
        <View style={styles.tile}>
            <AppText variant="small">{label}</AppText>
            <AppText style={styles.tileValue}>{value}</AppText>
            {note ? <AppText variant="small" style={styles.tileNote}>{note}</AppText> : null}
        </View>
    );
}

function Link({ label, onPress }: { label: string; onPress: () => void }): ReactNode {
    return (
        <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
            <AppText variant="small" style={styles.link}>{label} →</AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.md },
    overline: { fontFamily: fonts.bold, color: colors.brandDeep },
    hello: { gap: spacing.sm },
    urgent: { color: '#b54708', fontFamily: fonts.semibold },
    exam: { fontFamily: fonts.semibold },
    ask: { backgroundColor: '#fff8e1', borderColor: colors.sun },
    next: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, borderWidth: 2, backgroundColor: colors.white },
    goal: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, borderBottomWidth: 1, borderColor: colors.step },
    check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
    checkDone: { backgroundColor: colors.brand, borderColor: colors.brand },
    goalLabel: { flex: 1, fontFamily: fonts.semibold, color: colors.ink },
    goalDone: { color: colors.inkSoft, textDecorationLine: 'line-through' },
    streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    streakValue: { fontFamily: fonts.extrabold, fontSize: 22 },
    levelTitle: { fontFamily: fonts.bold, fontSize: 16 },
    tip: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.5, backgroundColor: colors.sky },
    tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tile: { width: '48%', flexGrow: 1, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.wall, gap: 2 },
    tileValue: { fontFamily: fonts.extrabold, fontSize: 20 },
    tileNote: { fontSize: 12, lineHeight: 16 },
    link: { fontFamily: fonts.bold, color: colors.brand },
});
