import { useCallback, useState } from 'react';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Panel, BlockState } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Chips } from '@/features/shared-game/components/Chips';
import { FormError } from '@/features/auth/components/AuthParts';
import { buildBadges, isEarned } from '@/features/profile/utils/badges';
import { parentApi, type ParentOverview } from '../api/parent.api';
import { useParentAction, useParentResource } from '../hooks/useParentResource';
import { dateLabel, gameLabel, ParentNav, ParentScreen, percent } from './ParentParts';

export const todayVietnam = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function Summary({ data }: { data: ParentOverview['summary'] }) {
    return <><AppText>{data.games} ván · {data.practiceDays} ngày luyện tập</AppText>
        <AppText>{Math.round(data.recordedPracticeSeconds / 60)} phút được ghi nhận · Chính xác: {percent(data.accuracy)}</AppText>
        <AppText>Lần chơi gần nhất: {dateLabel(data.lastPlayedAt)}</AppText>
        {data.byGame.map((game) => <AppText key={game.gameName}>{gameLabel(game.gameName)}: {game.games} ván · {percent(game.total ? game.correct / game.total : null)}</AppText>)}
    </>;
}
export function ParentDashboardScreen({ childProfile = false }: { childProfile?: boolean }) {
    const overview = useParentResource(parentApi.overview);
    const catalog = useParentResource(parentApi.games);
    const action = useParentAction();
    const [period, setPeriod] = useState<'day' | 'week'>('day');
    const [dateInput, setDateInput] = useState(todayVietnam);
    const [date, setDate] = useState(todayVietnam);
    const reportLoader = useCallback(() => parentApi.report(period, date), [period, date]);
    const report = useParentResource(reportLoader);
    return <ParentScreen title={childProfile ? 'Hồ sơ của con' : 'Hôm nay con đã làm gì?'}>
        <Button title="Làm mới dữ liệu" variant="secondary" onPress={() => { overview.reload(); catalog.reload(); report.reload(); }} />
        <BlockState request={overview.state} onRetry={overview.reload}>{(data) => <>
            <Panel title={data.child.username}>
                <AppText>Cấp {data.child.profile.level.level} · {data.child.profile.exp} EXP</AppText>
                <ProgressBar value={data.child.profile.level.expIntoLevel / data.child.profile.level.expForNextLevel} />
                <AppText>{data.child.profile.level.expIntoLevel}/{data.child.profile.level.expForNextLevel} EXP trong cấp</AppText>
                <AppText>Chuỗi hiện tại: {data.child.profile.streaks} ngày · dài nhất: {data.child.profile.longestStreak} ngày</AppText>
                <Summary data={data.summary} />
            </Panel>
            <Panel title="Nhóm tuổi của con"><FormError>{action.error}</FormError>
                <Chips accessibilityLabel="Nhóm tuổi của con" value={data.ageGroup ?? ''} options={[{ value: '', label: 'Chưa khai báo' }, ...['6-8', '9-12', '13-15'].map((value) => ({ value, label: `${value} tuổi` }))]}
                    onChange={(value) => { if (!action.busy) void action.run(async () => { await parentApi.ageGroup(value || null); overview.reload(); report.reload(); }); }} />
            </Panel>
            <Panel title="Tiến độ và kỷ lục từng trò">
                {!data.progress.length && <AppText>Con chưa hoàn thành ván luyện tập nào.</AppText>}
                {data.progress.map((game) => <Panel key={game.gameName} title={gameLabel(game.gameName)}>
                    <AppText>Đã mở cấp {game.unlockedLevel} · {game.stats.played} ván</AppText>
                    <AppText>Chính xác: {percent(game.stats.totalItems ? game.stats.totalCorrect / game.stats.totalItems : null)}</AppText>
                    <AppText>Kỷ lục cấp: {game.records?.bestLevel ?? 'Chưa có'}</AppText>
                    {Object.entries(game.records?.fastestMemorizeSecByLevel ?? {}).map(([level, seconds]) => <AppText key={level}>Cấp {level}: ghi nhớ nhanh nhất {seconds} giây</AppText>)}
                </Panel>)}
            </Panel>
            <Panel title="Huy hiệu"><BlockState request={catalog.state} onRetry={catalog.reload}>{({ games }) => <>
                {buildBadges(data.child.profile, games).map((badge) => <AppText key={badge.id}>{isEarned(badge) ? '★' : '☆'} {badge.title} · {badge.unit(badge.current)}</AppText>)}
            </>}</BlockState></Panel>
        </>}</BlockState>
        {!childProfile && <Panel title="Nhìn lại theo ngày hoặc tuần">
            <Chips accessibilityLabel="Kỳ báo cáo" value={period} options={[{ value: 'day', label: 'Ngày' }, { value: 'week', label: 'Tuần' }]} onChange={setPeriod} />
            <TextField label="Ngày báo cáo (YYYY-MM-DD)" value={dateInput} onChangeText={setDateInput} autoCapitalize="none" maxLength={10} />
            <Button title="Xem báo cáo" variant="secondary" onPress={() => setDate(dateInput)} />
            <BlockState request={report.state} onRetry={report.reload}>{(data) => <>
                <AppText>{data.date} · {data.period === 'week' ? 'Theo tuần' : 'Theo ngày'} · {data.timeZone}</AppText>
                {data.incomplete && <AppText variant="small">Kỳ hiện tại chưa kết thúc.</AppText>}
                <Summary data={data.summary} />
                <AppText>Kỳ trước cùng khoảng thời gian: {data.previousSummary.games} ván · chính xác {percent(data.previousSummary.accuracy)}</AppText>
                <AppText>{data.comment.observation}</AppText><AppText>{data.comment.evidence}</AppText><AppText>{data.comment.trend}</AppText>
                <AppText variant="heading">Gợi ý đồng hành</AppText>
                {data.suggestions.map((item) => <Panel key={item.title} title={item.title}>
                    <AppText>{item.reason}</AppText>{item.steps.map((step, i) => <AppText key={step}>{i + 1}. {step}</AppText>)}<AppText>{item.question}</AppText>
                </Panel>)}
                <AppText variant="heading">Các ván đã hoàn thành</AppText>
                {!data.activities.length && <AppText>Chưa có dữ liệu trong kỳ này.</AppText>}
                {data.activities.map((item, i) => <AppText key={`${item.completedAt}:${i}`}>{gameLabel(item.gameName)} · {dateLabel(item.completedAt)} · {item.correctItems}/{item.totalItems} đúng · {Math.round(item.durationSec)} giây</AppText>)}
            </>}</BlockState>
        </Panel>}
        <ParentNav />
    </ParentScreen>;
}
