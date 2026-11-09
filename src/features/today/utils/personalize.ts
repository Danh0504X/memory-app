// Cá nhân hoá trang Hôm nay theo mục tiêu luyện tập người dùng đã chọn (hồ sơ → Mục tiêu luyện tập).
// Chỉ có hàm thuần, không import gì lúc chạy, để test bằng node --test và để mọi con số nằm ở một chỗ.
// Chưa đặt mục tiêu (bỏ qua hoặc chưa trả lời) thì mọi hàm trả về đúng cách cũ.

import type { TrainingGoal, TrainingPreferences } from '@/features/profile/api/profile.api';
import type { GameId, GameSession } from '@/features/dashboard/types';

// Mỗi mục tiêu ưu tiên những trò nào; "brain" (rèn trí não) xoay vòng đủ các trò
export const GOAL_GAMES: Record<TrainingGoal, GameId[]> = {
    language: ['word'],
    names: ['facename'],
    exam: ['word', 'image'],
    numbers: ['number', 'card'],
    brain: [],
};

// Tên mục tiêu dùng giữa câu ("hợp mục tiêu học ngoại ngữ")
export const GOAL_PHRASES: Record<TrainingGoal, string> = {
    language: 'học ngoại ngữ',
    names: 'nhớ tên người',
    exam: 'ôn thi',
    numbers: 'nhớ số',
    brain: 'rèn trí não',
};

// Một ván mất khoảng 5 phút: 5 phút → 1 ván, 15 → 3, 30 → 5
export const ROUNDS_FOR_MINUTES: Record<number, number> = { 5: 1, 15: 3, 30: 5 };

// Còn từ chừng này ngày trở xuống thì nhắc ôn thi gấp
export const EXAM_SOON_DAYS = 14;

export const hasGoals = (preferences: TrainingPreferences | null | undefined): preferences is TrainingPreferences =>
    preferences?.status === 'answered' && preferences.goals.length > 0;

// Các trò hợp mục tiêu, theo thứ tự ưu tiên; rỗng nghĩa là trò nào cũng được
export const goalGames = (preferences: TrainingPreferences | null | undefined): GameId[] => {
    if (!hasGoals(preferences) || preferences.goals.includes('brain')) return [];
    return [...new Set(preferences.goals.flatMap((goal) => GOAL_GAMES[goal]))];
};

export interface Recommendation {
    game: GameId;
    // Vì sao gợi ý trò này; null khi không có mục tiêu (cách cũ)
    reason: string | null;
}

const goalForGame = (preferences: TrainingPreferences, game: GameId) =>
    preferences.goals.find((goal) => GOAL_GAMES[goal].includes(game));

// Trò nên chơi tiếp.
// Không có mục tiêu: trò vừa chơi gần nhất, chưa chơi gì thì trò Hình ảnh (dễ nhất).
// Có mục tiêu: trong các trò hợp mục tiêu, chọn trò lâu chưa chơi nhất (chưa chơi lần nào đứng đầu),
// để mấy trò cùng mục tiêu được luyện đều; hoà thì theo thứ tự ưu tiên của mục tiêu.
export const recommendGame = (
    sessions: GameSession[] | null,
    preferences: TrainingPreferences | null | undefined,
    allGames: readonly GameId[],
): Recommendation => {
    if (!hasGoals(preferences)) return { game: sessions?.[0]?.game ?? 'image', reason: null };

    const preferred = goalGames(preferences);
    const candidates = preferred.length > 0 ? preferred : [...allGames];
    const lastPlayed = (game: GameId) => sessions?.find((session) => session.game === game)?.playedAt.getTime() ?? -Infinity;
    const game = candidates.reduce((best, current) => (lastPlayed(current) < lastPlayed(best) ? current : best));

    const goal = preferred.length > 0 ? goalForGame(preferences, game) : undefined;
    const reason = goal ? `Hợp mục tiêu ${GOAL_PHRASES[goal]} của bạn.` : 'Xen kẽ các trò để rèn đều trí nhớ.';
    return { game, reason };
};

// Số ván nên chơi mỗi ngày theo thời gian đã chọn; không có mục tiêu thì 1 ván (giữ chuỗi ngày)
export const roundsPerDay = (preferences: TrainingPreferences | null | undefined) =>
    hasGoals(preferences) && preferences.dailyMinutes ? (ROUNDS_FOR_MINUTES[preferences.dailyMinutes] ?? 1) : 1;

const keyToUtc = (key: string) => Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

// Số ngày tới kỳ thi (0 là hôm nay); null khi không đặt mục tiêu ôn thi, không có ngày hoặc ngày đã qua
export const daysUntilExam = (preferences: TrainingPreferences | null | undefined, todayKey: string): number | null => {
    if (!hasGoals(preferences) || !preferences.goals.includes('exam') || !preferences.targetDate) return null;
    const days = Math.round((keyToUtc(preferences.targetDate) - keyToUtc(todayKey)) / (24 * 60 * 60 * 1000));
    return days >= 0 ? days : null;
};

// Một dòng nhắc kỳ thi dưới lời chào; gần ngày thi thì nhắc gấp
export const examLine = (days: number | null, rounds: number): { text: string; urgent: boolean } | null => {
    if (days === null) return null;
    if (days === 0) return { text: 'Hôm nay là ngày thi. Chúc bạn làm bài thật tốt!', urgent: false };
    if (days <= EXAM_SOON_DAYS) {
        return { text: `Còn ${days} ngày tới kỳ thi: luyện đủ ${rounds} ván mỗi ngày để giữ nhịp ôn.`, urgent: true };
    }
    return { text: `Còn ${days} ngày tới kỳ thi.`, urgent: false };
};

// Cách nhớ hợp với từng trò, để "Cách ôn hôm nay" khớp với ván được gợi ý:
// dãy hình/từ/tên nối thành câu chuyện, lá bài (số + chất) đặt vào căn phòng, dãy số đổi thành hình.
export const METHOD_FOR_GAME: Record<GameId, 'story' | 'numbers' | 'loci'> = {
    image: 'story',
    word: 'story',
    facename: 'story',
    card: 'loci',
    number: 'numbers',
};
