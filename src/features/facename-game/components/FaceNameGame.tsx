import { Stack } from 'expo-router';
import { BarChart3, BookOpen, Check, Minus, SlidersHorizontal, X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LevelGrid } from '@/features/shared-game/components/LevelGrid';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { PhotoBack, PhotoTile } from '@/features/shared-game/components/PhotoTile';
import { PlayLayout } from '@/features/shared-game/components/PlayLayout';
import { RoundResult } from '@/features/shared-game/components/RoundResult';
import { useFocusChain } from '@/features/shared-game/hooks/useFocusChain';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import { useFaceNameStore } from '../store/faceNameStore';
import type { Person } from '../types';

const GAME_NAME = 'Gương mặt & Tên';
// Giới hạn ván tự chọn, như bản web (FaceNameFreeConfigModal)
const FREE_FACES = { min: 3, max: 30 };
const FREE_SECONDS = { min: 10, max: 300 };
const SETUP_PHASES = ['home', 'level-select', 'free-config'];

export function FaceNameGame() {
    const { phase, initialize, isLoading, goHome } = useFaceNameStore();
    const userId = useAuthStore((state) => state.user?._id ?? null);

    // Mỗi lần mở trò hoặc đổi tài khoản: bỏ ván cũ, tải lại cấp đã mở từ backend
    useEffect(() => {
        goHome();
        void initialize();
        return goHome;
    }, [initialize, goHome, userId]);

    const setup = SETUP_PHASES.includes(phase);
    let content: ReactNode = <SettingsPhase />;
    if (phase === 'loading-faces' && isLoading) content = <LoadingFaces />;
    else if (phase === 'memorize') content = <MemorizePhase />;
    else if (phase === 'recall' || phase === 'submitting') content = <RecallPhase />;
    else if (phase === 'result') content = <ResultPhase />;

    return (
        <>
            {/* Đang chơi thì ẩn header và chặn vuốt lùi để không lỡ tay thoát ván */}
            <Stack.Screen options={{ title: GAME_NAME, headerShown: setup, gestureEnabled: setup || phase === 'result' }} />
            {content}
        </>
    );
}

function LoadingFaces() {
    return (
        <SafeAreaView style={styles.loading} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={colors.brand} />
            <AppText variant="heading">Đang chuẩn bị ván chơi...</AppText>
        </SafeAreaView>
    );
}

function SettingsPhase() {
    const { levels, stats, selectedLevel, setSelectedLevel, startLevelGame, startFreeGame, isLoading, errorMessage, initialize } = useFaceNameStore();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [panel, setPanel] = useState<'guide' | 'free' | 'stats' | null>(null);
    const [free, setFree] = useState({ faceCount: 10, memorizeSeconds: 60, recallSeconds: 120 });

    const maxLevel = levels.length || 10;
    const unlocked = Math.min(maxLevel, stats.unlockedLevel);
    const level = Math.min(selectedLevel ?? unlocked, unlocked);
    const config = levels.find((item) => item.levelId === level);
    const toggle = (name: 'guide' | 'free' | 'stats') => setPanel((open) => (open === name ? null : name));

    return (
        <Screen edges={['bottom']}>
            <AppText variant="lead">Nhớ gương mặt, gắn tên gọi. Gặp lại, bạn có nhận ra?</AppText>

            <View style={styles.deal}>
                <AppText variant="small" style={styles.overline}>
                    Cấp {level}
                    {config ? ` · ${config.nameType}` : ''}
                </AppText>
                {config ? (
                    <>
                        <AppText style={styles.count}>
                            {config.faceCount} <AppText variant="lead">gương mặt cần nhớ</AppText>
                        </AppText>
                        <AppText variant="small" style={styles.center}>
                            Ghi nhớ {formatSeconds(config.memorizeSeconds)} · Nhớ lại {formatSeconds(config.recallSeconds)} · Đạt từ{' '}
                            {config.requiredScore}/{config.faceCount} điểm
                        </AppText>
                    </>
                ) : (
                    <AppText variant="small">{isLoading ? 'Đang tải cấp độ...' : 'Chưa tải được cấp độ.'}</AppText>
                )}
            </View>

            {levels.length > 0 ? (
                <View style={styles.section}>
                    <AppText variant="heading">Cấp độ</AppText>
                    <AppText variant="small">
                        Đã mở {unlocked}/{maxLevel} cấp · Đã luyện {stats.totalRounds} ván. Chọn lại cấp đã mở để luyện tập.
                    </AppText>
                    <LevelGrid
                        levels={levels.map((item) => ({ level: item.levelId, count: item.faceCount }))}
                        unlockedLevel={unlocked}
                        selectedLevel={level}
                        shortUnit="người"
                        onSelect={setSelectedLevel}
                    />
                </View>
            ) : null}

            <View style={styles.tools}>
                <ToolButton icon={<BookOpen color={colors.brandDeep} size={18} />} label="Cách chơi" open={panel === 'guide'} onPress={() => toggle('guide')} />
                <ToolButton icon={<SlidersHorizontal color={colors.brandDeep} size={18} />} label="Ván tự chọn" open={panel === 'free'} onPress={() => toggle('free')} />
                <ToolButton icon={<BarChart3 color={colors.brandDeep} size={18} />} label="Thống kê" open={panel === 'stats'} onPress={() => toggle('stats')} />
            </View>

            {panel === 'guide' ? (
                <View style={styles.panel}>
                    <GuideItem title="Quan sát">Xem từng gương mặt và tên. Tìm một nét riêng để liên kết với tên gọi; thứ tự không cần nhớ.</GuideItem>
                    <GuideItem title="Nhớ lại">Gương mặt được xáo trộn. Gõ tên dưới mỗi người, bấm "Tiếp" trên bàn phím để sang ô sau. Hết giờ, bài được nộp tự động.</GuideItem>
                    <GuideItem title="Tính điểm">
                        Đúng +1, sai −0,5, bỏ trống 0. Không phân biệt chữ hoa và khoảng trắng ở hai đầu; cần giữ đúng dấu tiếng Việt.
                    </GuideItem>
                </View>
            ) : null}

            {panel === 'stats' ? <StatsPanel /> : null}

            {panel === 'free' ? (
                <View style={styles.panel}>
                    <AppText variant="small">Luyện theo nhịp của bạn. Ván tự chọn không mở cấp.</AppText>
                    <AppText variant="small" style={styles.optionTitle}>Số gương mặt</AppText>
                    <Stepper
                        value={free.faceCount}
                        min={FREE_FACES.min}
                        max={FREE_FACES.max}
                        onChange={(faceCount) => setFree({ ...free, faceCount })}
                        format={(value) => `${value} người`}
                        label="số gương mặt"
                    />
                    <AppText variant="small" style={styles.optionTitle}>Thời gian ghi nhớ</AppText>
                    <Stepper
                        value={free.memorizeSeconds}
                        min={FREE_SECONDS.min}
                        max={FREE_SECONDS.max}
                        step={10}
                        onChange={(memorizeSeconds) => setFree({ ...free, memorizeSeconds })}
                        format={(value) => `${value} giây`}
                        label="thời gian ghi nhớ"
                    />
                    <AppText variant="small" style={styles.optionTitle}>Thời gian nhớ lại</AppText>
                    <Stepper
                        value={free.recallSeconds}
                        min={FREE_SECONDS.min}
                        max={FREE_SECONDS.max}
                        step={10}
                        onChange={(recallSeconds) => setFree({ ...free, recallSeconds })}
                        format={(value) => `${value} giây`}
                        label="thời gian nhớ lại"
                    />
                    <Button
                        title="Bắt đầu ván tự chọn"
                        variant="secondary"
                        disabled={isLoading}
                        onPress={() => void startFreeGame(free.faceCount, free.memorizeSeconds, free.recallSeconds)}
                    />
                </View>
            ) : null}

            <AppText variant="body" style={styles.goal}>Đúng +1 điểm, sai −0,5 điểm, bỏ trống 0 điểm. Đạt điểm yêu cầu để mở cấp tiếp theo.</AppText>
            <AppText variant="small">
                {isAuthenticated
                    ? 'Tiến độ và lịch sử được lưu theo tài khoản. Mỗi ván nhận EXP và góp vào chuỗi ngày luyện tập.'
                    : 'Bạn đang chơi với tư cách khách: tiến độ chỉ giữ tạm trên máy này. Đăng nhập để lưu lịch sử và nhận EXP.'}
            </AppText>

            {errorMessage ? <AppText variant="small" style={styles.error} accessibilityRole="alert">{errorMessage}</AppText> : null}

            {config ? (
                <Button title="Bắt đầu" loading={isLoading} onPress={() => void startLevelGame(level)} />
            ) : (
                <Button title={isLoading ? 'Đang tải cấp độ...' : 'Tải lại cấp độ'} variant="secondary" disabled={isLoading} onPress={() => void initialize()} />
            )}
        </Screen>
    );
}

// Thống kê (bản web: FaceNameStatsModal). Số ván và cấp đã mở lấy từ backend; độ chính xác trung bình và
// điểm cao nhất từng cấp chỉ tính các ván đã chơi từ khi mở app (backend chưa trả hai số này)
function StatsPanel() {
    const { stats, levels } = useFaceNameStore();
    const average = stats.totalAccuracies.length
        ? Math.round(stats.totalAccuracies.reduce((sum, value) => sum + value, 0) / stats.totalAccuracies.length)
        : null;
    const best = levels.filter((level) => stats.bestScores[level.levelId] !== undefined);
    return (
        <View style={styles.panel}>
            <View style={styles.statRow}>
                <Stat label="Tổng ván" value={String(stats.totalRounds)} />
                <Stat label="Chính xác TB" value={average === null ? '—' : `${average}%`} />
                <Stat label="Đã vượt" value={`${stats.completedLevels.length} cấp`} />
            </View>
            {best.length ? (
                <>
                    <AppText variant="small" style={styles.optionTitle}>Điểm cao nhất từng cấp</AppText>
                    {best.map((level) => {
                        const score = stats.bestScores[level.levelId];
                        return (
                            <View key={level.levelId} style={styles.bestRow}>
                                <AppText style={styles.optionTitle}>Cấp {level.levelId}</AppText>
                                <AppText variant="small" style={{ flex: 1 }}>{level.nameType}</AppText>
                                <AppText style={styles.optionTitle}>{score > 0 ? `+${score}` : score}/{level.faceCount}</AppText>
                            </View>
                        );
                    })}
                </>
            ) : null}
            <AppText variant="small">Độ chính xác trung bình và điểm cao nhất tính các ván bạn chơi từ khi mở app.</AppText>
        </View>
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

function ToolButton({ icon, label, open, onPress }: { icon: ReactNode; label: string; open: boolean; onPress: () => void }) {
    return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }} style={[styles.tool, open && styles.toolOpen]}>
            {icon}
            <AppText style={styles.toolLabel}>{label}</AppText>
        </Pressable>
    );
}

function GuideItem({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 2 }}>
            <AppText style={styles.optionTitle}>{title}</AppText>
            <AppText variant="small">{children}</AppText>
        </View>
    );
}

function MemorizePhase() {
    const { memorizePeople, memorizeDeadline, currentMemorizeIndex, nextMemorizePerson, prevMemorizePerson, setMemorizeIndex, finishMemorize, goHome, currentMode, currentLevelId, isLoading, errorMessage } =
        useFaceNameStore();
    const { timeLeft } = usePhaseTimer(memorizeDeadline, finishMemorize);
    const { width } = useWindowDimensions();

    const total = memorizePeople.length;
    if (total === 0) return null;
    // Bề rộng còn lại sau hai nút lật (48 mỗi bên) và lề; ảnh to nhất 280
    const portrait = Math.min(280, width - 2 * 48 - 2 * spacing.sm - 16);

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={currentMode === 'level' ? currentLevelId : null}
            status={`Ghi nhớ tên · người ${currentMemorizeIndex + 1}/${total}`}
            progress={(currentMemorizeIndex + 1) / total}
            timeLeft={timeLeft}
            actionLabel={isLoading ? 'Đang chuyển...' : 'Đã nhớ xong'}
            actionBusy={isLoading}
            onAction={() => void finishMemorize()}
            onExit={goHome}
            pendingText={isLoading ? 'Đang chuẩn bị phần nhớ lại...' : null}
            error={errorMessage}
        >
            <MemorizeStage<Person>
                items={memorizePeople}
                index={currentMemorizeIndex}
                groupSize={1}
                unit="Người"
                onJump={setMemorizeIndex}
                onPrev={prevMemorizePerson}
                onNext={nextMemorizePerson}
                keyOf={(person) => String(person.id)}
                miniWidth={40}
                renderBig={(person) => (
                    <View style={styles.faceCard}>
                        <PhotoTile uri={person.imageUrl} width={portrait} label={person.name} />
                        <AppText style={styles.faceName}>{person.name}</AppText>
                    </View>
                )}
                renderMini={(person, _index, seen) => (seen ? <PhotoTile uri={person.imageUrl} width={40} label={person.name} /> : <PhotoBack width={40} />)}
            />
        </PlayLayout>
    );
}

const RECALL_COLUMNS = 2;
const RECALL_GAP = 12;

function RecallPhase() {
    const { recallPeople, userAnswers, updateAnswer, recallDeadline, submitCurrentRound, isSubmitting, goHome, currentMode, currentLevelId, errorMessage } = useFaceNameStore();
    const { timeLeft } = usePhaseTimer(recallDeadline, submitCurrentRound);
    const { width } = useWindowDimensions();
    const total = recallPeople.length;
    const chain = useFocusChain(total);
    const filled = Object.values(userAnswers).filter((value) => value.trim() !== '').length;
    const cardWidth = Math.floor((width - spacing.md * 2 - RECALL_GAP * (RECALL_COLUMNS - 1)) / RECALL_COLUMNS);
    const locked = isSubmitting || timeLeft <= 0;

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={currentMode === 'level' ? currentLevelId : null}
            status={`Nhớ lại · đã điền ${filled}/${total} người`}
            progress={total ? filled / total : 0}
            timeLeft={timeLeft}
            actionLabel={isSubmitting ? 'Đang chấm...' : 'Nộp bài'}
            actionBusy={isSubmitting}
            onAction={() => void submitCurrentRound()}
            onExit={goHome}
            pendingText={isSubmitting ? 'Đang chấm bài...' : null}
            error={errorMessage ? `${errorMessage} Bấm Nộp bài để thử lại.` : null}
        >
            <ScrollView ref={chain.scrollRef} contentContainerStyle={styles.recallList} keyboardShouldPersistTaps="handled">
                <AppText variant="small" style={styles.recallHint}>Gương mặt đã đổi chỗ. Bạn còn nhớ tên ai?</AppText>
                <View style={styles.recallGrid} {...chain.containerProps}>
                    {recallPeople.map((person, index) => (
                            <View key={person.id} style={[styles.recallCard, { width: cardWidth }]} {...chain.itemProps(index)}>
                                <AppText variant="small" style={styles.badge}>Người {index + 1}</AppText>
                                <PhotoTile uri={person.imageUrl} width={cardWidth - 16} label={`Người ${index + 1}`} />
                                <TextInput
                                    {...chain.inputProps(index)}
                                    value={userAnswers[person.id] ?? ''}
                                    onChangeText={(text) => updateAnswer(person.id, text)}
                                    editable={!locked}
                                    placeholder="Gõ tên..."
                                    placeholderTextColor="#8a94a3"
                                    accessibilityLabel={`Tên người ${index + 1}`}
                                    autoFocus={index === 0}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    autoComplete="off"
                                    spellCheck={false}
                                    maxLength={50}
                                    style={styles.input}
                                />
                            </View>
                    ))}
                </View>
            </ScrollView>
        </PlayLayout>
    );
}

function ResultPhase() {
    const { result, memorizePeople, retryCurrentRound, startLevelGame, goHome, currentLevelId, levels, isLoading } = useFaceNameStore();
    if (!result?.round) return null;

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={result.mode === 'level' ? currentLevelId : null}
            status="Kết quả lượt chơi"
            progress={result.round.result.accuracy}
            onExit={goHome}
            confirmExit={false}
        >
            <RoundResult
                round={result.round}
                maxLevel={levels.length}
                busy={isLoading}
                onPlayAgain={() => void retryCurrentRound()}
                onNextLevel={(level) => void startLevelGame(level)}
                onReset={goHome}
            >
                <View style={styles.reviewHead}>
                    <AppText variant="heading">Gặp lại từng người</AppText>
                    <AppText variant="small">{result.correctCount}/{result.maxScore} tên đúng · {result.accuracy}% chính xác</AppText>
                </View>
                {result.results.map((item, index) => {
                    const status = item.isCorrect ? 'Đúng' : item.isBlank ? 'Trống' : 'Sai';
                    const imageUrl = memorizePeople.find((person) => person.id === item.personId)?.imageUrl;
                    return (
                        <View
                            key={item.personId}
                            style={[styles.reviewRow, item.isCorrect ? styles.rowCorrect : item.isBlank ? null : styles.rowWrong]}
                            accessibilityLabel={`${index + 1}. ${item.name}. Bạn điền: ${item.isBlank ? 'chưa điền' : item.answer}. ${status}`}
                        >
                            <AppText variant="small" style={styles.reviewIndex}>{index + 1}</AppText>
                            {imageUrl ? <PhotoTile uri={imageUrl} width={52} label="" /> : null}
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.optionTitle}>{item.name}</AppText>
                                <AppText variant="small">Bạn điền: {item.isBlank ? 'Chưa điền' : item.answer}</AppText>
                            </View>
                            <View style={styles.reviewStatus}>
                                {item.isCorrect ? <Check color={colors.brand} size={16} /> : item.isBlank ? <Minus color={colors.inkSoft} size={16} /> : <X color={colors.danger} size={16} />}
                                <AppText variant="small" style={styles.optionTitle}>{status}</AppText>
                            </View>
                        </View>
                    );
                })}
            </RoundResult>
        </PlayLayout>
    );
}

const styles = StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.wall },
    deal: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.mint, borderRadius: radius * 1.5 },
    overline: { fontFamily: fonts.bold, color: colors.brandDeep },
    count: { fontFamily: fonts.extrabold, fontSize: 32, lineHeight: 40 },
    center: { textAlign: 'center' },
    section: { gap: spacing.sm },
    statRow: { flexDirection: 'row', gap: spacing.sm },
    stat: { flex: 1, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.wall, gap: 2 },
    statValue: { fontFamily: fonts.extrabold, fontSize: 20 },
    bestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.step },
    tools: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    tool: { flexGrow: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white },
    toolOpen: { borderColor: colors.brand, backgroundColor: colors.mint },
    toolLabel: { fontFamily: fonts.bold, color: colors.brandDeep },
    panel: { gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    optionTitle: { fontFamily: fonts.semibold, color: colors.ink },
    goal: { fontFamily: fonts.semibold },
    error: { color: colors.danger },
    faceCard: { alignItems: 'center', gap: spacing.sm },
    faceName: { fontFamily: fonts.extrabold, fontSize: 26, lineHeight: 32, textAlign: 'center' },
    recallList: { padding: spacing.md, gap: spacing.sm },
    recallHint: { color: colors.ink },
    recallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: RECALL_GAP },
    recallCard: { alignItems: 'center', gap: 6, padding: 8, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    badge: { alignSelf: 'flex-start', fontFamily: fonts.semibold },
    input: {
        alignSelf: 'stretch',
        minHeight: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: colors.step,
        paddingHorizontal: 10,
        fontFamily: fonts.regular,
        fontSize: 16,
        color: colors.ink,
        backgroundColor: colors.wall,
    },
    reviewHead: { gap: 4, marginTop: spacing.sm },
    reviewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.step },
    rowCorrect: { backgroundColor: '#eef8f0', borderColor: colors.mint },
    rowWrong: { backgroundColor: '#fdecea', borderColor: '#f5c2bd' },
    reviewIndex: { width: 20, textAlign: 'center', fontFamily: fonts.bold },
    reviewStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
