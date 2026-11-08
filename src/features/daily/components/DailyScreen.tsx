import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { GAME_META } from '@/features/dashboard/constants';
import { formatClock } from '@/features/dashboard/utils/format';
import { METHODS } from '@/features/methods/methodsData';
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
        <ScrollView
            style={{ backgroundColor: colors.wall }}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={false} onRefresh={reload} tintColor={colors.brand} />}
        >
            <BlockState request={daily.state} onRetry={reload}>
                {(view) => (
                    <>
                        <Hero view={view} onChanged={reload} />
                        <MyResult view={view} />
                        <Panel title="Bảng xếp hạng hôm nay" action={<AppText variant="small">{view.challenge.players} người đã chơi</AppText>}>
                            <Leaderboard view={view} />
                        </Panel>
                        <HowItWorks view={view} />
                    </>
                )}
            </BlockState>
        </ScrollView>
    );
}

function Hero({ view, onChanged }: { view: DailyChallengeView; onChanged: () => void }) {
    const { start, starting, error } = useStartDaily(onChanged);
    const countdown = useCountdown(view.challenge.endsAt, onChanged);
    const { challenge, me } = view;
    const meta = GAME_META[challenge.gameName];

    let action;
    if (!me) action = <Button title="Đăng nhập để tham gia" onPress={() => router.push('/login')} />;
    else if (me.status === 'completed' && me.entry) action = <AppText style={styles.rank}>Bạn đứng hạng {me.entry.rank} hôm nay</AppText>;
    else if (me.status === 'missed') action = <AppText variant="small">Bạn đã dùng lượt hôm nay nhưng chưa nộp bài. Hẹn bạn ngày mai nhé.</AppText>;
    else action = <Button title={starting ? 'Đang chia bài...' : me.status === 'playing' ? 'Chơi tiếp' : 'Tham gia ngay'} loading={starting} onPress={() => void start()} />;

    return (
        <Animated.View entering={enterUp(0)} style={styles.hero}>
            <AppText variant="small" style={styles.overline}>{formatDate(challenge.date)}</AppText>
            <AppText variant="title">Thử thách hôm nay</AppText>
            <AppText variant="body">Mỗi ngày một đề mới cho tất cả mọi người. Chỉ có một lượt, nên hãy nhớ thật kỹ trước khi bắt đầu.</AppText>
            <View style={styles.facts}>
                <Fact>{meta.label} · {challenge.totalItems} {meta.unit}</Fact>
                <Fact>Ghi nhớ {formatSeconds(challenge.memorizeLimitSec)}</Fact>
                <Fact>Nhớ lại {formatSeconds(challenge.recallLimitSec)}</Fact>
            </View>
            {action}
            {me?.status === 'not-played' ? <AppText variant="small">Bấm tham gia là ván được tính, kể cả khi bạn bỏ dở.</AppText> : null}
            {error ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{error}</AppText> : null}
            <AppText variant="small">
                Đề mới sau <AppText variant="small" style={styles.clock}>{countdown}</AppText> · {challenge.players} người đã chơi
            </AppText>
        </Animated.View>
    );
}

// "2026-11-09" → "09/11/2026"
const formatDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;

function Fact({ children }: { children: ReactNode }) {
    return (
        <View style={styles.fact}>
            <AppText variant="small" style={styles.factText}>{children}</AppText>
        </View>
    );
}

// Đã chơi thì là thành tích của bạn, chưa chơi thì là lời khuyên trước khi bắt đầu
function MyResult({ view }: { view: DailyChallengeView }) {
    const { challenge, me } = view;
    const meta = GAME_META[challenge.gameName];
    const entry = me?.entry;

    if (!entry) {
        // Trò hình hợp với nối chuyện; trò bài có hai thông tin (số và chất) nên hợp với căn phòng trí nhớ
        const method = METHODS.find((item) => item.id === (challenge.gameName === 'image' ? 'story' : 'loci')) ?? METHODS[0];
        return (
            <Panel title="Trước khi bắt đầu">
                <AppText variant="body">
                    Hôm nay là {challenge.totalItems} {meta.unit}. Thử {method.name.toLowerCase()}: {method.summary.charAt(0).toLowerCase() + method.summary.slice(1)}
                </AppText>
            </Panel>
        );
    }

    const others = challenge.players - 1;
    const beaten = challenge.players - entry.rank;
    let standing = `Bạn giỏi hơn ${Math.round((beaten / others) * 100)}% người chơi hôm nay.`;
    if (others === 0) standing = 'Bạn là người đầu tiên hoàn thành hôm nay.';
    else if (beaten === 0) standing = 'Bạn đã hoàn thành thử thách. Ngày mai thử nối các hình thành câu chuyện nhé!';

    return (
        <Panel title="Kết quả của bạn">
            <AppText style={styles.bigRank}>
                Hạng {entry.rank} <AppText variant="lead">/ {challenge.players}</AppText>
            </AppText>
            <AppText variant="body">{standing}</AppText>
            <View style={styles.stats}>
                <Stat label="Đúng" value={`${entry.correctItems}/${entry.totalItems}`} />
                <Stat label="Ghi nhớ" value={formatClock(entry.memorizeSec)} />
                <Stat label="Nhớ lại" value={formatClock(entry.recallSec)} />
            </View>
        </Panel>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.stat}>
            <AppText variant="small">{label}</AppText>
            <AppText style={styles.statValue}>{value}</AppText>
        </View>
    );
}

// Ba người đầu nổi bật, rồi tới những người tiếp theo; người chơi ngoài top vẫn thấy hàng của mình ở cuối
function Leaderboard({ view }: { view: DailyChallengeView }) {
    const { leaderboard } = view;
    const unit = GAME_META[view.challenge.gameName].unit;
    const mine = view.me?.entry;
    const mineHidden = mine && !leaderboard.some((entry) => entry.isMe);

    if (leaderboard.length === 0) {
        return <AppText variant="body">Chưa có ai hoàn thành thử thách hôm nay. Hãy là người đầu tiên lên bục!</AppText>;
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

const MEDALS = ['#f4c95d', '#c9d1d9', '#e0a96d'];

function Row({ entry, unit }: { entry: LeaderboardEntry; unit: string }) {
    const medal = entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;
    return (
        <View
            style={[styles.row, entry.isMe && styles.rowMe]}
            accessibilityLabel={`Hạng ${entry.rank}: ${entry.username}${entry.isMe ? ' (bạn)' : ''}, đúng ${entry.correctItems}/${entry.totalItems}, ${formatClock(entry.durationSec)}`}
        >
            <View style={[styles.rankBadge, medal ? { backgroundColor: medal } : null]}>
                <AppText style={styles.rankText}>{entry.rank}</AppText>
            </View>
            <View style={{ flex: 1 }}>
                <AppText style={styles.name} numberOfLines={1}>
                    {entry.username}
                    {entry.isMe ? <AppText variant="small" style={styles.you}> · bạn</AppText> : null}
                </AppText>
                <AppText variant="small">{entry.correctItems}/{entry.totalItems} {unit}</AppText>
            </View>
            <AppText style={styles.time}>{formatClock(entry.durationSec)}</AppText>
        </View>
    );
}

function HowItWorks({ view }: { view: DailyChallengeView }) {
    const { challenge } = view;
    const meta = GAME_META[challenge.gameName];
    return (
        <Panel title="Cách chơi thử thách">
            <How title="Một đề cho mọi người">
                Đúng 00:00 mỗi ngày (giờ Việt Nam) có đề mới, ai cũng nhận cùng một đề. Thẻ bài và Hình ảnh thay phiên nhau. Hôm nay là {meta.label.toLowerCase()},{' '}
                {challenge.totalItems} {meta.unit}.
            </How>
            <How title="Một lượt duy nhất">
                Bấm tham gia là ván bắt đầu và được tính, kể cả khi bạn bỏ dở. Bạn có {formatSeconds(challenge.memorizeLimitSec)} để ghi nhớ và{' '}
                {formatSeconds(challenge.recallLimitSec)} để xếp lại.
            </How>
            <How title="Xếp hạng công bằng">Ai nhớ đúng nhiều hơn đứng trên. Bằng nhau thì ai dùng ít thời gian hơn, vẫn bằng thì ai nộp bài trước.</How>
            <AppText variant="small">Ván thử thách vẫn được cộng EXP và giữ chuỗi ngày, nhưng không mở cấp độ mới.</AppText>
        </Panel>
    );
}

function How({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 2 }}>
            <AppText style={styles.name}>{title}</AppText>
            <AppText variant="small">{children}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    content: { padding: spacing.md, gap: spacing.md },
    hero: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, backgroundColor: colors.mint },
    overline: { fontFamily: fonts.bold, color: colors.brandDeep },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    fact: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.white },
    factText: { fontFamily: fonts.semibold, color: colors.ink },
    rank: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.brandDeep },
    clock: { fontFamily: fonts.bold, color: colors.ink, fontVariant: ['tabular-nums'] },
    bigRank: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 42 },
    stats: { flexDirection: 'row', gap: spacing.sm },
    stat: { flex: 1, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.wall, gap: 2 },
    statValue: { fontFamily: fonts.bold, fontSize: 18 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.step },
    rowMe: { backgroundColor: '#fff8e1', borderRadius: radius, paddingHorizontal: 8 },
    rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.step, alignItems: 'center', justifyContent: 'center' },
    rankText: { fontFamily: fonts.extrabold, fontSize: 14 },
    name: { fontFamily: fonts.semibold, color: colors.ink },
    you: { fontFamily: fonts.bold, color: colors.brand },
    time: { fontFamily: fonts.bold, fontVariant: ['tabular-nums'] },
    gap: { textAlign: 'center', color: colors.inkSoft },
});
