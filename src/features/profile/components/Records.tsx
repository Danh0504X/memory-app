import { Link } from 'react-router-dom';
import { GAME_META } from '@/features/dashboard/constants';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import type { UserProfile } from '../api/profile.api';
import { formatNumber } from '../utils/profileProgress';

// Kỷ lục lấy từ số liệu backend giữ trọn đời (hồ sơ và danh sách trò), không suy ra từ vài tuần lịch sử gần đây
export const Records = ({ profile, games }: { profile: UserProfile; games: GameCatalogItem[] }) => (
    <dl className="records">
        <div>
            <dt>Chuỗi ngày dài nhất</dt>
            <dd>{profile.longestStreak} ngày</dd>
        </div>
        <div>
            <dt>Tổng EXP</dt>
            <dd>{formatNumber(profile.exp)}</dd>
        </div>
        {games.map((game) => {
            const meta = GAME_META[game.gameName];
            const best = game.player?.bestLevel ?? null;
            return (
                <div key={game.gameName}>
                    <dt>
                        <Link to={meta.route} viewTransition className="records__game">
                            {meta.label}
                        </Link>
                        <span className="records__sub">
                            Đã mở cấp {game.player?.unlockedLevel ?? 1}/{game.maxLevel} · {formatNumber(game.player?.played ?? 0)} ván
                        </span>
                    </dt>
                    <dd>{best ? `Hoàn hảo cấp ${best}` : <span className="records__none">Chưa có ván hoàn hảo</span>}</dd>
                </div>
            );
        })}
    </dl>
);
