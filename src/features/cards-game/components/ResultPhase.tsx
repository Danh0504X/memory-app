import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { ResultReview } from "@/features/shared-game/components/ResultReview";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useGameStore } from "../store/gameStore";
import { cardFromCode } from "../utils/cardUtils";
import { PlayingCard } from "./PlayingCard";

export const ResultPhase = () => {
    const { result, resetGame, level } = useGameStore();
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
                status={`Kết quả · đúng ${result.result.correctItems} trên ${result.result.totalItems} lá`}
                progress={result.result.accuracy}
                onReset={resetGame}
            />

            <RoundResultCard
                round={result}
                maxLevel={game?.maxLevel ?? 0}
                onPlayAgain={resetGame}
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
