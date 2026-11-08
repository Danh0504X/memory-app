import { RoundResultCard } from "@/features/shared-game/components/RoundResultCard";
import { Check, Minus, X } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";

export const FaceNameResultPhase = () => {
    const { result, memorizePeople, retryCurrentRound, startLevelGame, goHome, currentLevelId, levels } = useFaceNameStore();
    if (!result?.round) return null;
    return <div className="play face-play">
        <GameHeader gameName="Gương mặt & Tên" level={result.mode === "level" ? currentLevelId : null} status="Kết quả lượt chơi" onReset={goHome} />
        <RoundResultCard round={result.round} maxLevel={levels.length}
            onPlayAgain={() => void retryCurrentRound()} onReset={goHome}
            onNextLevel={(level) => void startLevelGame(level)} />
        <main className="face-results page-col">
            <section className="face-review" aria-labelledby="face-review-title">
                <div className="face-review__head"><h2 id="face-review-title">Gặp lại từng người</h2><p>{result.correctCount}/{result.maxScore} tên đúng · {result.accuracy}% chính xác</p></div>
                <ol className="face-review__list">
                    {result.results.map((item, index) => <li key={item.personId} data-correct={item.isCorrect}>
                        <span className="face-review__index">{index + 1}</span>
                        <img src={memorizePeople.find((person) => person.id === item.personId)?.imageUrl} alt="" />
                        <div><strong>{item.name}</strong><p>Bạn điền: {item.isBlank ? "Chưa điền" : item.answer}</p></div>
                        <span className="face-review__status">
                            {item.isCorrect ? <Check size={16} aria-hidden="true" /> : item.isBlank ? <Minus size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}
                            {item.isCorrect ? "Đúng" : item.isBlank ? "Trống" : "Sai"}
                        </span>
                    </li>)}
                </ol>
            </section>
        </main>
    </div>;
};
