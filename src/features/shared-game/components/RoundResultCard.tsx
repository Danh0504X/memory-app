import { useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Medal, RotateCcw, Star } from "lucide-react";
import type { CompletedRound, RecordKey, RoundResult } from "../api/games.api";
import { describeCompletedRound } from "../utils/completedRound";
import { formatSeconds } from "../utils/formatTime";
import { Confetti } from "./Confetti";

const VERDICTS: Record<RoundResult, string> = { perfect: "Hoàn hảo!", pass: "Đạt rồi!", fail: "Chưa đạt" };
const RECORD_LABELS: Record<RecordKey, string> = { bestLevel: "Cấp cao nhất mới", fastestMemorize: "Ghi nhớ nhanh nhất ở cấp này" };

interface RoundResultCardProps {
    round: CompletedRound;
    maxLevel: number;
    onPlayAgain: () => void;
    onReset: () => void;
    onNextLevel?: (level: number) => void;
    // Numbers has its own daily challenge; it does not lead to the global leaderboard.
    dailyHref?: string | null;
    note?: string;
    busy?: boolean;
}

export const RoundResultCard = ({ round, maxLevel, onPlayAgain, onReset, onNextLevel, dailyHref = "/daily", note, busy = false }: RoundResultCardProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { result, rewards, rules } = round;
    const summary = describeCompletedRound(round, maxLevel);
    const isDaily = rules.mode === "daily";
    const percentage = Math.round(result.accuracy * 1000) / 10;
    const primaryAction = useCallback(() => {
        if (busy) return;
        if (isDaily) {
            onReset();
            if (dailyHref) navigate(dailyHref);
        } else if (summary.nextLevel !== null && onNextLevel) onNextLevel(summary.nextLevel);
        else onPlayAgain();
    }, [busy, isDaily, dailyHref, navigate, onReset, onPlayAgain, onNextLevel, summary.nextLevel]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Enter" || event.repeat || event.defaultPrevented) return;
            if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select, [role='button']")) return;
            primaryAction();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [primaryAction]);

    return <section className="play__table score" data-result={result.result} aria-labelledby="score-verdict">
        {result.result !== "fail" && <Confetti />}
        <div className="score__hero">
            <div className="score__side score__side--left">
                {(percentage === 100 || result.result === "perfect") && (
                    <img
                        src="/profile-mascot-celebrating.svg"
                        alt="Chúc mừng hoàn hảo"
                        className="score__celebrating-mascot"
                    />
                )}
            </div>
            <div className="score__headline">
                <h1 id="score-verdict" className="score__verdict">{VERDICTS[result.result]}</h1>
                <p className="score__count">{summary.value}<small> / {summary.total} {summary.unit}</small></p>
            </div>
            <div className="score__side score__side--right" aria-hidden="true" />
        </div>
        <div className="score__meter" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
        <p className="score__line">Đúng <strong>{result.correctItems}/{result.totalItems}</strong> · Chính xác <strong>{percentage}%</strong>. {summary.message}</p>
        {note && <p className="score__note">{note}</p>}

        {rewards ? <>
            <ul className="rewards" aria-label="Phần thưởng">
                <li className="reward reward--exp">+{rewards.exp.total} EXP</li>
                {rewards.newRecords.map((record) => <li key={record} className="reward"><Medal size={16} aria-hidden="true" />{RECORD_LABELS[record]}</li>)}
                {rewards.userLevel.after > rewards.userLevel.before && <li className="reward"><Star size={16} aria-hidden="true" />Lên cấp tài khoản {rewards.userLevel.after}</li>}
                {rewards.streak.currentStreak > 0 && <li className="reward"><Flame size={16} aria-hidden="true" />Chuỗi {rewards.streak.currentStreak} ngày</li>}
            </ul>
            <details className="score__breakdown">
                <summary>Chi tiết EXP</summary>
                <dl>
                    <div><dt>Kết quả ván</dt><dd>+{rewards.exp.breakdown.round}</dd></div>
                    <div><dt>Nhớ hoàn hảo</dt><dd>+{rewards.exp.breakdown.perfectBonus}</dd></div>
                    <div><dt>Ván đầu ngày</dt><dd>+{rewards.exp.breakdown.firstGameOfDayBonus}</dd></div>
                    <div><dt>Kỷ lục mới</dt><dd>+{rewards.exp.breakdown.newRecordBonus}</dd></div>
                </dl>
            </details>
        </> : <p className="score__note">
            Bạn đang chơi với tư cách khách nên ván này không tính EXP, kỷ lục hay chuỗi ngày chơi.{" "}
            <Link to="/login" state={{ from: location }} onClick={onReset}>Đăng nhập</Link> để lưu tiến độ.
        </p>}

        <div className="score__actions">
            <button type="button" onClick={primaryAction} disabled={busy} className="btn btn--sun">
                {busy ? "Đang chuẩn bị…" : isDaily ? dailyHref ? "Xem bảng xếp hạng" : "Về thiết lập" : summary.nextLevel !== null ? `Chơi cấp ${summary.nextLevel}` : "Chơi lại"}
                {isDaily || summary.canPlayNext ? <ArrowRight size={18} aria-hidden="true" /> : <RotateCcw size={18} aria-hidden="true" />}
            </button>
            {!isDaily && summary.canPlayNext && onNextLevel && <button type="button" disabled={busy} className="btn btn--on-table" onClick={onPlayAgain}>Chơi lại cấp này</button>}
            <button type="button" disabled={busy} onClick={() => { onReset(); navigate("/games"); }} className="btn btn--on-table">Chọn trò khác</button>
        </div>
        <p className="score__meta">Ghi nhớ {formatSeconds(result.memorizeSec)} · Nhớ lại {formatSeconds(result.recallSec)} · Nhấn Enter để chơi tiếp</p>
    </section>;
};
