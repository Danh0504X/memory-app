import { Link } from 'react-router-dom';
import { GAME_META } from '@/features/dashboard/constants';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import type { UserProfile } from '../api/profile.api';
import { formatNumber, getLevelProgress } from '../utils/profileProgress';

// Khớp với EXP_RULES ở backend (memory-be/src/config/progression.ts); đổi ở đó thì sửa cả ở đây
const EXP_WAYS = [
    ['Mỗi lá hoặc hình nhớ đúng', '+3'],
    ['Ván hoàn hảo', '+10'],
    ['Ván đầu tiên trong ngày', '+10'],
    ['Lập kỷ lục mới', '+20'],
] as const;

export const LevelPanel = ({ profile }: { profile: UserProfile }) => {
    const progress = getLevelProgress(profile.level);

    return (
        <>
            <p className="figure-lead">
                Cấp {profile.level.level}
                <span className="figure-unit"> · {formatNumber(profile.exp)} EXP</span>
            </p>
            <div
                className="meter"
                role="progressbar"
                aria-label={`EXP trong cấp ${profile.level.level}`}
                aria-valuemin={0}
                aria-valuemax={profile.level.expForNextLevel}
                aria-valuenow={profile.level.expIntoLevel}
            >
                <span style={{ width: `${progress.percentage}%` }} />
            </div>
            <p className="dash-muted">
                {formatNumber(profile.level.expIntoLevel)}/{formatNumber(profile.level.expForNextLevel)} EXP · còn{' '}
                {formatNumber(progress.remaining)} EXP để lên cấp {progress.nextLevel}
            </p>

            <h3 className="exp-ways__title">Cách nhận EXP</h3>
            <dl className="exp-ways">
                {EXP_WAYS.map(([way, amount]) => (
                    <div key={way}>
                        <dt>{way}</dt>
                        <dd>{amount}</dd>
                    </div>
                ))}
            </dl>
            <p className="dash-muted">Ván chưa đạt vẫn nhận một nửa số EXP theo số đã nhớ đúng.</p>
        </>
    );
};

// Câu trạng thái của hôm nay, theo đúng các cờ backend trả về
const streakStatus = (profile: UserProfile) => {
    if (profile.playedToday) return 'Hôm nay bạn đã chơi rồi, chuỗi được giữ.';
    if (profile.streakExpired) return 'Chuỗi vừa bị gián đoạn. Chơi 1 ván hôm nay để bắt đầu lại.';
    if (profile.streaks > 0) return `Chơi 1 ván hôm nay để giữ chuỗi ${profile.streaks} ngày.`;
    return 'Chơi 1 ván để bắt đầu chuỗi ngày luyện tập.';
};

export const StreakSummary = ({ profile }: { profile: UserProfile }) => (
    <>
        <p className="figure-lead">
            {profile.streaks}
            <span className="figure-unit"> ngày liên tiếp</span>
        </p>
        <p className="streak-status" data-done={profile.playedToday}>
            {streakStatus(profile)}
        </p>
        <dl className="exp-ways">
            <div>
                <dt>Chuỗi dài nhất</dt>
                <dd>{profile.longestStreak} ngày</dd>
            </div>
            <div>
                <dt>Hôm nay</dt>
                <dd>{profile.playedToday ? 'Đã chơi' : 'Chưa chơi'}</dd>
            </div>
        </dl>
        <Link to="/dashboard" viewTransition className="dash-link">
            Xem lịch luyện tập 14 ngày →
        </Link>
    </>
);

// Cấp đang mở và số ván của từng trò, lấy từ danh sách trò chơi (GET /games)
export const GamesSummary = ({ games }: { games: GameCatalogItem[] }) => (
    <dl className="exp-ways">
        {games.map((game) => {
            const meta = GAME_META[game.gameName];
            const level = game.player?.unlockedLevel ?? 1;
            return (
                <div key={game.gameName}>
                    <dt>
                        <Link to={meta.route} viewTransition className="dash-link">
                            {meta.label}
                        </Link>
                    </dt>
                    <dd>
                        Cấp {level}/{game.maxLevel} · {game.player?.played ?? 0} ván
                    </dd>
                </div>
            );
        })}
    </dl>
);
