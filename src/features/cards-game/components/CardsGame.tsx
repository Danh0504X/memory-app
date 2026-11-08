import { Stack } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { spacing } from '@/constants/theme';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { GameOptions, MAX_GROUP } from '@/features/shared-game/components/GameOptions';
import { MemorizeStage } from '@/features/shared-game/components/MemorizeStage';
import { PlayLayout } from '@/features/shared-game/components/PlayLayout';
import { RecallBoard } from '@/features/shared-game/components/RecallBoard';
import { ReviewGrid, RoundResult } from '@/features/shared-game/components/RoundResult';
import { RoundSetup, RoundSetupStatus } from '@/features/shared-game/components/RoundSetup';
import { usePhaseTimer } from '@/features/shared-game/hooks/usePhaseTimer';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { useGameStore } from '../store/gameStore';
import type { Card, Suit } from '../types/types';
import { cardLabel, SUIT_LABELS, SUIT_SYMBOLS } from '../utils/cardLabels';
import { cardFromCode, clamp, isSameCard } from '../utils/cardUtils';
import { CardBack, PlayingCard } from './PlayingCard';

const GAME_NAME = 'Thẻ bài';
const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const keyOf = (card: Card) => `${card.rank}${card.suit}`;

export function CardsGame() {
    const phase = useGameStore((state) => state.phase);

    return (
        <>
            {/* Đang chơi thì ẩn header và chặn vuốt lùi để không lỡ tay thoát ván */}
            <Stack.Screen options={{ title: GAME_NAME, headerShown: phase === 'idle', gestureEnabled: phase === 'idle' || phase === 'result' }} />
            {phase === 'memorize' ? <MemorizePhase /> : phase === 'recall' ? <RecallPhase /> : phase === 'result' ? <ResultPhase /> : <SettingsPhase />}
        </>
    );
}

function SettingsPhase() {
    const { game, status, error: catalogError, reload } = useGameCatalog('card');
    const { memorizeTime, setMemorizeTime, selectedLevel, setSelectedLevel, startGame, preferences, pending, error } = useGameStore();

    if (!game) return <RoundSetupStatus status={status} error={catalogError} onRetry={() => void reload()} />;

    // Giá trị đã lưu có thể không còn hợp lệ khi luật ở backend thay đổi
    const memorizeSec = game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec;
    const customCardCount =
        game.customItems && preferences.cardCount !== null ? clamp(preferences.cardCount, game.customItems.min, game.customItems.max) : null;

    return (
        <RoundSetup
            itemUnit="lá bài"
            shortUnit="lá"
            game={game}
            customItemCount={customCardCount}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            memorizeSec={memorizeSec}
            onMemorizeSecChange={setMemorizeTime}
            onStart={(gameLevel) => void startGame({ memorizeSec, customCardCount, gameLevel })}
            isStarting={pending === 'start'}
            error={error}
            renderBack={(width) => <CardBack width={width} />}
            options={<CardOptions game={game} />}
        />
    );
}

// Tuỳ chọn lưu lại giữa các lần chơi (zustand persist): số lá mỗi lần xem, ẩn đồng hồ, ván tự chọn số lá
function CardOptions({ game }: { game: GameCatalogItem }) {
    const { preferences, setPreferences, selectedLevel } = useGameStore();
    const range = game.customItems;
    const levelCount = game.levels[(selectedLevel ?? game.player?.unlockedLevel ?? 1) - 1]?.itemCount ?? range?.min ?? 8;
    const count = range ? clamp(preferences.cardCount ?? levelCount, range.min, range.max) : levelCount;

    return (
        <GameOptions
            unit="lá"
            groups={preferences.groups}
            onGroupsChange={(groups) => setPreferences({ ...preferences, groups })}
            hideTimer={preferences.hideTimer}
            onHideTimerChange={(hideTimer) => setPreferences({ ...preferences, hideTimer })}
            custom={
                range
                    ? {
                          enabled: preferences.cardCount !== null,
                          count,
                          min: range.min,
                          max: range.max,
                          onEnabledChange: (on) => setPreferences({ ...preferences, cardCount: on ? count : null }),
                          onCountChange: (cardCount) => setPreferences({ ...preferences, cardCount }),
                      }
                    : undefined
            }
        />
    );
}

function MemorizePhase() {
    const { cardsToMemorize, currentMemorizeIndex, nextMemorizeCard, prevMemorizeCard, finishMemorize, phaseDeadline, rules, level, resetGame, preferences, pending, error } =
        useGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishMemorize);
    const { width } = useWindowDimensions();

    const total = cardsToMemorize.length;
    const groupSize = Math.max(1, Math.min(MAX_GROUP, preferences.groups || 1));
    const shownTo = Math.min(currentMemorizeIndex + groupSize, total);
    // Bề rộng còn lại sau hai nút lật (48 mỗi bên) và lề; lá to nhất 220
    const room = width - 2 * 48 - 2 * spacing.sm - spacing.sm * (groupSize - 1);
    const bigWidth = Math.min(220, Math.floor(room / groupSize) - 8);

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Ghi nhớ thứ tự · lá ${shownTo}/${total}`}
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
                items={cardsToMemorize}
                index={currentMemorizeIndex}
                groupSize={groupSize}
                unit="Lá"
                onJump={(index) => useGameStore.setState({ currentMemorizeIndex: index })}
                onPrev={prevMemorizeCard}
                onNext={nextMemorizeCard}
                keyOf={keyOf}
                miniWidth={30}
                renderBig={(card) => <PlayingCard card={card} width={bigWidth} />}
                renderMini={(card, _index, seen) => (seen ? <PlayingCard card={card} width={30} /> : <CardBack width={30} />)}
            />
        </PlayLayout>
    );
}

function RecallPhase() {
    const { cardsToMemorize, userRecall, deckCards, selectedSlotIndex, selectSlot, placeCard, removeCard, finishGame, phaseDeadline, rules, level, resetGame, pending, error } =
        useGameStore();
    const { timeLeft } = usePhaseTimer(phaseDeadline, finishGame);

    const total = cardsToMemorize.length;
    const filled = userRecall.filter(Boolean).length;
    // Bộ bài chia bốn hàng theo chất để tìm lá nhanh
    const groups = SUITS.map((suit) => ({
        label: `${SUIT_SYMBOLS[suit]} ${SUIT_LABELS[suit]}`,
        items: deckCards.filter((card) => card.suit === suit),
    })).filter((group) => group.items.length > 0);

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={rules?.mode === 'daily'}
            status={`Nhớ lại · đã xếp ${filled}/${total} lá`}
            progress={filled / total}
            timeLeft={timeLeft}
            actionLabel={pending === 'submit' ? 'Đang chấm...' : 'Nộp bài'}
            actionBusy={pending === 'submit'}
            onAction={() => void finishGame()}
            onExit={resetGame}
            pendingText={pending === 'submit' ? 'Đang chấm bài...' : null}
            error={error}
        >
            <RecallBoard<Card>
                slots={userRecall}
                selectedIndex={selectedSlotIndex}
                unit="lá"
                slotsPerRow={6}
                itemRatio={1.4}
                deckItemWidth={44}
                onSelectSlot={selectSlot}
                onClearSlot={removeCard}
                deckTitle={`Bộ bài · ${deckCards.length} lá`}
                groups={groups}
                isUsed={(card) => userRecall.some((placed) => isSameCard(placed, card))}
                onPick={placeCard}
                keyOf={keyOf}
                labelOf={cardLabel}
                renderItem={(card, width) => <PlayingCard card={card} width={width} />}
            />
        </PlayLayout>
    );
}

function ResultPhase() {
    const { result, resetGame, level, startGame, pending, error } = useGameStore();
    const { game } = useGameCatalog('card');
    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const review = result.result.perItem.map((item) => ({
        expected: cardFromCode(item.expected.code),
        answer: item.answer ? cardFromCode(item.answer.code) : null,
        correct: item.correct,
    }));
    const memorizeSec = result.rules.memorizeLimitSec;

    return (
        <PlayLayout
            gameName={GAME_NAME}
            level={level}
            daily={result.rules.mode === 'daily'}
            status={`Kết quả · đúng ${result.result.correctItems}/${result.result.totalItems} lá`}
            progress={result.result.accuracy}
            onExit={resetGame}
            confirmExit={false}
            pendingText={pending === 'start' ? 'Đang chia bài...' : null}
            error={error}
        >
            <RoundResult
                round={result}
                maxLevel={game?.maxLevel ?? 0}
                busy={pending !== null}
                onPlayAgain={() =>
                    void startGame({
                        memorizeSec,
                        customCardCount: result.rules.mode === 'custom' ? result.rules.totalItems : null,
                        gameLevel: result.rules.gameLevel ?? 1,
                    })
                }
                onNextLevel={(gameLevel) => void startGame({ memorizeSec, customCardCount: null, gameLevel })}
                onReset={resetGame}
            >
                <ReviewGrid<Card>
                    items={review}
                    unit="lá"
                    perRow={6}
                    itemRatio={1.4}
                    renderItem={(card, width) => <PlayingCard card={card} width={width} />}
                />
            </RoundResult>
        </PlayLayout>
    );
}

