import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { ResultReview } from "@/features/shared-game/components/ResultReview";
import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useImagesGameStore } from "../store/imagesGameStore";
import { imageFromView } from "../utils/imageUtils";
import { PhotoTile } from "./PhotoTile";

export const ImagesResultPhase = () => {
    const { result, resetGame, level } = useImagesGameStore();
    const { game } = useGameCatalog("image");

    if (!result) return null;

    // Đúng/sai từng vị trí do backend chấm
    const perItem = result.result.perItem.map((item) => ({
        expected: imageFromView(item.expected),
        answer: item.answer ? imageFromView(item.answer) : null,
        correct: item.correct,
    }));

    return (
        <div className="play">
            <GameHeader
                gameName="Hình ảnh"
                level={level}
                status={`Kết quả · đúng ${result.result.correctItems} trên ${result.result.totalItems} hình`}
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
                unit="hình"
                renderItem={(image) => <PhotoTile image={image} size="sm" label="" />}
                emptySize={{ width: 64, height: 64 }}
            />
        </div>
    );
};
