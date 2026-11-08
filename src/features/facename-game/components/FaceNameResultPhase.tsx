import { ArrowRight, Check, Minus, RotateCcw, X } from "lucide-react";
import { useFaceNameStore } from "../store/faceNameStore";
import { GameHeader } from "@/features/shared-game/components/GameHeader";
import { formatSeconds } from "@/features/shared-game/utils/formatTime";

export const FaceNameResultPhase = () => {
    const { result, memorizePeople, retryCurrentRound, goToNextLevel, goHome, currentLevelId } = useFaceNameStore();
    if (!result) return null;
    const next = result.nextLevelUnlocked;
    return <div className="play face-play">
        <GameHeader gameName="Gương mặt & Tên" level={result.mode === "level" ? currentLevelId : null} status="Kết quả lượt chơi" onReset={goHome} />
        <main className="face-results page-col">
            <section className="face-summary" aria-labelledby="face-verdict">
                <div>
                    <h1 id="face-verdict">{result.correctCount === result.maxScore ? "Nhớ trọn từng tên!" : result.isPassed ? "Bạn đã đạt!" : "Thử nhớ thêm một lần"}</h1>
                    <p>{result.mode === "free" ? "Ván tự chọn không mở cấp." : next ? `Cấp ${result.levelId! + 1} đã mở. Bạn có thể chơi tiếp.` : result.isPassed ? "Bạn đã đạt cấp cao nhất." : "Chưa đủ điểm qua cấp. Xem lại những tên còn nhầm bên dưới."}</p>
                </div>
                <p className="face-summary__score">{result.score}<span> / {result.maxScore} điểm</span></p>
                <dl className="face-summary__facts">
                    <div><dt>Nhớ đúng</dt><dd>{result.correctCount} người</dd></div>
                    <div><dt>Tên sai</dt><dd>{result.incorrectCount}</dd></div>
                    <div><dt>Bỏ trống</dt><dd>{result.blankCount}</dd></div>
                    <div><dt>Thời gian</dt><dd>{formatSeconds(result.timeUsedSeconds)}</dd></div>
                </dl>
                <div className="face-summary__actions">
                    {next && <button className="btn btn--brand" onClick={() => void goToNextLevel()}>Chơi cấp tiếp theo<ArrowRight size={18} aria-hidden="true" /></button>}
                    <button className={next ? "tool" : "btn btn--brand"} onClick={() => void retryCurrentRound()}><RotateCcw size={18} aria-hidden="true" />Chơi lại</button>
                    <button className="tool" onClick={goHome}>Chọn cấp độ</button>
                </div>
            </section>
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
