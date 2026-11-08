import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Flame, Medal, RotateCcw, Star } from "lucide-react";
import type { CompletedRound, RecordKey, RoundResult } from "../api/games.api";
import { formatSeconds } from "../utils/formatTime";
import { Confetti } from "./Confetti";

const VERDICTS: Record<RoundResult, string> = {
  perfect: "Hoàn hảo!",
  pass: "Đạt rồi!",
  fail: "Chưa đạt",
};

const RECORD_LABELS: Record<RecordKey, string> = {
  bestLevel: "Cấp cao nhất mới",
  fastestMemorize: "Ghi nhớ nhanh nhất ở cấp này",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Số đúng đếm dần từ 0 lên
const useCountUp = (target: number, ms = 800) => {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, ms]);

  return value;
};

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

interface RoundResultCardProps {
  round: CompletedRound;
  maxLevel: number;
  onPlayAgain: () => void;
  onReset: () => void;
}

// Kết quả và phần thưởng đều do backend chấm, bảng điểm này chỉ hiển thị
export const RoundResultCard = ({
  round,
  maxLevel,
  onPlayAgain,
  onReset,
}: RoundResultCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  // rewards null: ván của khách, không có EXP, kỷ lục hay chuỗi ngày chơi
  const { result, rewards, rules } = round;
  const unlockedLevel = round.unlockedLevel ??
    rewards?.unlockedLevel ?? {
      before: rules.gameLevel ?? 1,
      after: rules.gameLevel ?? 1,
    };
  const percentage = Math.round(result.accuracy * 100);
  const shown = useCountUp(result.correctItems);
  const unlocked = unlockedLevel.after > unlockedLevel.before;
  // Chơi lại cấp đã vượt qua thì không mở thêm cấp nào
  const isReplay =
    rules.mode === "level" &&
    rules.gameLevel !== null &&
    rules.gameLevel < unlockedLevel.before;
  const leveledUp =
    rewards !== null && rewards.userLevel.after > rewards.userLevel.before;
  const conqueredMax =
    result.result === "perfect" &&
    rules.mode === "level" &&
    rules.gameLevel === maxLevel;
  const celebrate = result.result !== "fail";
  // Ván thử thách ngày: không mở cấp, kết quả vào bảng xếp hạng; nút chính dẫn tới bảng xếp hạng
  const isDaily = rules.mode === "daily";
  const primaryAction = useCallback(() => {
    if (!isDaily) {
      onPlayAgain();
      return;
    }
    onReset();
    navigate("/daily");
  }, [isDaily, onPlayAgain, onReset, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") primaryAction();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [primaryAction]);

  let line =
    "Nhớ đúng tất cả để mở khoá cấp độ mới. Thử nối chúng thành một câu chuyện rồi chơi lại nhé.";
  if (unlocked) line = `Bạn đã mở khoá cấp độ ${unlockedLevel.after}.`;
  else if (conqueredMax) line = "Bạn đã chinh phục cấp độ cao nhất!";
  else if (result.result === "perfect" || isReplay)
    line = "Đúng hết. Thử ghi nhớ nhanh hơn ở lần sau nhé.";
  else if (result.result === "pass")
    line = "Đúng hết tất cả mới mở được cấp độ mới. Còn chút nữa thôi!";
  if (isDaily) line = "Kết quả của bạn đã vào bảng xếp hạng hôm nay.";

  return (
    <section
      className="play__table score"
      data-result={result.result}
      aria-labelledby="score-verdict"
    >
      {celebrate && <Confetti />}

      <h1 id="score-verdict" className="score__verdict" style={rise(0)}>
        {VERDICTS[result.result]}
      </h1>
      <p className="score__count" style={rise(1)}>
        <span aria-hidden="true">{shown}</span>
        <small aria-hidden="true"> / {result.totalItems} đúng</small>
        <span className="sr-only">
          Đúng {result.correctItems} trên {result.totalItems}, độ chính xác{" "}
          {percentage}%
        </span>
      </p>
      <div className="score__meter" style={rise(2)} aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <p className="score__line" style={rise(3)}>
        Độ chính xác <strong>{percentage}%</strong>. {line}
      </p>

      {rewards ? (
        <ul className="rewards" style={rise(4)} aria-label="Phần thưởng">
          <li className="reward reward--exp">+{rewards.exp.total} EXP</li>
          {rewards.newRecords.map((record) => (
            <li key={record} className="reward">
              <Medal size={16} aria-hidden="true" />
              {RECORD_LABELS[record]}
            </li>
          ))}
          {leveledUp && (
            <li className="reward">
              <Star size={16} aria-hidden="true" />
              Lên cấp tài khoản {rewards.userLevel.after}
            </li>
          )}
          {rewards.streak.currentStreak > 0 && (
            <li className="reward">
              <Flame size={16} aria-hidden="true" />
              Chuỗi {rewards.streak.currentStreak} ngày
            </li>
          )}
        </ul>
      ) : (
        <p className="score__note" style={rise(4)}>
          Bạn đang chơi với tư cách khách nên ván này không tính EXP, kỷ lục hay
          chuỗi ngày chơi.{" "}
          {/* Thoát ván trước khi rời trang, để đăng nhập xong quay lại màn chọn cấp độ */}
          <Link to="/login" state={{ from: location }} onClick={onReset}>
            Đăng nhập
          </Link>{" "}
          để lưu tiến độ.
        </p>
      )}

      <div className="score__actions" style={rise(5)}>
        <button type="button" onClick={primaryAction} className="btn btn--sun">
          {isDaily
            ? "Xem bảng xếp hạng"
            : unlocked
              ? `Chơi cấp độ ${unlockedLevel.after}`
              : "Chơi ván mới"}
          {isDaily || unlocked ? (
            <ArrowRight size={18} aria-hidden="true" />
          ) : (
            <RotateCcw size={18} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            onReset();
            navigate("/games");
          }}
          className="btn btn--on-table"
        >
          Chọn trò khác
        </button>
      </div>

      <p className="score__meta" style={rise(6)}>
        Ghi nhớ {formatSeconds(result.memorizeSec)} · Nhớ lại{" "}
        {formatSeconds(result.recallSec)} · Nhấn Enter để chơi tiếp
      </p>
    </section>
  );
};
