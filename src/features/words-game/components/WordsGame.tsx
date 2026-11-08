import { Stack } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { ease } from '@/constants/motion';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { Chips } from '@/features/shared-game/components/Chips';
import { GameOptions, MAX_GROUP } from '@/features/shared-game/components/GameOptions';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { PlayLayout } from '@/features/shared-game/components/PlayLayout';
import { RoundResult } from '@/features/shared-game/components/RoundResult';
import { RoundSetup, RoundSetupStatus } from '@/features/shared-game/components/RoundSetup';
import { useFocusChain } from '@/features/shared-game/hooks/useFocusChain';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { SUPPORTED_LANGUAGES } from '../api/wordsApi';
import { useWordsGameStore } from '../store/wordsGameStore';
import { WordBack, WordCard } from './WordCard';

const GAME_NAME = 'Ghi nhớ từ';
const PREP_OPTIONS = [0, 3, 5, 10];
const MINI = { width: 64, height: 40 };
const RECALL_COLUMNS = 2;
const RECALL_GAP = 10;

export function WordsGame() {
    const phase = useWordsGameStore((state) => state.phase);
    const playing = phase === 'prep' || phase === 'memorize' || phase === 'recall';

    let content = <SettingsPhase />;
    if (phase === 'prep') content = <PrepPhase />;
    else if (phase === 'memorize') content = <MemorizePhase />;
    else if (phase === 'recall') content = <RecallPhase />;
    else if (phase === 'result') content = <ResultPhase />;

    return (
        <>
            {/* Đang chơi thì ẩn header và chặn vuốt lùi để không lỡ tay thoát ván */}
            <Stack.Screen options={{ title: GAME_NAME, headerShown: phase === 'settings', gestureEnabled: !playing }} />
            {content}
        </>
    );
}

function SettingsPhase() {
    const { game, status, error: catalogError, reload } = useGameCatalog('word');
    const { memorizeTime, setMemorizeTime, selectedLevel, setSelectedLevel, startGame, pending, error } = useWordsGameStore();

    if (!game) return <RoundSetupStatus status={status} error={catalogError} onRetry={() => void reload()} />;

    // Giá trị đã lưu có thể không còn hợp lệ khi luật ở backend thay đổi
    const memorizeSec = game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec;

    return (
        <RoundSetup
            gameTitle={GAME_NAME}
            typing
            itemUnit="từ"
            shortUnit="từ"
            game={game}
            // Bản web chưa cho tự chọn số từ; luôn chơi theo cấp
            customItemCount={null}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            memorizeSec={memorizeSec}
            onMemorizeSecChange={setMemorizeTime}
            onStart={(gameLevel) => void startGame({ gameLevel, memorizeSec })}
            isStarting={pending === 'start'}
            error={error}
            renderBack={(width) => <WordBack width={width} height={width * 0.7} />}
            options={<WordOptions />}
        />
    );
}

// Tuỳ chọn lưu lại giữa các lần chơi: ngôn ngữ, thời gian chuẩn bị, số từ mỗi lần xem, ẩn đồng hồ
function WordOptions() {
    const { preferences, setPreferences } = useWordsGameStore();
    return (
        <GameOptions
            unit="từ"
            groups={preferences.groups}
            onGroupsChange={(groups) => setPreferences({ ...preferences, groups })}
            hideTimer={preferences.hideTimer}
            onHideTimerChange={(hideTimer) => setPreferences({ ...preferences, hideTimer })}
        >
            <AppText variant="small" style={styles.optionTitle}>Ngôn ngữ của từ</AppText>
            <Chips
                accessibilityLabel="Ngôn ngữ của từ"
                options={SUPPORTED_LANGUAGES.map((language) => ({ value: language.code, label: language.nativeName }))}
                value={preferences.language}
                onChange={(language) => setPreferences({ ...preferences, language })}
            />
            <AppText variant="small" style={styles.optionTitle}>Đếm ngược trước khi ghi nhớ</AppText>
            <Chips
                accessibilityLabel="Thời gian chuẩn bị"
                options={PREP_OPTIONS.map((seconds) => ({ value: seconds, label: seconds === 0 ? 'Không' : `${seconds} giây` }))}
                value={preferences.prepTime}
                onChange={(prepTime) => setPreferences({ ...preferences, prepTime })}
            />
        </GameOptions>
    );
}

// Đếm ngược chuẩn bị (tuỳ chọn): store đặt hạn chót cho phase này, hết giờ thì vào ghi nhớ
function PrepPhase() {
    const { phaseDeadline, beginMemorization, resetGame } = useWordsGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, beginMemorization);

    return (
        <SafeAreaView style={styles.prep}>
            <AppText variant="small" style={styles.overline}>Chuẩn bị ghi nhớ</AppText>
            <AppText variant="heading">Ván chơi sắp bắt đầu</AppText>
            <View style={styles.countdown} accessibilityLiveRegion="polite" accessibilityLabel={`Còn ${timeLeft} giây`}>
                <Animated.View key={timeLeft} entering={ZoomIn.duration(220).easing(ease.enter)}>
                    <AppText style={styles.countdownText}>{timeLeft}</AppText>
                </Animated.View>
            </View>
            <AppText variant="small" style={styles.center}>Hít thở sâu và sẵn sàng liên kết các từ thành một câu chuyện.</AppText>
            <Button title="Bắt đầu ngay" onPress={beginMemorization} />
            <Pressable onPress={resetGame} accessibilityRole="button" style={styles.cancel}>
                <AppText variant="small" style={styles.cancelLabel}>Huỷ ván</AppText>
            </Pressable>
        </SafeAreaView>
    );
}

function MemorizePhase() {
    const { rules, level, wordsToMemorize, currentMemorizeIndex, nextMemorizeWord, prevMemorizeWord, jumpMemorize, finishMemorize, phaseDeadline, preferences, resetGame, pending, error } =
        useWordsGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, () => void finishMemorize());
    const { width } = useWindowDimensions();

    const total = wordsToMemorize.length;
    const groupSize = Math.max(1, Math.min(MAX_GROUP, preferences.groups || 1));
    const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
    // Thẻ rộng hết khoảng giữa hai nút lật; nhóm nhiều từ thì thẻ thấp lại để vẫn vừa màn hình
    const cardWidth = width - 2 * 48 - 2 * spacing.sm - 16;
    const cardHeight = groupSize === 1 ? 160 : groupSize === 2 ? 120 : 96;

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Ghi nhớ thứ tự · từ ${shownTo}/${total}`}
            progress={total > 0 ? shownTo / total : 0}
            timeLeft={preferences.hideTimer ? undefined : timeLeft}
            actionLabel={pending === 'recall' ? 'Đang chuyển...' : 'Đã nhớ xong'}
            actionBusy={pending === 'recall'}
            onAction={() => void finishMemorize()}
            onExit={resetGame}
            pendingText={pending === 'recall' ? 'Đang chuẩn bị phần nhớ lại...' : null}
            error={error}
        >
            <MemorizeStage
                items={wordsToMemorize}
                index={currentMemorizeIndex}
                groupSize={groupSize}
                groupDirection="column"
                unit="Từ"
                onJump={jumpMemorize}
                onPrev={prevMemorizeWord}
                onNext={nextMemorizeWord}
                keyOf={(word, index) => `${word}-${index}`}
                miniWidth={MINI.width}
                renderBig={(word, index) => <WordCard word={word} index={index + 1} width={cardWidth} height={cardHeight} />}
                renderMini={(word, index, seen) =>
                    seen ? <WordCard word={word} index={index + 1} width={MINI.width} height={MINI.height} /> : <WordBack width={MINI.width} height={MINI.height} />
                }
            />
        </PlayLayout>
    );
}

function RecallPhase() {
    const { rules, level, wordsToMemorize, userAnswers, setAnswer, finishGame, phaseDeadline, resetGame, pending, error } = useWordsGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, () => void finishGame());
    const { width } = useWindowDimensions();

    const total = wordsToMemorize.length;
    const chain = useFocusChain(total);
    const filled = Object.values(userAnswers).filter((answer) => answer && answer.trim().length > 0).length;
    const cellWidth = Math.floor((width - spacing.md * 2 - RECALL_GAP * (RECALL_COLUMNS - 1)) / RECALL_COLUMNS);
    const locked = pending === 'submit' || timeLeft <= 0;

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Nhớ lại · đã điền ${filled}/${total} từ`}
            progress={total > 0 ? filled / total : 0}
            timeLeft={timeLeft}
            actionLabel={pending === 'submit' ? 'Đang chấm...' : 'Nộp bài'}
            actionBusy={pending === 'submit'}
            onAction={() => void finishGame()}
            onExit={resetGame}
            pendingText={pending === 'submit' ? 'Đang gửi bài và tính điểm...' : null}
            error={error}
        >
            <ScrollView ref={chain.scrollRef} contentContainerStyle={styles.recallList} keyboardShouldPersistTaps="handled">
                <AppText variant="small" style={styles.hint}>
                    Gõ lại các từ theo đúng thứ tự. Bấm &quot;Tiếp&quot; trên bàn phím để sang ô sau.
                </AppText>
                <View style={styles.recallGrid} {...chain.containerProps}>
                    {wordsToMemorize.map((_, index) => {
                        const value = userAnswers[index] ?? '';
                        return (
                            <View
                                key={index}
                                style={[styles.slot, { width: cellWidth }, value.trim() ? styles.slotFilled : null]}
                                {...chain.itemProps(index)}
                            >
                                <AppText variant="small" style={styles.slotNo}>{index + 1}</AppText>
                                <TextInput
                                    {...chain.inputProps(index)}
                                    value={value}
                                    onChangeText={(text) => setAnswer(index, text)}
                                    editable={!locked}
                                    accessibilityLabel={`Từ thứ ${index + 1}`}
                                    autoFocus={index === 0}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="off"
                                    spellCheck={false}
                                    maxLength={100}
                                    style={styles.input}
                                />
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </PlayLayout>
    );
}

function ResultPhase() {
    const { result, level, resetGame, startGame, pending, error } = useWordsGameStore();
    const { game } = useGameCatalog('word');
    if (!result) return null;

    const { result: roundResult, rules } = result;
    const review = roundResult.perItem.map((item) => ({
        expected: item.expected.label || item.expected.code,
        answer: item.answer ? item.answer.label || item.answer.code : null,
        correct: item.correct,
    }));

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={rules.mode === 'daily'}
            status={`Kết quả · đúng ${roundResult.correctItems}/${roundResult.totalItems} từ`}
            progress={roundResult.accuracy}
            onExit={resetGame}
            confirmExit={false}
            pendingText={pending === 'start' ? 'Đang chuẩn bị ván mới...' : null}
            error={error}
        >
            <RoundResult
                round={result}
                maxLevel={game?.maxLevel ?? 10}
                busy={pending !== null}
                onPlayAgain={() =>
                    void startGame({
                        memorizeSec: rules.memorizeLimitSec,
                        gameLevel: rules.gameLevel ?? 1,
                        customWordCount: rules.mode === 'custom' ? rules.totalItems : null,
                    })
                }
                onNextLevel={(nextLevel) => void startGame({ memorizeSec: rules.memorizeLimitSec, gameLevel: nextLevel, customWordCount: null })}
                onReset={resetGame}
            >
                <View style={styles.reviewHead}>
                    <AppText variant="heading">Chi tiết câu trả lời</AppText>
                    <AppText variant="small">{roundResult.correctItems}/{roundResult.totalItems} từ đúng</AppText>
                </View>
                {review.map((item, index) => {
                    const answered = item.answer !== null && item.answer.trim().length > 0;
                    return (
                        <View
                            key={index}
                            style={[styles.reviewRow, item.correct ? styles.rowCorrect : styles.rowWrong]}
                            accessibilityLabel={`${index + 1}. ${item.expected}. Bạn nhập: ${answered ? item.answer : 'bỏ trống'}. ${item.correct ? 'Đúng' : 'Sai'}`}
                        >
                            <AppText variant="small" style={styles.reviewIndex}>{index + 1}</AppText>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.expected}>{item.expected}</AppText>
                                {answered ? (
                                    <AppText variant="small" style={item.correct ? styles.answerCorrect : styles.answerWrong}>
                                        Bạn nhập: {item.answer}
                                    </AppText>
                                ) : (
                                    <AppText variant="small" style={styles.blank}>(Bỏ trống)</AppText>
                                )}
                            </View>
                            {item.correct ? <Check color={colors.brand} size={18} /> : <X color={colors.danger} size={18} />}
                        </View>
                    );
                })}
            </RoundResult>
        </PlayLayout>
    );
}

const styles = StyleSheet.create({
    optionTitle: { fontFamily: fonts.semibold, color: colors.ink },
    prep: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.wall },
    overline: { fontFamily: fonts.bold, color: colors.brandDeep, textTransform: 'uppercase' },
    countdown: { width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: colors.brand, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
    countdownText: { fontFamily: fonts.extrabold, fontSize: 56, lineHeight: 64, color: colors.brandDeep },
    center: { textAlign: 'center', maxWidth: 280 },
    cancel: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.md },
    cancelLabel: { fontFamily: fonts.semibold, color: colors.inkSoft },
    recallList: { padding: spacing.md, gap: spacing.sm },
    hint: { color: colors.ink },
    recallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: RECALL_GAP },
    slot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 10,
        borderRadius: radius,
        borderWidth: 1.5,
        borderColor: colors.step,
        backgroundColor: colors.white,
    },
    slotFilled: { borderColor: colors.brand, backgroundColor: '#eef8f0' },
    slotNo: { fontFamily: fonts.bold, minWidth: 18 },
    input: { flex: 1, minHeight: 48, paddingRight: 10, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
    reviewHead: { gap: 4, marginTop: spacing.sm },
    reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius, borderWidth: 1 },
    rowCorrect: { backgroundColor: '#eef8f0', borderColor: colors.mint },
    rowWrong: { backgroundColor: '#fdecea', borderColor: '#f5c2bd' },
    reviewIndex: { width: 24, textAlign: 'center', fontFamily: fonts.bold },
    expected: { fontFamily: fonts.bold },
    answerCorrect: { color: colors.brandDeep, fontFamily: fonts.semibold },
    answerWrong: { color: colors.danger, textDecorationLine: 'line-through' },
    blank: { fontStyle: 'italic' },
});
