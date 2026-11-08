import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { GAME_META } from '../constants';
import { formatPercent } from '../utils/format';
import type { GameSession } from '../types';

// Câu "cần gì để lên cấp", theo đúng luật mở cấp backend trả về (unlockOn)
const unlockRule = (game: GameCatalogItem, level: number) => {
    const { unit } = GAME_META[game.gameName];
    const items = game.levels[level - 1]?.itemCount ?? 0;
    return game.unlockOn === 'perfect'
        ? `Nhớ đúng cả ${items} ${unit} để mở cấp ${level + 1}.`
        : `Nhớ đúng từ ${Math.round(game.passAccuracy * 100)}% để mở cấp ${level + 1}.`;
};

// Ván tốt nhất ở cấp đang mở, tìm trong các ván gần đây đã tải
const bestAtLevel = (sessions: GameSession[], game: GameCatalogItem, level: number) =>
    sessions
        .filter((session) => session.game === game.gameName && session.level === level)
        .sort((a, b) => b.correctItems - a.correctItems)[0];

const LadderRow = ({ game, sessions }: { game: GameCatalogItem; sessions: GameSession[] }) => {
    const meta = GAME_META[game.gameName];
    const current = Math.min(game.player?.unlockedLevel ?? 1, game.maxLevel);
    const items = game.levels[current - 1]?.itemCount ?? 0;
    const best = bestAtLevel(sessions, game, current);
    const finished = game.player?.bestLevel === game.maxLevel;

    const note = finished
        ? `Đã hoàn thành cả ${game.maxLevel} cấp.`
        : `${
              best
                  ? `Tốt nhất ở cấp ${current}: ${best.correctItems}/${best.totalItems} ${meta.unit} (${formatPercent(best.accuracy)}).`
                  : `Chưa chơi cấp ${current}.`
          } ${current < game.maxLevel ? unlockRule(game, current) : 'Đây là cấp cao nhất.'}`;

    return (
        <li className="ladder__game">
            <div className="ladder__head">
                <h3>{meta.label}</h3>
                <p>
                    Cấp {current} · {items} {meta.unit}
                    <span className="ladder__played"> · {game.player?.played ?? 0} ván</span>
                </p>
            </div>
            <ol className="ladder__steps" aria-label={`${meta.label}: đang ở cấp ${current} trên ${game.maxLevel}`}>
                {game.levels.map(({ level, itemCount }) => {
                    const state = level < current || finished ? 'done' : level === current ? 'current' : 'locked';
                    return (
                        <li
                            key={level}
                            className="ladder__step"
                            data-state={state}
                            title={`Cấp ${level}: ${itemCount} ${meta.unit}`}
                        >
                            {level}
                        </li>
                    );
                })}
            </ol>
            <p className="ladder__note">{note}</p>
        </li>
    );
};

export const LevelLadder = ({ games, sessions }: { games: GameCatalogItem[]; sessions: GameSession[] }) => (
    <ul className="ladder">
        {games.map((game) => (
            <LadderRow key={game.gameName} game={game} sessions={sessions} />
        ))}
    </ul>
);
