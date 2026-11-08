import { useAuthStore } from '@/features/auth/store/authStore';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import type { UserProfile } from '../api/profile.api';
import { formatNumber, getLevelProgress } from '../utils/profileProgress';
import { ExpHelp } from './ExpHelp';

interface ProfileHeaderProps {
    profile: UserProfile;
    games: GameCatalogItem[] | null;    // null khi danh sách trò chưa tải được: bỏ số ván
    badges: { earned: number; total: number } | null;
}

// Đầu trang hồ sơ: bạn là ai, đang ở cấp nào và còn bao xa tới cấp sau. Đổi tên nằm ở phần Tài khoản bên dưới.
export const ProfileHeader = ({ profile, games, badges }: ProfileHeaderProps) => {
    const email = useAuthStore((state) => state.user?.email);
    const { level, expIntoLevel, expForNextLevel } = profile.level;
    const progress = getLevelProgress(profile.level);
    const played = games?.reduce((sum, game) => sum + (game.player?.played ?? 0), 0);

    const facts = [
        played !== undefined && `${formatNumber(played)} ván đã chơi`,
        `chuỗi dài nhất ${profile.longestStreak} ngày`,
        badges && `${badges.earned}/${badges.total} huy hiệu`,
    ].filter(Boolean);

    const initial = profile.username?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="phead">
            <span className="phead__avatar" aria-hidden="true">{initial}</span>

            <div className="phead__who">
                <h1>{profile.username}</h1>
                {email && <p className="phead__email">{email}</p>}
                <p className="phead__facts">{facts.join(' · ')}</p>
            </div>

            <div className="phead__level">
                <p className="phead__badge">
                    Cấp <strong>{level}</strong>
                </p>
                <div
                    className="meter"
                    role="progressbar"
                    aria-label={`EXP trong cấp ${level}`}
                    aria-valuemin={0}
                    aria-valuemax={expForNextLevel}
                    aria-valuenow={expIntoLevel}
                >
                    <span style={{ width: `${progress.percentage}%` }} />
                </div>
                <p className="phead__exp">
                    {formatNumber(expIntoLevel)}/{formatNumber(expForNextLevel)} EXP · còn {formatNumber(progress.remaining)} EXP
                    để lên cấp {progress.nextLevel}
                </p>
                <ExpHelp />
            </div>
        </div>
    );
};
