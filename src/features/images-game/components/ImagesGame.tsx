import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { spacing } from '@/constants/theme';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { GameOptions, MAX_GROUP } from '@/features/shared-game/components/GameOptions';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { PhotoBack, PhotoTile } from '@/features/shared-game/components/PhotoTile';
import { PlayLayout } from '@/features/shared-game/components/PlayLayout';
import { RecallBoard } from '@/features/shared-game/components/RecallBoard';
import { ReviewGrid, RoundResult } from '@/features/shared-game/components/RoundResult';
import { RoundSetup, RoundSetupStatus } from '@/features/shared-game/components/RoundSetup';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { useImagesGameStore } from '../store/imagesGameStore';
import type { ImageCard } from '../types/imageTypes';
import { imageFromView } from '../utils/imageUtils';

const GAME_NAME = 'Hình ảnh';
const keyOf = (image: ImageCard) => image.id;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(value)));
// Ô trả lời và bộ hình chia 4 cột trên điện thoại
const COLUMNS = 4;
const DECK_GAP = 6;

export function ImagesGame() {
    const phase = useImagesGameStore((state) => state.phase);

    return (
        <>
            {/* Đang chơi thì ẩn header và chặn vuốt lùi để không lỡ tay thoát ván */}
            <Stack.Screen options={{ title: GAME_NAME, headerShown: phase === 'idle', gestureEnabled: phase === 'idle' || phase === 'result' }} />
            {phase === 'memorize' ? <MemorizePhase /> : phase === 'recall' ? <RecallPhase /> : phase === 'result' ? <ResultPhase /> : <SettingsPhase />}
        </>
    );
}

function SettingsPhase() {
    const { game, status, error: catalogError, reload } = useGameCatalog('image');
    const { memorizeTime, setMemorizeTime, selectedLevel, setSelectedLevel, startGame, preferences, pending, error } = useImagesGameStore();

    if (!game) return <RoundSetupStatus status={status} error={catalogError} onRetry={() => void reload()} />;

    // Giá trị đang chọn có thể không còn hợp lệ khi luật ở backend thay đổi
    const memorizeSec = game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec;
    const range = game.customItems;
    const customImageCount = range && preferences.imageCount !== null ? clamp(preferences.imageCount, range.min, range.max) : null;

    return (
        <RoundSetup
            itemUnit="hình ảnh"
            shortUnit="hình"
            game={game}
            customItemCount={customImageCount}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            memorizeSec={memorizeSec}
            onMemorizeSecChange={setMemorizeTime}
            onStart={(gameLevel) => void startGame(memorizeSec, gameLevel, customImageCount)}
            // Store tải trước ảnh trước khi vào phase ghi nhớ: nút giữ trạng thái chờ trong lúc đó
            isStarting={pending === 'start'}
            error={error}
            renderBack={(width) => <PhotoBack width={width} />}
            options={<ImageOptions game={game} />}
        />
    );
}

function ImageOptions({ game }: { game: GameCatalogItem }) {
    const { preferences, setPreferences, selectedLevel } = useImagesGameStore();
    const range = game.customItems;
    const levelCount = game.levels[(selectedLevel ?? game.player?.unlockedLevel ?? 1) - 1]?.itemCount ?? range?.min ?? 1;
    const count = range ? clamp(preferences.imageCount ?? levelCount, range.min, range.max) : levelCount;

    return (
        <GameOptions
            unit="hình"
            groups={preferences.groups}
            onGroupsChange={(groups) => setPreferences({ ...preferences, groups })}
            hideTimer={preferences.hideTimer}
            onHideTimerChange={(hideTimer) => setPreferences({ ...preferences, hideTimer })}
            custom={
                range
                    ? {
                          enabled: preferences.imageCount !== null,
                          count,
                          min: range.min,
                          max: range.max,
                          onEnabledChange: (on) => setPreferences({ ...preferences, imageCount: on ? count : null }),
                          onCountChange: (imageCount) => setPreferences({ ...preferences, imageCount }),
                      }
                    : undefined
            }
        />
    );
}

function MemorizePhase() {
    const { imagesToMemorize, currentMemorizeIndex, nextMemorizeCard, prevMemorizeCard, finishMemorize, phaseDeadline, rules, level, resetGame, preferences, pending, error } =
        useImagesGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishMemorize);
    const { width } = useWindowDimensions();

    const total = imagesToMemorize.length;
    const groupSize = Math.max(1, Math.min(MAX_GROUP, preferences.groups || 1));
    const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
    // Bề rộng còn lại sau hai nút lật (48 mỗi bên) và lề; ảnh to nhất 300
    const room = width - 2 * 48 - 2 * spacing.sm - spacing.sm * (groupSize - 1);
    const bigWidth = Math.min(300, Math.floor(room / groupSize) - 8);

    return (
        <PlayLayout
            game="image"
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Ghi nhớ thứ tự · hình ${shownTo}/${total}`}
            progress={shownTo / total}
            timeLeft={preferences.hideTimer ? undefined : timeLeft}
            actionLabel={pending === 'recall' ? 'Đang chuyển...' : 'Đã nhớ xong'}
            actionBusy={pending === 'recall'}
            onAction={() => void finishMemorize()}
            onExit={resetGame}
            pendingText={pending === 'recall' ? 'Đang chuẩn bị phần nhớ lại...' : null}
            error={error}
        >
            <MemorizeStage
                items={imagesToMemorize}
                index={currentMemorizeIndex}
                groupSize={groupSize}
                unit="Hình"
                onJump={(index) => useImagesGameStore.setState({ currentMemorizeIndex: index })}
                onPrev={prevMemorizeCard}
                onNext={nextMemorizeCard}
                keyOf={keyOf}
                miniWidth={40}
                renderBig={(image, index) => <PhotoTile uri={image.imageUrl} width={bigWidth} label={`Hình ${index + 1}`} />}
                renderMini={(image, index, seen) => (seen ? <PhotoTile uri={image.imageUrl} width={40} label={`Hình ${index + 1}`} /> : <PhotoBack width={40} />)}
            />
        </PlayLayout>
    );
}

function RecallPhase() {
    const { imagesToMemorize, userRecall, shuffledDeck, selectedSlotIndex, phaseDeadline, rules, placeImage, removeImage, selectSlot, finishGame, resetGame, level, pending, error } =
        useImagesGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishGame);
    const { width } = useWindowDimensions();

    const total = imagesToMemorize.length;
    const filled = userRecall.filter(Boolean).length;
    const deckItemWidth = Math.floor((width - spacing.md * 2 - DECK_GAP * (COLUMNS - 1)) / COLUMNS);
    // Số thứ tự trong bộ hình xáo trộn, để trình đọc màn hình đọc được từng hình
    const labelOf = (image: ImageCard) => `hình ${shuffledDeck.findIndex((item) => item.id === image.id) + 1} trong bộ`;

    return (
        <PlayLayout
            game="image"
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Nhớ lại · đã xếp ${filled}/${total} hình`}
            progress={filled / total}
            timeLeft={timeLeft}
            actionLabel={pending === 'submit' ? 'Đang chấm...' : 'Nộp bài'}
            actionBusy={pending === 'submit'}
            onAction={() => void finishGame()}
            onExit={resetGame}
            pendingText={pending === 'submit' ? 'Đang chấm bài...' : null}
            error={error}
        >
            <RecallBoard<ImageCard>
                slots={userRecall}
                selectedIndex={selectedSlotIndex}
                unit="hình"
                slotsPerRow={COLUMNS}
                itemRatio={1}
                deckItemWidth={deckItemWidth}
                // Chạm lại ô đang chọn thì bỏ chọn, như game thẻ bài
                onSelectSlot={(index) => selectSlot(index === selectedSlotIndex ? null : index)}
                onClearSlot={removeImage}
                deckTitle={`Bộ hình · ${shuffledDeck.length} hình`}
                groups={[{ items: shuffledDeck }]}
                isUsed={(image) => userRecall.some((item) => item?.id === image.id)}
                onPick={placeImage}
                keyOf={keyOf}
                labelOf={labelOf}
                renderItem={(image, itemWidth) => <PhotoTile uri={image.imageUrl} width={itemWidth} label={labelOf(image)} />}
            />
        </PlayLayout>
    );
}

function ResultPhase() {
    const { result, resetGame, level, startGame, pending, error } = useImagesGameStore();
    const { game } = useGameCatalog('image');
    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const review = result.result.perItem.map((item) => ({
        expected: imageFromView(item.expected),
        answer: item.answer ? imageFromView(item.answer) : null,
        correct: item.correct,
    }));
    const memorizeSec = result.rules.memorizeLimitSec;

    return (
        <PlayLayout
            game="image"
            level={level}
            daily={result.rules.mode === 'daily'}
            status={`Kết quả · đúng ${result.result.correctItems}/${result.result.totalItems} hình`}
            progress={result.result.accuracy}
            onExit={resetGame}
            confirmExit={false}
            pendingText={pending === 'start' ? 'Đang chuẩn bị ảnh...' : null}
            error={error}
        >
            <RoundResult
                round={result}
                maxLevel={game?.maxLevel ?? 0}
                busy={pending !== null}
                onPlayAgain={() =>
                    void startGame(memorizeSec, result.rules.gameLevel ?? 1, result.rules.mode === 'custom' ? result.rules.totalItems : null)
                }
                onNextLevel={(gameLevel) => void startGame(memorizeSec, gameLevel, null)}
                onReset={resetGame}
            >
                <ReviewGrid<ImageCard>
                    items={review}
                    unit="hình"
                    perRow={COLUMNS}
                    itemRatio={1}
                    renderItem={(image, itemWidth) => <PhotoTile uri={image.imageUrl} width={itemWidth} label="" />}
                />
            </RoundResult>
        </PlayLayout>
    );
}
