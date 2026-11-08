import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import candle from '@/assets/memio/guides/num-1-candle.svg';
import swan from '@/assets/memio/guides/num-2-swan.svg';
import butterfly from '@/assets/memio/guides/num-3-butterfly.svg';
import boat from '@/assets/memio/guides/num-4-boat.svg';
import hook from '@/assets/memio/guides/num-5-hook.svg';
import boomerang from '@/assets/memio/guides/num-7-boomerang.svg';
import type { UserProfile } from '../api/profile.api';

type Badge = {
    id: string;
    number: number;     // Con số của huy hiệu; hình là hình móc số của chính con số đó
    shape: string;
    motion: string;
    title: string;
    current: number;
    target: number;
    unit: (value: number) => string;
};

// Huy hiệu dựng hoàn toàn từ dữ liệu backend đã có: chuỗi dài nhất, cấp tài khoản, cấp đã mở và số ván mỗi trò
const buildBadges = (profile: UserProfile, games: GameCatalogItem[]): Badge[] => {
    const played = games.map((game) => game.player?.played ?? 0);
    const totalPlayed = played.reduce((sum, count) => sum + count, 0);
    const gamesTried = played.filter((count) => count > 0).length;
    const highestUnlocked = Math.max(1, ...games.map((game) => game.player?.unlockedLevel ?? 1));

    return [
        { id: 'first', number: 1, shape: candle, motion: 'flicker', title: 'Ván đầu tiên', current: totalPlayed, target: 1, unit: (v) => `${v}/1 ván` },
        { id: 'both', number: 2, shape: swan, motion: 'glide', title: 'Thử cả 2 trò', current: gamesTried, target: 2, unit: (v) => `${v}/2 trò` },
        { id: 'streak3', number: 3, shape: butterfly, motion: 'flap', title: 'Chuỗi 3 ngày', current: profile.longestStreak, target: 3, unit: (v) => `${v}/3 ngày` },
        { id: 'account4', number: 4, shape: boat, motion: 'rock', title: 'Cấp tài khoản 4', current: profile.level.level, target: 4, unit: (v) => `Cấp ${v}/4` },
        { id: 'level5', number: 5, shape: hook, motion: 'swing', title: 'Mở cấp 5', current: highestUnlocked, target: 5, unit: (v) => `Cấp ${v}/5` },
        { id: 'streak7', number: 7, shape: boomerang, motion: 'spin', title: 'Chuỗi 7 ngày', current: profile.longestStreak, target: 7, unit: (v) => `${v}/7 ngày` },
    ];
};

export const Achievements = ({ profile, games }: { profile: UserProfile; games: GameCatalogItem[] }) => {
    const badges = buildBadges(profile, games);
    const earned = badges.filter((badge) => badge.current >= badge.target).length;

    return (
        <>
            <p className="dash-muted badges__count">
                {earned} trên {badges.length} huy hiệu. Mỗi huy hiệu mang hình của chính con số trên nó.
            </p>
            <ul className="badges">
                {badges.map((badge) => {
                    const done = badge.current >= badge.target;
                    return (
                        <li key={badge.id} className="badge" data-earned={done}>
                            <span className="badge__art">
                                <img src={badge.shape} alt="" className="shape" data-motion={badge.motion} />
                                <span className="badge__number" aria-hidden="true">{badge.number}</span>
                            </span>
                            <span className="badge__title">{badge.title}</span>
                            <span className="badge__progress">
                                {done ? 'Đã đạt' : badge.unit(Math.min(badge.current, badge.target))}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </>
    );
};
