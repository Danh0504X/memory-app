import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { PlayingCard } from "@/features/cards-game/components/PlayingCard";
import type { Card } from "@/features/cards-game/types/types";
import cat from "@/assets/memio/game/card-cat.svg";
import umbrella from "@/assets/memio/game/card-umbrella.svg";
import cake from "@/assets/memio/game/card-cake.svg";
import bicycle from "@/assets/memio/game/card-bicycle.svg";
import "@/features/shared-game/game.css";

const FAN_CARDS: Card[] = [
    { rank: "A", suit: "spades" },
    { rank: "7", suit: "hearts" },
    { rank: "Q", suit: "clubs" },
    { rank: "3", suit: "diamonds" },
    { rank: "K", suit: "hearts" },
];

const FAN_PICTURES = [cat, umbrella, cake, bicycle];

const spread = (i: number, count: number) => ({ "--o": i - (count - 1) / 2 }) as CSSProperties;

interface GamePickProps {
    to: string;
    variant: "cards" | "images";
    title: string;
    description: string;
    unit: string;
    game: GameCatalogItem | null;
    fan: ReactNode;
}

// Một trò chơi: bàn có bài xoè (xoè rộng hơn khi rê chuột), mô tả, tiến độ và nút chơi tiếp
const GamePick = ({ to, variant, title, description, unit, game, fan }: GamePickProps) => {
    const unlocked = game?.player?.unlockedLevel ?? 1;
    const maxLevel = game?.maxLevel ?? 10;
    const nextCount = game?.levels[unlocked - 1]?.itemCount;

    return (
        <Link to={to} viewTransition className={`pick pick--${variant}`} aria-label={`${title}: chơi cấp ${unlocked}`}>
            <div className="pick__table" aria-hidden="true">
                <div className="pick__fan">{fan}</div>
            </div>
            <div className="pick__body">
                <h2>{title}</h2>
                <p>{description}</p>
                <dl className="pick__facts">
                    <div>
                        <dt>Cấp đang mở</dt>
                        <dd>
                            {unlocked} / {maxLevel}
                        </dd>
                    </div>
                    {nextCount !== undefined && (
                        <div>
                            <dt>Ván tới</dt>
                            <dd>
                                {nextCount} {unit}
                            </dd>
                        </div>
                    )}
                    {game?.player && (
                        <div>
                            <dt>Đã chơi</dt>
                            <dd>{game.player.played} ván</dd>
                        </div>
                    )}
                </dl>
                <ol className="pick__ladder" aria-hidden="true">
                    {Array.from({ length: maxLevel }, (_, i) => (
                        <li key={i} data-on={i < unlocked} />
                    ))}
                </ol>
                <span className="btn btn--brand pick__cta">
                    {unlocked > 1 ? `Chơi tiếp cấp ${unlocked}` : "Chơi ngay"}
                    <ArrowRight size={18} aria-hidden="true" />
                </span>
            </div>
        </Link>
    );
};

export const GameSelectionPage = () => {
    const { game: cardGame } = useGameCatalog("card");
    const { game: imageGame } = useGameCatalog("image");

    return (
        <>
            <Header />
            <main className="arcade page-col">
                <div className="arcade__head">
                    <h1>Chọn trò chơi</h1>
                    <p>Hai trò, mỗi trò mười cấp. Nhớ thứ tự, rồi xếp lại cho đúng.</p>
                </div>

                <div className="arcade__games">
                    <GamePick
                        to="/games/cards"
                        variant="cards"
                        title="Thẻ bài"
                        description="Nhớ thứ tự các lá bài, rồi tìm lại chúng trong bộ 52 lá."
                        unit="lá"
                        game={cardGame}
                        fan={FAN_CARDS.map((card, i) => (
                            <span key={`${card.rank}${card.suit}`} style={spread(i, FAN_CARDS.length)}>
                                <PlayingCard card={card} size="md" />
                            </span>
                        ))}
                    />
                    <GamePick
                        to="/games/images"
                        variant="images"
                        title="Hình ảnh"
                        description="Nhớ thứ tự các bức ảnh, rồi xếp chúng lại từ một bộ đã xáo trộn."
                        unit="hình"
                        game={imageGame}
                        fan={FAN_PICTURES.map((src, i) => (
                            <span key={src} className="ptile" data-size="md" style={spread(i, FAN_PICTURES.length)}>
                                <img src={src} alt="" />
                            </span>
                        ))}
                    />
                </div>
            </main>
        </>
    );
};

export default GameSelectionPage;
