import { router, Stack } from 'expo-router';
import { ChevronLeft, ChevronRight, Delete } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ease } from '@/constants/motion';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { PressableScale } from '@/components/ui/PressableScale';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { PlayLayout } from '@/features/shared-game/components/PlayLayout';
import { RoundResult } from '@/features/shared-game/components/RoundResult';
import { useCompletedRound } from '@/features/shared-game/hooks/useCompletedRound';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { useNumbersGameStore } from '../store/numbersGameStore';
import type { NumberSession } from '../types/numberTypes';
import { getDigitGroups } from '../utils/numberUtils';
import { NumbersSettings } from './NumbersSettings';

const GAME_NAME = 'Ghi nhớ số';
const ROW_SIZE = 10;
const CELL_GAP = 4;
const ROW_LABEL = 24;

export function NumbersGame() {
    const userId = useAuthStore((state) => state.user?._id);
    const authLoading = useAuthStore((state) => state.isLoading);
    const state = useNumbersGameStore();
    const { session, initialize, dispose, prepDeadline, deadline, begin, recall, ready, submit, refresh, reset, busy, error, isStarting, answers, preferences } = state;

    useEffect(() => {
        if (!authLoading) initialize(userId ?? 'guest');
        return dispose;
    }, [userId, authLoading, initialize, dispose]);

    // App xuống nền giữa lúc gõ đáp án thì lưu ngay (bản web: visibilitychange)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (next) => {
            if (next !== 'active') useNumbersGameStore.getState().save();
        });
        return () => subscription.remove();
    }, []);

    // Hết giờ ở mỗi bước thì tự sang bước sau
    const expire = useCallback(() => {
        if (prepDeadline || isStarting) begin();
        else if (session?.phase === 'memorizing') recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling') submit();
    }, [prepDeadline, isStarting, session?.phase, begin, recall, ready, submit]);
    const { timeLeft } = usePhaseTimer(prepDeadline ?? deadline, expire);

    const preparing = !!prepDeadline || (isStarting && !session);
    const inGame = !!session || preparing;
    const phase = preparing ? 'preparing' : session?.phase;
    const filled = answers.filter((answer) => answer !== null).length;
    const total = session?.digitCount ?? 0;
    const result = session?.result;

    let status = 'Chuẩn bị ghi nhớ';
    let progress = 0;
    if (phase === 'memorizing') status = `Ghi nhớ ${total} chữ số`;
    if (phase === 'preparing_recall') status = 'Nhẩm lại trong đầu';
    if (phase === 'recalling') {
        status = `Gõ lại · đã điền ${filled}/${total}`;
        progress = total ? filled / total : 0;
    }
    if (phase === 'completed' && result) {
        status = `Kết quả · đúng ${result.correctCount}/${result.total}`;
        progress = result.total ? result.correctCount / result.total : 0;
    }
    const showTimer = phase !== 'completed' && !(phase === 'memorizing' && preferences.hideTimer);
    const action =
        phase === 'memorizing' ? { label: busy ? 'Đang chuyển…' : 'Đã nhớ xong', run: recall }
        : phase === 'recalling' ? { label: busy ? 'Đang chấm…' : 'Nộp bài', run: submit }
        : null;

    const retry = () => {
        if (isStarting) begin();
        else if (session?.phase === 'memorizing' && state.hidden) recall();
        else if (session?.phase === 'preparing_recall') ready();
        else if (session?.phase === 'recalling' && deadline && Date.now() >= deadline) submit();
        else if (session?.phase === 'recalling' && state.dirty) state.save();
        else refresh();
    };
    const errorBar = error ? (
        <View style={styles.errorBar} accessibilityRole="alert">
            <AppText variant="small" style={{ color: colors.danger }}>{error}</AppText>
            <View style={styles.errorActions}>
                <Button title="Thử lại" variant="secondary" disabled={busy || state.saving} onPress={retry} style={styles.errorButton} />
                {!session && state.savedSessionId ? <Button title="Bắt đầu lượt mới" variant="secondary" disabled={busy} onPress={reset} style={styles.errorButton} /> : null}
            </View>
        </View>
    ) : null;

    let content: ReactNode;
    if (authLoading) {
        content = <ActivityIndicator style={{ flex: 1 }} color={colors.brand} />;
    } else if (!inGame) {
        content = (
            <>
                {errorBar}
                <NumbersSettings />
            </>
        );
    } else {
        content = (
            <PlayLayout
                game="number"
                level={session?.level ?? null}
                daily={session?.mode === 'challenge'}
                status={status}
                progress={progress}
                timeLeft={showTimer ? timeLeft : undefined}
                actionLabel={action?.label}
                actionBusy={busy}
                onAction={action?.run}
                // Lưu nốt đáp án đang gõ rồi mới thoát; ván đã xong thì thoát luôn
                onExit={() => void state.flush().finally(() => state.reset())}
                confirmExit={phase !== 'completed'}
            >
                {errorBar}
                {phase === 'preparing' ? (
                    <WaitPanel
                        title="Sẵn sàng ghi nhớ"
                        description="Dãy số sẽ hiện ra khi hết giờ đếm. Chuẩn bị sẵn câu chuyện của bạn nhé."
                        timeLeft={timeLeft}
                        buttonLabel="Bắt đầu ngay"
                        disabled={busy}
                        onSkip={begin}
                    />
                ) : null}
                {phase === 'memorizing' ? <MemorizePhase /> : null}
                {phase === 'preparing_recall' ? (
                    <WaitPanel
                        title="Nhẩm lại trong đầu"
                        description="Dãy số đã được giấu. Kể lại câu chuyện của bạn một lượt rồi bắt đầu gõ."
                        timeLeft={timeLeft}
                        buttonLabel="Mình sẵn sàng"
                        disabled={busy}
                        onSkip={ready}
                    />
                ) : null}
                {phase === 'recalling' ? <RecallPhase expired={timeLeft === 0} /> : null}
                {phase === 'completed' && session?.result ? <ResultPhase key={session.id} session={session} /> : null}
            </PlayLayout>
        );
    }

    return (
        <>
            {/* Đang chơi thì ẩn header và chặn vuốt lùi để không lỡ tay thoát ván */}
            <Stack.Screen options={{ title: GAME_NAME, headerShown: !inGame, gestureEnabled: !inGame || phase === 'completed' }} />
            {content}
        </>
    );
}

function WaitPanel({ title, description, timeLeft, buttonLabel, disabled, onSkip }: { title: string; description: string; timeLeft: number; buttonLabel: string; disabled: boolean; onSkip: () => void }) {
    return (
        <View style={styles.wait}>
            <AppText variant="heading">{title}</AppText>
            <View style={styles.countdown} accessibilityLiveRegion="polite" accessibilityLabel={`Còn ${timeLeft} giây`}>
                <Animated.View key={timeLeft} entering={ZoomIn.duration(220).easing(ease.enter)}>
                    <AppText style={styles.countdownText}>{timeLeft}</AppText>
                </Animated.View>
            </View>
            <AppText variant="small" style={styles.center}>{description}</AppText>
            <Button title={buttonLabel} disabled={disabled} onPress={onSkip} />
        </View>
    );
}

// Bàn ghi nhớ: nhóm số đang xem ở giữa, dải mọi nhóm bên dưới (nhóm chưa xem thì úp).
// Vị trí đang xem chỉ giữ ở màn hình, như bản web.
function MemorizePhase() {
    const { session, preferences, hidden } = useNumbersGameStore();
    const [index, setIndex] = useState(0);
    const groups = getDigitGroups(session?.digits ?? [], preferences.groups);
    const last = groups.length - 1;

    if (hidden || groups.length === 0) {
        return (
            <View style={styles.wait}>
                <ActivityIndicator color={colors.brand} />
                <AppText variant="small">Đang chuyển bước…</AppText>
            </View>
        );
    }

    return (
        <MemorizeStage
            items={groups}
            index={Math.min(index, last)}
            groupSize={1}
            unit="Nhóm"
            onJump={setIndex}
            onPrev={() => setIndex((value) => Math.max(0, value - 1))}
            onNext={() => setIndex((value) => Math.min(last, value + 1))}
            keyOf={(group) => String(group.start)}
            miniWidth={48}
            renderBig={(group) => (
                <View style={{ alignItems: 'center', gap: spacing.sm }}>
                    <View style={styles.bigGroup} accessible accessibilityLabel={`Chữ số ${group.start + 1} đến ${group.start + group.digits.length}: ${group.digits.join(' ')}`}>
                        {group.digits.map((digit, offset) => (
                            <View key={offset} style={styles.bigDigit}>
                                <AppText style={styles.bigDigitText}>{digit}</AppText>
                            </View>
                        ))}
                    </View>
                    <AppText variant="small">Chữ số {group.start + 1}–{group.start + group.digits.length}</AppText>
                </View>
            )}
            renderMini={(group, _index, seen) => (
                <View style={[styles.chip, !seen && styles.chipBack]}>
                    <AppText style={styles.chipText} numberOfLines={1} adjustsFontSizeToFit>{seen ? group.digits.join('') : ''}</AppText>
                </View>
            )}
        />
    );
}

// Bàn gõ lại: các ô số (mỗi hàng 10 ô) ở trên, bàn phím số và công cụ ở dưới.
// Không dùng bàn phím hệ thống để lưới ô số luôn nằm trong màn hình.
function RecallPhase({ expired }: { expired: boolean }) {
    const { session, answers, edit, busy, saving, dirty } = useNumbersGameStore();
    const isGuest = !useAuthStore((state) => state.isAuthenticated);
    const { width } = useWindowDimensions();
    const [selected, setSelected] = useState(0);

    const totalDigits = session!.digitCount;
    const filled = answers.filter((answer) => answer !== null).length;
    const disabled = busy || expired;
    const cellWidth = Math.floor((width - spacing.md * 2 - ROW_LABEL - CELL_GAP * ROW_SIZE) / ROW_SIZE);
    const rows = Array.from({ length: Math.ceil(totalDigits / ROW_SIZE) }, (_, row) => {
        const start = row * ROW_SIZE;
        return { start, indices: Array.from({ length: Math.min(ROW_SIZE, totalDigits - start) }, (_, i) => start + i) };
    });

    const focus = (index: number) => setSelected(Math.max(0, Math.min(totalDigits - 1, index)));
    const enterDigit = (digit: string) => {
        const next = [...answers];
        next[selected] = digit;
        edit(next);
        focus(selected + 1);
    };
    // Xoá ô bên trái (như phím Backspace): ô đang chọn còn trống thì xoá ô trước nó
    const backspace = () => {
        const target = answers[selected] !== null ? selected : Math.max(0, selected - 1);
        const next = [...answers];
        next[target] = null;
        edit(next);
        focus(target);
    };
    // Lỡ thiếu một số: chèn ô trống, các số phía sau lùi một ô
    const insert = () => {
        const next = [...answers];
        next.splice(selected, 0, null);
        next.pop();
        edit(next);
    };
    // Lỡ thừa một số: xoá ô, các số phía sau tiến lên một ô
    const remove = () => {
        const next = [...answers];
        next.splice(selected, 1);
        next.push(null);
        edit(next);
    };

    const saveState = saving ? 'Đang lưu…' : dirty ? 'Chưa lưu' : filled > 0 ? (isGuest ? 'Nháp trên máy' : 'Đã lưu') : '';

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.recallHead}>
                <AppText variant="small" style={{ flex: 1, color: colors.ink }}>
                    {expired ? 'Đã hết giờ, đang chấm bài…' : `Chạm một ô rồi gõ số. Đang ở ô ${selected + 1}.`}
                </AppText>
                <AppText variant="small" accessibilityLiveRegion="polite">{saveState}</AppText>
            </View>
            <ScrollView contentContainerStyle={styles.rows}>
                {rows.map((row) => (
                    <View key={row.start} style={styles.row}>
                        <AppText variant="small" style={styles.rowNo}>{row.start + 1}</AppText>
                        {row.indices.map((index) => {
                            const value = answers[index];
                            const current = index === selected;
                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => focus(index)}
                                    disabled={disabled}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: current }}
                                    accessibilityLabel={`Chữ số ${index + 1}: ${value ?? 'trống'}`}
                                    style={[styles.cell, { width: cellWidth }, value !== null && styles.cellFilled, current && styles.cellCurrent]}
                                >
                                    {value !== null ? (
                                        <Animated.View key={value} entering={ZoomIn.duration(150).easing(ease.enter)}>
                                            <AppText style={styles.cellText}>{value}</AppText>
                                        </Animated.View>
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.keypad}>
                <View style={styles.keyRow}>
                    {'12345'.split('').map((digit) => <Key key={digit} label={digit} disabled={disabled} onPress={() => enterDigit(digit)} />)}
                </View>
                <View style={styles.keyRow}>
                    {'67890'.split('').map((digit) => <Key key={digit} label={digit} disabled={disabled} onPress={() => enterDigit(digit)} />)}
                </View>
                <View style={styles.keyRow}>
                    <Tool label="Ô trước" disabled={disabled} onPress={() => focus(selected - 1)}><ChevronLeft color={colors.brandDeep} size={18} /></Tool>
                    <Tool label="Ô sau" disabled={disabled} onPress={() => focus(selected + 1)}><ChevronRight color={colors.brandDeep} size={18} /></Tool>
                    <Tool label="Xoá" disabled={disabled} onPress={backspace}><Delete color={colors.brandDeep} size={18} /></Tool>
                    <Tool label="Chèn ô" disabled={disabled} onPress={insert} />
                    <Tool label="Xoá ô" disabled={disabled} onPress={remove} />
                </View>
            </View>
        </View>
    );
}

function Key({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
    return (
        <PressableScale
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Số ${label}`}
            style={[styles.key, disabled && styles.disabled]}
        >
            <AppText style={styles.keyText}>{label}</AppText>
        </PressableScale>
    );
}

function Tool({ label, disabled, onPress, children }: { label: string; disabled: boolean; onPress: () => void; children?: ReactNode }) {
    return (
        <PressableScale
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={[styles.tool, disabled && styles.disabled]}
        >
            {children}
            <AppText style={styles.toolText} numberOfLines={1}>{label}</AppText>
        </PressableScale>
    );
}

function ResultPhase({ session }: { session: NumberSession }) {
    const { prepare, reset, progress } = useNumbersGameStore();
    const { game } = useGameCatalog('number');
    const { state, retry } = useCompletedRound(session.id, 'number', session.completedRound);
    const { width } = useWindowDimensions();
    const { result, comparison = [] } = session;
    const cellWidth = Math.floor((width - spacing.md * 2 - CELL_GAP * (ROW_SIZE - 1)) / ROW_SIZE);

    const play = (level: number | null) =>
        prepare({
            mode: 'practice',
            prepareRecall: true,
            ...(level !== null ? { level } : { digitCount: session.digitCount }),
            memorizeSeconds: session.memorizeSeconds,
            recallSeconds: session.recallSeconds,
        });

    const review = (
        <>
            <View style={{ gap: 4, marginTop: spacing.sm }}>
                <AppText variant="heading">Đối chiếu từng chữ số</AppText>
                <AppText variant="small">
                    Trên: đáp án · Dưới: bạn gõ · Đúng {result!.correctCount}, sai {result!.wrongCount}, bỏ trống {result!.blankCount}
                </AppText>
            </View>
            <View style={styles.compare}>
                {comparison.map((item) => (
                    <View
                        key={item.index}
                        style={[styles.compareCell, { width: cellWidth }, item.status === 'wrong' && styles.compareWrong, item.status === 'blank' && styles.compareBlank]}
                        accessibilityLabel={`Chữ số ${item.index + 1}: đáp án ${item.expected}, bạn gõ ${item.actual ?? 'trống'}`}
                    >
                        <AppText style={styles.compareNo}>{item.index + 1}</AppText>
                        <AppText style={styles.compareExpected}>{item.expected}</AppText>
                        <AppText style={[styles.compareActual, item.status === 'wrong' && { color: colors.danger }]}>{item.actual ?? '–'}</AppText>
                    </View>
                ))}
            </View>
        </>
    );

    if (state.status === 'ready') {
        return (
            <RoundResult
                round={state.round}
                maxLevel={game?.maxLevel ?? progress?.digitCounts.length ?? 0}
                busy={false}
                onPlayAgain={() => play(session.level)}
                onNextLevel={(level) => play(level)}
                onReset={reset}
                // Thử thách của game số nằm ngay trong màn thiết lập, không dẫn tới trang Hôm nay
                dailyAction={{ label: 'Về thiết lập', onPress: reset }}
                note={session.completionReason === 'timeout' ? 'Đã hết giờ gõ lại nên bài được nộp tự động bằng đáp án đã lưu.' : undefined}
            >
                {review}
            </RoundResult>
        );
    }

    // Đã chấm xong ở API của game số; kết quả tổng hợp (EXP, kỷ lục) chưa tải được thì vẫn hiện điểm và đối chiếu
    return (
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
            <View style={styles.pendingCard}>
                <AppText variant="title">Đã nộp bài</AppText>
                <AppText style={styles.pendingCount}>
                    {result!.correctCount} <AppText variant="lead">/ {result!.total} đúng</AppText>
                </AppText>
                <AppText variant="small">Chính xác {result!.accuracy}%. Đáp án và kết quả ván được giữ nguyên bên dưới.</AppText>
                {state.status === 'loading' ? (
                    <AppText variant="small">Đang tải kết quả tổng hợp và phần thưởng…</AppText>
                ) : (
                    <>
                        <AppText variant="small" style={{ color: colors.danger }}>
                            Chưa tải được kết quả tổng hợp và phần thưởng. Bạn có thể tải lại; không cần nộp bài lần nữa.
                        </AppText>
                        <Button title="Tải lại kết quả" variant="secondary" onPress={retry} />
                    </>
                )}
                {session.mode !== 'challenge' ? <Button title="Chơi lại" onPress={() => play(session.level)} /> : null}
                <Button
                    title="Chọn trò khác"
                    variant="secondary"
                    onPress={() => {
                        reset();
                        router.dismissTo('/games');
                    }}
                />
            </View>
            {review}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    errorBar: { gap: spacing.sm, margin: spacing.md, padding: spacing.md, borderRadius: radius, backgroundColor: '#fdecea' },
    errorActions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    errorButton: { minHeight: 44, flexGrow: 1 },
    wait: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
    countdown: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderBottomWidth: 8, borderColor: '#e8590c', borderBottomColor: '#c2410c', backgroundColor: '#fff0e6', alignItems: 'center', justifyContent: 'center' },
    countdownText: { fontFamily: fonts.extrabold, fontSize: 52, lineHeight: 60, color: '#c2410c' },
    center: { textAlign: 'center', maxWidth: 300 },
    bigGroup: { flexDirection: 'row', gap: 6 },
    bigDigit: { width: 56, height: 76, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    bigDigitText: { fontFamily: fonts.extrabold, fontSize: 44, lineHeight: 52, fontVariant: ['tabular-nums'] },
    chip: { width: 48, height: 32, borderRadius: 6, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    chipBack: { backgroundColor: colors.sun, borderColor: '#e2b13c' },
    chipText: { fontFamily: fonts.bold, fontSize: 13, fontVariant: ['tabular-nums'] },
    recallHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    rows: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: CELL_GAP },
    rowNo: { width: ROW_LABEL - CELL_GAP, textAlign: 'right', fontSize: 11, lineHeight: 14 },
    cell: { height: 40, borderRadius: 6, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    cellFilled: { backgroundColor: '#fff0e6', borderColor: '#ffc9a3' },
    cellCurrent: { borderColor: colors.sunDeep, borderWidth: 3, backgroundColor: '#fff8e1' },
    cellText: { fontFamily: fonts.bold, fontSize: 18, fontVariant: ['tabular-nums'] },
    keypad: { gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 2, borderColor: colors.line, backgroundColor: colors.white },
    keyRow: { flexDirection: 'row', gap: 6 },
    key: { flex: 1, height: 50, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    keyText: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.ink },
    tool: { flex: 1, height: 44, borderRadius: radius, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
    toolText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.brandDeep },
    disabled: { opacity: 0.4 },
    pendingCard: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge },
    pendingCount: { fontFamily: fonts.extrabold, fontSize: 40, lineHeight: 46 },
    compare: { flexDirection: 'row', flexWrap: 'wrap', gap: CELL_GAP },
    compareCell: { alignItems: 'center', paddingVertical: 4, borderRadius: 6, backgroundColor: '#eef8f0', borderWidth: 1, borderColor: colors.mint },
    compareWrong: { backgroundColor: '#fdecea', borderColor: '#f5c2bd' },
    compareBlank: { backgroundColor: colors.white, borderColor: colors.step },
    compareNo: { fontSize: 9, lineHeight: 11, color: colors.inkSoft },
    compareExpected: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 19 },
    compareActual: { fontSize: 13, lineHeight: 17, color: colors.inkSoft },
});
