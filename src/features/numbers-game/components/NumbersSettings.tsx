import { router } from 'expo-router';
import { BookOpen, Info, SlidersHorizontal } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Stepper } from '@/components/ui/Stepper';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Chips } from '@/features/shared-game/components/Chips';
import { LevelGrid } from '@/features/shared-game/components/LevelGrid';
import { LevelTableSheet } from '@/features/shared-game/components/LevelTableSheet';
import { DealBand, GuestNote, SectionTitle, SetupPanel, ToolButton, ToolRow, levelLabel, setupStyles, toneOf } from '@/features/shared-game/components/SetupParts';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { isValidGroups } from '../utils/numberUtils';

// Như bản web (NumbersSettingsPhase): dùng khi chưa tải được luật từ backend
const DEFAULT_DIGIT_COUNTS = [8, 12, 18, 24, 30, 40, 50, 60, 70, 80];
const TIME_OPTIONS = [30, 60, 120, 300];
const STANDARD_RECALL_SEC = 240;
const CHALLENGE = { digits: 80, memorizeSec: 60, recallSec: 240 };
const PREP_OPTIONS = [0, 3, 5, 10, 20];

type Mode = 'standard' | 'custom' | 'challenge';
const MODES: { value: Mode; label: string }[] = [
    { value: 'standard', label: 'Tiêu chuẩn' },
    { value: 'custom', label: 'Tùy chỉnh' },
    { value: 'challenge', label: 'Thử thách' },
];
const tone = toneOf('number');

export function NumbersSettings() {
    const { progress, busy, prepare } = useNumbersGameStore();
    const { game } = useGameCatalog('number');
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [mode, setMode] = useState<Mode>('standard');
    const [level, setLevel] = useState<number | null>(null);
    const [standardMemorize, setStandardMemorize] = useState(60);
    const [custom, setCustom] = useState({ count: 8, memorize: 60, recall: 240 });
    const [panel, setPanel] = useState<'guide' | 'options' | null>(null);
    const [showLevels, setShowLevels] = useState(false);

    const digitCounts = game?.levels.map((item) => item.itemCount) ?? progress?.digitCounts ?? DEFAULT_DIGIT_COUNTS;
    const maxLevel = digitCounts.length;
    const timeOptions = game?.memorizeSecOptions ?? TIME_OPTIONS;
    const selectedMemorize = timeOptions.includes(standardMemorize) ? standardMemorize : (game?.defaultMemorizeSec ?? 60);
    const unlocked = Math.min(maxLevel, game?.player?.unlockedLevel ?? progress?.unlockedLevel ?? 1);
    const selectedLevel = Math.min(level ?? unlocked, unlocked);
    const today = progress?.todayChallenge;
    const challengeDone = mode === 'challenge' && !!today?.played;
    const challengeNeedsLogin = mode === 'challenge' && !isAuthenticated;
    // Tài khoản dùng API riêng của game số (5–300 giây); khách dùng luồng chung với giới hạn của catalog
    const memorizeRange = isAuthenticated ? { min: 5, max: 300 } : { min: game?.customTimeRange?.min ?? 10, max: game?.customTimeRange?.max ?? 600 };
    const customMemorize = Math.max(memorizeRange.min, Math.min(memorizeRange.max, custom.memorize));

    const digitCount = mode === 'standard' ? (digitCounts[selectedLevel - 1] ?? 8) : mode === 'challenge' ? CHALLENGE.digits : custom.count;
    const memorizeSec = mode === 'standard' ? selectedMemorize : mode === 'challenge' ? CHALLENGE.memorizeSec : customMemorize;
    const recallSec = mode === 'standard' ? (game?.recallSec ?? STANDARD_RECALL_SEC) : mode === 'challenge' ? CHALLENGE.recallSec : custom.recall;

    const start = () => {
        if (challengeDone || challengeNeedsLogin) return;
        prepare(
            mode === 'challenge'
                ? { mode: 'challenge', prepareRecall: true }
                : {
                      mode: 'practice',
                      prepareRecall: true,
                      ...(mode === 'standard' ? { level: selectedLevel } : { digitCount: custom.count }),
                      memorizeSeconds: memorizeSec,
                      recallSeconds: recallSec,
                  },
        );
    };

    let goal = 'Đây là cấp cao nhất. Thử ghi nhớ nhanh hơn để phá kỷ lục!';
    if (mode === 'standard' && selectedLevel < unlocked) goal = `Chơi lại để luyện tập. Chỉ ván ở cấp ${unlocked} mới mở cấp tiếp theo.`;
    else if (mode === 'standard' && selectedLevel < maxLevel) goal = `Nhớ đúng hết để mở cấp ${selectedLevel + 1}.`;
    else if (mode === 'custom') goal = 'Ván tự chọn để luyện tập, không mở cấp mới.';
    else if (mode === 'challenge') goal = 'Mỗi ngày một lượt. Bắt đầu rồi thì lượt được tính.';

    const toggle = (name: 'guide' | 'options') => setPanel((open) => (open === name ? null : name));

    return (
        <Screen
            edges={['bottom']}
            footer={<Button title="Bắt đầu" tone={tone} loading={busy} disabled={challengeDone || challengeNeedsLogin} onPress={start} />}
        >
            <Chips accessibilityLabel="Chế độ chơi" options={MODES} value={mode} onChange={setMode} tone={tone.color} />

            <DealBand
                game="number"
                overline={mode === 'standard' ? `Cấp ${selectedLevel} · ${levelLabel(selectedLevel)}` : mode === 'custom' ? 'Ván tự chọn' : 'Thử thách hôm nay'}
                count={digitCount}
                unit="chữ số cần nhớ"
                line={`Ghi nhớ ${formatSeconds(memorizeSec)} · Gõ lại ${formatSeconds(recallSec)}`}
            />

            <AppText style={setupStyles.goal}>{goal}</AppText>

            {mode === 'standard' ? (
                <>
                    <View style={styles.section}>
                        <SectionTitle title="Cấp độ" note={`Đã mở ${unlocked}/${maxLevel}`} />
                        <LevelGrid
                            levels={digitCounts.map((count, index) => ({ level: index + 1, count }))}
                            unlockedLevel={unlocked}
                            selectedLevel={selectedLevel}
                            shortUnit="số"
                            tone={tone}
                            onSelect={setLevel}
                        />
                    </View>
                    <View style={styles.section}>
                        <SectionTitle title="Thời gian ghi nhớ" />
                        <Chips
                            accessibilityLabel="Thời gian ghi nhớ"
                            options={timeOptions.map((seconds) => ({ value: seconds, label: formatSeconds(seconds) }))}
                            value={selectedMemorize}
                            onChange={setStandardMemorize}
                            tone={tone.color}
                        />
                    </View>
                </>
            ) : null}

            {mode === 'custom' ? (
                <SetupPanel>
                    <AppText variant="small" style={styles.title}>Số chữ số</AppText>
                    <Stepper value={custom.count} min={4} max={80} onChange={(count) => setCustom({ ...custom, count })} format={(value) => `${value} số`} label="số chữ số" />
                    <AppText variant="small" style={styles.title}>Thời gian ghi nhớ</AppText>
                    <Stepper
                        value={customMemorize}
                        min={memorizeRange.min}
                        max={memorizeRange.max}
                        step={5}
                        onChange={(memorize) => setCustom({ ...custom, memorize })}
                        format={(value) => `${value} giây`}
                        label="thời gian ghi nhớ"
                    />
                    <AppText variant="small" style={styles.title}>Thời gian gõ lại</AppText>
                    <Stepper value={custom.recall} min={10} max={600} step={10} onChange={(recall) => setCustom({ ...custom, recall })} format={(value) => `${value} giây`} label="thời gian gõ lại" />
                </SetupPanel>
            ) : null}

            {mode === 'challenge' ? (
                <SetupPanel>
                    <AppText variant="small">
                        Cố định {CHALLENGE.digits} chữ số, ghi nhớ {CHALLENGE.memorizeSec} giây, gõ lại {formatSeconds(CHALLENGE.recallSec)} (luật Memory League).
                    </AppText>
                    {challengeNeedsLogin ? (
                        <AppText variant="small">
                            Thử thách chỉ dành cho tài khoản.{' '}
                            <AppText variant="small" style={styles.link} onPress={() => router.push('/login')}>Đăng nhập</AppText> để chơi.
                        </AppText>
                    ) : today?.played ? (
                        <AppText variant="small" style={styles.title}>
                            Hôm nay bạn đã chơi{today.correctCount !== undefined ? `: đúng ${today.correctCount}/${today.digitCount ?? CHALLENGE.digits}` : ''}. Quay lại vào ngày mai nhé.
                        </AppText>
                    ) : null}
                </SetupPanel>
            ) : null}

            <ToolRow>
                <ToolButton icon={<BookOpen color={colors.brandDeep} size={20} />} label="Cách chơi" open={panel === 'guide'} onPress={() => toggle('guide')} />
                <ToolButton icon={<Info color={colors.brandDeep} size={20} />} label="Bảng cấp độ" onPress={() => setShowLevels(true)} />
                <ToolButton icon={<SlidersHorizontal color={colors.brandDeep} size={20} />} label="Tùy chọn" open={panel === 'options'} onPress={() => toggle('options')} />
            </ToolRow>
            {panel === 'guide' ? <Guide /> : null}
            {panel === 'options' ? <Options /> : null}
            <LevelTableSheet
                visible={showLevels}
                onClose={() => setShowLevels(false)}
                gameTitle="Ghi nhớ số"
                itemUnit="chữ số"
                levels={digitCounts.map((count, index) => ({ level: index + 1, itemCount: count }))}
                unlockedLevel={unlocked}
                unlockOn={game?.unlockOn ?? 'perfect'}
            />

            {!isAuthenticated && mode !== 'challenge' ? <GuestNote /> : null}
        </Screen>
    );
}

function Guide() {
    return (
        <SetupPanel>
            <GuideItem title="Ghi nhớ">Dãy số hiện theo từng nhóm. Chạm vào nhóm hoặc nút › để xem tiếp. Nhớ xong thì bấm "Đã nhớ xong": thời gian ghi nhớ dừng ngay lúc đó.</GuideItem>
            <GuideItem title="Gõ lại">Chạm một ô rồi gõ bằng bàn phím số bên dưới. Lỡ thiếu một số: "Chèn ô"; lỡ thừa: "Xoá ô". Đáp án được tự lưu khi bạn gõ.</GuideItem>
            <GuideItem title="Tính điểm">Mỗi chữ số đúng vị trí được một điểm. Đúng hết thì mở cấp tiếp theo. Bằng điểm thì ai ghi nhớ nhanh hơn giỏi hơn.</GuideItem>
            <AppText variant="small">Mẹo: đổi mỗi chữ số thành một hình (2 là thiên nga, 8 là người tuyết) rồi nối các hình thành câu chuyện.</AppText>
        </SetupPanel>
    );
}

// Tuỳ chọn lưu lại giữa các lần chơi (zustand persist): cách nhóm chữ số, đếm ngược, ẩn đồng hồ
function Options() {
    const { preferences, setPreferences } = useNumbersGameStore();
    const [groups, setGroups] = useState(preferences.groups);
    const valid = isValidGroups(groups);

    return (
        <SetupPanel>
            <AppText variant="small" style={styles.title}>Nhóm chữ số</AppText>
            <TextInput
                value={groups}
                onChangeText={(value) => {
                    setGroups(value);
                    // Chỉ lưu mẫu hợp lệ; mẫu đang gõ dở vẫn giữ trong ô
                    if (isValidGroups(value)) setPreferences({ ...preferences, groups: value });
                }}
                keyboardType="numbers-and-punctuation"
                accessibilityLabel="Nhóm chữ số"
                style={[styles.input, !valid && styles.inputError]}
            />
            <AppText variant="small" style={!valid ? { color: colors.danger } : null}>
                {valid ? 'Mẫu lặp lại, ví dụ 3 (3-3-3…), 2 2 hoặc 3 2.' : 'Nhập số từ 1 đến 9, cách nhau bằng dấu cách.'}
            </AppText>
            <AppText variant="small" style={styles.title}>Đếm ngược trước khi dãy số hiện ra</AppText>
            <Chips
                accessibilityLabel="Thời gian chuẩn bị"
                options={PREP_OPTIONS.map((seconds) => ({ value: seconds, label: seconds === 0 ? 'Không' : `${seconds} giây` }))}
                value={preferences.prepTime}
                onChange={(prepTime) => setPreferences({ ...preferences, prepTime })}
                tone={tone.color}
            />
            <View style={styles.switchRow}>
                <AppText variant="small" style={[styles.title, { flex: 1 }]}>Ẩn đồng hồ khi ghi nhớ</AppText>
                <Switch
                    value={preferences.hideTimer}
                    onValueChange={(hideTimer) => setPreferences({ ...preferences, hideTimer })}
                    trackColor={{ true: tone.color }}
                    accessibilityLabel="Ẩn đồng hồ khi ghi nhớ"
                />
            </View>
        </SetupPanel>
    );
}

function GuideItem({ title, children }: { title: string; children: ReactNode }) {
    return (
        <View style={{ gap: 2 }}>
            <AppText style={styles.title}>{title}</AppText>
            <AppText variant="small">{children}</AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { gap: spacing.sm },
    title: { fontFamily: fonts.semibold, color: colors.ink },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44 },
    input: { minHeight: 48, borderRadius: radius, borderWidth: 2, borderColor: colors.line, paddingHorizontal: 14, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink, backgroundColor: colors.wall },
    inputError: { borderColor: colors.danger },
});
