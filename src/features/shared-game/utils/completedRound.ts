import type { CompletedRound } from "../api/games.api";

// Results, rewards and unlocked levels are server facts; the UI only chooses their presentation.
export const describeCompletedRound = (round: CompletedRound, maxLevel: number) => {
    const { result, rules, rewards } = round;
    const unlocked = round.unlockedLevel ?? rewards?.unlockedLevel;
    const newLevel = !!unlocked && unlocked.after > unlocked.before;
    const canPlayNext = rules.mode === "level" && rules.gameLevel !== null && result.result !== "fail"
        && !!unlocked && unlocked.after > rules.gameLevel && rules.gameLevel < maxLevel;
    let message = "Xem lại những chỗ còn nhầm, rồi thử một lần nữa nhé.";
    if (rules.mode === "daily") message = "Kết quả thử thách hôm nay đã được ghi nhận.";
    else if (rules.mode === "custom") message = "Ván tự chọn để luyện tập, không mở cấp mới.";
    else if (newLevel) message = `Bạn đã mở khoá cấp ${unlocked!.after}.`;
    else if (rules.gameLevel === maxLevel && result.result !== "fail") message = "Bạn đang ở cấp cao nhất. Thử ghi nhớ nhanh hơn ở lần sau nhé.";
    else if (result.result === "perfect") message = "Bạn nhớ đúng toàn bộ. Thử ghi nhớ nhanh hơn ở lần sau nhé.";
    else if (rules.gameLevel !== null && unlocked && rules.gameLevel < unlocked.before) message = "Bạn đang luyện lại một cấp đã mở. Xem đối chiếu để sửa những chỗ còn nhầm.";
    else if (result.result === "pass") message = "Ván đạt yêu cầu, nhưng chưa mở thêm cấp. Bạn có thể chơi lại để cải thiện kết quả.";
    return { message, newLevel, canPlayNext, nextLevel: canPlayNext ? rules.gameLevel! + 1 : null,
        value: result.score ?? result.correctItems, total: result.maxScore ?? result.totalItems,
        unit: result.score !== undefined ? "điểm" : "đúng" };
};
