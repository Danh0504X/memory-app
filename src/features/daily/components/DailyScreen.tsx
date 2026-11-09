import { router } from 'expo-router';
import { CalendarClock, Clock, ListOrdered, Trophy, Zap } from 'lucide-react-native';
import { useEffect, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { GAME_META } from '@/features/dashboard/constants';
import { formatClock } from '@/features/dashboard/utils/format';
import { METHODS } from '@/features/methods/methodsData';
import { GAME_ICONS } from '@/features/shared-game/gameIcons';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import type { DailyChallengeView, LeaderboardEntry } from '../api/daily.api';
import { useCountdown, useDailyChallenge, useStartDaily } from '../hooks/useDailyChallenge';

// Thử thách ngày: mọi người cùng một đề, mỗi người một lượt, xếp hạng theo số đúng rồi tới thời gian.
// Khách xem được bảng xếp hạng và luật chơi; muốn chơi phải đăng nhập.
export function DailyScreen() {
    const daily = useDailyChallenge();
    const { reload } = daily;

    // Chơi xong ván thử thách rồi quay lại: tải lại hạng và bảng xếp hạng
    useEffect(() => onGameSessionRecorded(reload), [reload]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={daily.refreshing} onRefresh={daily.refresh} tintColor={colors.brand} />}>
                <BlockState request={daily.state} onRetry={reload}>
                    {(view) => (
                        <>
                            <Hero view={view} onChanged={reload} />
                            <MyResult view={view} />
                            <Animated.View entering={enterUp(2)}>
                                <Panel title="Bảng xếp hạng" action={<AppText variant="small">{view.challenge.players} người chơi</AppText>}>
                                    <Leaderboard view={view} />
                                </Panel>
                            </Animated.View>
                            <Rules view={view} />
                        </>
                    )}
                </BlockState>
            </ScrollView>
        </SafeAreaView>
    );
}

function Hero({ view, onChanged }: { view: DailyChallengeView; onChanged: () => void }) {
    const { start, starting, error } = useStartDaily(onChanged);
    const countdown = useCountdown(view.challenge.endsAt, onChanged);
    const { challenge, me } = view;
    const meta = GAME_META[challenge.gameName];
    const Icon = GAME_ICONS[challenge.gameName];

    let action;
    if (!me) action = <Button title="Đăng nhập để tham gia" onPress={() => router.push('/login')} />;
    else if (me.status === 'completed' && me.entry) action = null; // hạng đã hiện ở thẻ kết quả ngay dưới
    else if (me.status === 'missed') action = <AppText style={styles.note}>Bạn đã dùng lượt hôm nay. Hẹn bạn ngày mai nhé.</AppText>;
    else action = <Button title={starting ? 'Đang chia bài...' : me.status === 'playing' ? 'Chơi tiếp' : 'Tham gia ngay'} loading={starting} onPress={() => void start()} />;

    return (
        <Animated.View entering={enterUp(0)} style={styles.hero}>
            <View style={styles.heroTop}>
                <AppText style={styles.overline}>{formatDate(challenge.date)}</AppText>
                <View style={styles.clockPill} accessibilityLabel={`Đề mới sau ${countdown}`}>
                    <Clock color={colors.ink} size={14} />
                    <AppText style={styles.clock}>{countdown}</AppText>
                </View>
            </View>
            <View style={styles.heroHead}>
                <Animated.View entering={ZoomIn.delay(150).springify()} style={styles.trophy}>
                    <Trophy color={colors.sunDeep} size={34} strokeWidth={2.4} />
                </Animated.View>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.heroTitle}>Thử thách hôm nay</AppText>
                    <AppText style={styles.heroLine}>Một đề cho mọi người, chỉ một lượt.</AppText>
                </View>
            </View>
            <View style={styles.chips}>
                <View style={[styles.chip, { backgroundColor: meta.color }]}>
                    <Icon color={colors.white} size={16} strokeWidth={2.4} />
                    <AppText style={[styles.chipText, { color: colors.white }]}>{meta.label} · {challenge.totalItems} {meta.unit}</AppText>
                </View>
                <Chip>Nhớ {formatSeconds(challenge.memorizeLimitSec)}</Chip>
                <Chip>Xếp {formatSeconds(challenge.recallLimitSec)}</Chip>
            </View>
            {action}
            {me?.status === 'not-played' ? <AppText style={styles.note}>Bấm tham gia là ván được tính, kể cả khi bỏ dở.</AppText> : null}
            {error ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{error}</AppText> : null}
        </Animated.View>
    );
}

// "2026-11-09" → "09/11/2026"
const formatDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

function Chip({ children }: { children: ReactNode }) {
    return (
        <View style={styles.chip}>
            <AppText style={styles.chipText}>{children}</AppText>
        </View>
    );
}

// Đã chơi thì là thành tích của bạn, chưa chơi thì là một mẹo ngắn trước khi bắt đầu
function MyResult({ view }: { view: DailyChallengeView }) {
    const { challenge, me } = view;
    const entry = me?.entry;

    if (!entry) {
        // Trò hình hợp với nối chuyện; trò bài có hai thông tin (số và chất) nên hợp với căn phòng trí nhớ
        const method = METHODS.find((item) => item.id === (challenge.gameName === 'image' ? 'story' : 'loci')) ?? METHODS[0];
        return (
            <Animated.View entering={enterUp(1)} style={styles.tip}>
                <AppText style={styles.tipTitle}>Mẹo: {method.name.toLowerCase()}</AppText>
                <AppText variant="body">{method.summary}</AppText>
            </Animated.View>
        );
    }

    const others = challenge.players - 1;
    const beaten = challenge.players - entry.rank;
    let standing = `Giỏi hơn ${Math.round((beaten / others) * 100)}% người chơi hôm nay.`;
    if (others === 0) standing = 'Bạn là người đầu tiên hoàn thành hôm nay.';
    else if (beaten === 0) standing = 'Đã hoàn thành. Ngày mai thử nối các hình thành câu chuyện nhé!';

    return (
        <Animated.View entering={enterUp(1)}>
            <Panel>
                <View style={styles.rankRow}>
                    <AppText style={styles.bigRank}>#{entry.rank}</AppText>
                    <View style={{ flex: 1 }}>
                        <AppText variant="heading">Hạng của bạn</AppText>
                        <AppText variant="small">{standing}</AppText>
                    </View>
                </View>
                <View style={styles.stats}>
                    <Stat label="Đúng" value={`${entry.correctItems}/${entry.totalItems}`} color="#e3f4e6" />
                    <Stat label="Ghi nhớ" value={formatClock(entry.memorizeSec)} color={colors.sky} />
                    <Stat label="Nhớ lại" value={formatClock(entry.recallSec)} color="#fff0e6" />
                </View>
            </Panel>
        </Animated.View>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.stat, { backgroundColor: color }]}>
            <AppText style={styles.statValue}>{value}</AppText>
            <AppText variant="small">{label}</AppText>
        </View>
    );
}

// Người chơi ngoài top vẫn thấy hàng của mình ở cuối
function Leaderboard({ view }: { view: DailyChallengeView }) {
    const { leaderboard } = view;
    const unit = GAME_META[view.challenge.gameName].unit;
    const mine = view.me?.entry;
    const mineHidden = mine && !leaderboard.some((entry) => entry.isMe);

    if (leaderboard.length === 0) {
        return <AppText variant="body">Chưa có ai hoàn thành hôm nay. Hãy là người đầu tiên!</AppText>;
    }
    return (
        <View>
            {leaderboard.map((entry) => <Row key={entry.rank} entry={entry} unit={unit} />)}
            {mineHidden ? (
                <>
                    <AppText style={styles.gap}>⋯</AppText>
                    <Row entry={mine} unit={unit} />
                </>
            ) : null}
        </View>
    );
}

const MEDALS = [
    { bg: colors.sun, edge: colors.sunDeep },
    { bg: '#dde3e8', edge: '#b4bec7' },
    { bg: '#f1c59a', edge: '#d49a63' },
];

function Row({ entry, unit }: { entry: LeaderboardEntry; unit: string }) {
    const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;
    return (
        <View
            style={[styles.row, entry.isMe && styles.rowMe]}
            accessibilityLabel={`Hạng ${entry.rank}: ${entry.username}${entry.isMe ? ' (bạn)' : ''}, đúng ${entry.correctItems}/${entry.totalItems}, ${formatClock(entry.durationSec)}`}
        >
            <View style={[styles.rankBadge, medal && { backgroundColor: medal.bg, borderBottomColor: medal.edge }]}>
                <AppText style={styles.rankText}>{entry.rank}</AppText>
            </View>
            <View style={{ flex: 1 }}>
                <AppText style={styles.name} numberOfLines={1}>
                    {entry.username}
                    {entry.isMe ? <AppText style={styles.you}> · bạn</AppText> : null}
                </AppText>
                <AppText variant="small">{entry.correctItems}/{entry.totalItems} {unit}</AppText>
            </View>
            <AppText style={styles.time}>{formatClock(entry.durationSec)}</AppText>
        </View>
    );
}

// Luật chơi gọn: ba dòng có biểu tượng
function Rules({ view }: { view: DailyChallengeView }) {
    return (
        <Animated.View entering={enterUp(3)} style={{ gap: spacing.sm }}>
            <AppText style={styles.section}>Luật chơi</AppText>
            <Rule icon={<CalendarClock color={colors.brand} size={20} />} tint={colors.mint}>
                Đề mới lúc 00:00 (giờ Việt Nam). Thẻ bài và Hình ảnh thay phiên nhau.
            </Rule>
            <Rule icon={<Zap color={colors.sunDeep} size={20} />} tint="#fff3cf">
                Một lượt: {formatSeconds(view.challenge.memorizeLimitSec)} để nhớ, {formatSeconds(view.challenge.recallLimitSec)} để xếp lại.
            </Rule>
            <Rule icon={<ListOrdered color="#1c7ed6" size={20} />} tint={colors.sky}>
                Đúng nhiều hơn đứng trên; bằng nhau thì ai nhanh hơn.
            </Rule>
            <AppText variant="small">Vẫn được cộng EXP và giữ chuỗi ngày, nhưng không mở cấp mới.</AppText>
        </Animated.View>
    );
}

function Rule({ icon, tint, children }: { icon: ReactNode; tint: string; children: ReactNode }) {
    return (
        <View style={styles.rule}>
            <View style={[styles.ruleIcon, { backgroundColor: tint }]}>{icon}</View>
            <AppText variant="body" style={{ flex: 1 }}>{children}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
    hero: {
        gap: spacing.md,
        padding: spacing.lg,
        borderRadius: radius * 1.5,
        backgroundColor: '#fde9a8',
        borderBottomWidth: EDGE + 2,
        borderBottomColor: colors.sunDeep,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    overline: { fontFamily: fonts.bold, fontSize: 13, color: '#8a6100' },
    clockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.7)' },
    clock: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, fontVariant: ['tabular-nums'] },
    heroHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    trophy: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    heroTitle: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 30, color: colors.ink },
    heroLine: { fontFamily: fonts.medium, color: '#6b5200' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.white },
    chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },
    note: { fontFamily: fonts.medium, fontSize: 13, color: '#6b5200' },
    tip: { gap: 4, padding: spacing.md, borderRadius: radius * 1.25, backgroundColor: colors.mint, borderBottomWidth: EDGE, borderBottomColor: '#a5d6b3' },
    tipTitle: { fontFamily: fonts.extrabold, color: colors.brandDeep },
    rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    bigRank: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46, color: colors.sunDeep },
    stats: { flexDirection: 'row', gap: spacing.sm },
    stat: { flex: 1, padding: spacing.sm, borderRadius: radius, alignItems: 'center' },
    statValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink, fontVariant: ['tabular-nums'] },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, paddingHorizontal: 6 },
    rowMe: { backgroundColor: '#fff8e1', borderRadius: radius },
    rankBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.step, borderBottomWidth: 3, borderBottomColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.ink },
    name: { fontFamily: fonts.bold, color: colors.ink },
    you: { fontFamily: fonts.bold, color: colors.brand },
    time: { fontFamily: fonts.bold, color: colors.ink, fontVariant: ['tabular-nums'] },
    gap: { textAlign: 'center', color: colors.inkSoft },
    section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
    rule: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    ruleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
