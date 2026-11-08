import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { ResultReview } from "@/features/shared-game/components/ResultReview";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useGameStore } from "../store/gameStore";
import { cardFromCode } from "../utils/cardUtils";
import { PlayingCard } from "./PlayingCard";

export const ResultPhase = () => {
    const { result, resetGame, level, startGame, pending } = useGameStore();
    const { game } = useGameCatalog("card");

    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const perItem = result.result.perItem.map((item) => ({
        expected: cardFromCode(item.expected.code),
        answer: item.answer ? cardFromCode(item.answer.code) : null,
        correct: item.correct,
    }));

    return (
        <div className="play">
            <GameHeader
                gameName="Thẻ bài"
                level={level}
                daily={result.rules.mode === "daily"}
                status={`Kết quả · đúng ${result.result.correctItems} trên ${result.result.totalItems} lá`}
                progress={result.result.accuracy}
                onReset={resetGame}
            />

            <RoundResultCard
                round={result}
                maxLevel={game?.maxLevel ?? 0}
                onPlayAgain={() => void startGame({ memorizeSec: result.rules.memorizeLimitSec,
                    customCardCount: result.rules.mode === "custom" ? result.rules.totalItems : null,
                    gameLevel: result.rules.gameLevel ?? 1 })}
                onNextLevel={(gameLevel) => void startGame({ memorizeSec: result.rules.memorizeLimitSec, customCardCount: null, gameLevel })}
                busy={pending !== null}
                onReset={resetGame}
            />

            <ResultReview
                items={perItem}
                unit="lá"
                renderItem={(card) => <PlayingCard card={card} size="sm" />}
                emptySize={{ width: 54, height: 76 }}
            />
        </div>
    );
};
