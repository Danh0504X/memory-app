import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { CardBack } from '@/features/cards-game/components/PlayingCard';
import { PhotoBack } from '@/features/images-game/components/PhotoTile';
import { GAME_IDS, GAME_META } from '@/features/dashboard/constants';
import { formatWhen } from '@/features/dashboard/utils/format';
import type { GameId, GameSession } from '@/features/dashboard/types';

const FAN_MAX = 7;

interface ContinueTableProps {
    games: GameCatalogItem[];
    sessions: GameSession[] | null;
    timeZone: string;
    recommended: GameId;
}

// Khối chính của trang: bàn xanh như trong game, gợi ý trò và cấp nên chơi tiếp, bấm một lần là vào
export const ContinueTable = ({ games, sessions, timeZone, recommended }: ContinueTableProps) => {
    const [chosen, setChosen] = useState<GameId>(recommended);
    const game = games.find((item) => item.gameName === chosen);
    if (!game) return null;

    const meta = GAME_META[chosen];
    const level = Math.min(game.player?.unlockedLevel ?? 1, game.maxLevel);
    const items = game.levels[level - 1]?.itemCount ?? 0;
    const last = sessions?.find((session) => session.game === chosen);
    const fanCount = Math.min(items, FAN_MAX);

    let goal = 'Đây là cấp cao nhất, thử ghi nhớ nhanh hơn để phá kỷ lục.';
    if (level < game.maxLevel) {
        goal =
            game.unlockOn === 'perfect'
                ? `Nhớ đúng cả ${items} ${meta.unit} để mở cấp ${level + 1}.`
                : `Đúng từ ${Math.round(game.passAccuracy * 100)}% để mở cấp ${level + 1}.`;
    }

    return (
        <section className="today-table" aria-labelledby="continue-title">
            <div className="today-table__top">
                <h2 id="continue-title">Chơi tiếp</h2>
                <div className="today-switch" role="group" aria-label="Chọn trò chơi">
                    {GAME_IDS.map((id) => (
                        <button key={id} type="button" aria-pressed={id === chosen} onClick={() => setChosen(id)}>
                            {GAME_META[id].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="today-table__body">
                <div className="today-table__info">
                    <p className="today-table__game">
                        {meta.label} · Cấp {level}
                    </p>
                    <p className="today-table__count">
                        <strong>{items}</strong>
                        <span>{meta.unit} cần nhớ</span>
                    </p>
                    <p className="today-table__note">
                        {last
                            ? `Lần trước: đúng ${last.correctItems}/${last.totalItems} ${meta.unit}, ${formatWhen(last.playedAt, timeZone).toLowerCase()}. `
                            : 'Bạn chưa chơi trò này. '}
                        {goal}
                    </p>
                    <div className="today-table__actions">
                        <Link to={meta.route} viewTransition className="btn btn--sun">
                            <Play size={18} aria-hidden="true" />
                            {last ? `Chơi cấp ${level}` : 'Chơi ván đầu tiên'}
                        </Link>
                        <Link to="/games" viewTransition className="today-table__more">
                            Tất cả trò chơi
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                {/* key theo trò: đổi trò thì xấp bài được chia lại */}
                <div className="today-fan" key={chosen} aria-hidden="true">
                    {Array.from({ length: fanCount }, (_, i) => (
                        <span key={i} style={{ '--o': i - (fanCount - 1) / 2, '--i': i } as CSSProperties}>
                            {chosen === 'card' ? <CardBack size="md" /> : <PhotoBack size="md" />}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    );
};
