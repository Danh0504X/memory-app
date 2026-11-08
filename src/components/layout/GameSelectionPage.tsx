import { useEffect, type CSSProperties, type ReactNode } from "react";
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
import { useAuthStore } from "@/features/auth/store/authStore";
import { useNumbersProgress } from "@/features/numbers-game/hooks/useNumbersProgress";
import { useFaceNameStore } from "@/features/facename-game/store/faceNameStore";
import { useWordsGameStore, DEFAULT_WORDS_LEVELS } from "@/features/words-game";
import "@/features/shared-game/game.css";

const FAN_CARDS: Card[] = [
    { rank: "A", suit: "spades" },
    { rank: "7", suit: "hearts" },
    { rank: "Q", suit: "clubs" },
    { rank: "3", suit: "diamonds" },
    { rank: "K", suit: "hearts" },
];

const FAN_PICTURES = [cat, umbrella, cake, bicycle];

const FAN_DIGITS = ["2", "0", "8", "5", "1"];

const FAN_FACES = ["John", "Mary", "David", "Linh", "Mai"];
const FACE_LEVEL_COUNTS = [6, 8, 10, 12, 14, 16, 18, 22, 26, 30];

const FAN_WORDS = ["Bồ câu", "Hải đăng", "Kim tự tháp", "Gió mùa", "Hoa sen"];

const spread = (i: number, count: number) => ({ "--o": i - (count - 1) / 2 }) as CSSProperties;

// Tiến độ hiện trên thẻ; null khi chưa có (khách, hoặc chưa tải được)
interface PickProgress {
    unlocked: number;
    maxLevel: number;
    nextCount?: number;
    played?: number;
}

const fromCatalog = (game: GameCatalogItem | null): PickProgress | null => {
    if (!game) return null;
    const unlocked = game.player?.unlockedLevel ?? 1;
    return { unlocked, maxLevel: game.maxLevel, nextCount: game.levels[unlocked - 1]?.itemCount, played: game.player?.played };
};

interface GamePickProps {
    to: string;
    variant: "cards" | "images" | "numbers" | "facename" | "words";
    title: string;
    description: string;
    unit: string;
    progress: PickProgress | null;
    note?: string;  // Dòng thay cho số liệu, ví dụ trò cần đăng nhập
    fan: ReactNode;
}

// Một trò chơi: bàn có bài xoè (xoè rộng hơn khi rê chuột), mô tả, tiến độ và nút chơi tiếp
const GamePick = ({ to, variant, title, description, unit, progress, note, fan }: GamePickProps) => {
    const unlocked = progress?.unlocked ?? 1;
    const maxLevel = progress?.maxLevel ?? 10;
    const nextCount = progress?.nextCount;

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
                    {progress?.played !== undefined && (
                        <div>
                            <dt>Đã chơi</dt>
                            <dd>{progress.played} ván</dd>
                        </div>
                    )}
                </dl>
                {note && <p className="pick__note">{note}</p>}
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
    const numbers = useNumbersProgress();
    const faceStats = useFaceNameStore((state) => state.stats);
    const faceLevels = useFaceNameStore((state) => state.levels);
    const initFace = useFaceNameStore((state) => state.initialize);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        initFace();
    }, [initFace]);

    const faceUnlocked = faceStats.unlockedLevel || 1;
    const faceNextCount = faceLevels?.[faceUnlocked - 1]?.faceCount ?? FACE_LEVEL_COUNTS[faceUnlocked - 1] ?? 6;

    const wordsUnlocked = useWordsGameStore((state) => state.unlockedLevel) || 1;
    const wordsNextCount = DEFAULT_WORDS_LEVELS[wordsUnlocked - 1]?.itemCount ?? 6;

    return (
        <>
            <Header />
            <main className="arcade page-col">
                <div className="arcade__head">
                    <h1>Chọn trò chơi</h1>
                    <p>Năm trò, mỗi trò mười cấp. Luyện nhớ thứ tự, chữ số, từ vựng và gương mặt.</p>
                </div>

                <div className="arcade__games">
                    <GamePick
                        to="/games/words"
                        variant="words"
                        title="Ghi nhớ từ"
                        description="Ghi nhớ danh sách từ vựng theo thứ tự, rồi tự gõ lại từng từ chính xác."
                        unit="từ"
                        progress={{
                            unlocked: wordsUnlocked,
                            maxLevel: 10,
                            nextCount: wordsNextCount,
                        }}
                        fan={FAN_WORDS.map((word, i) => (
                            <span key={word} className="pwordtile" style={spread(i, FAN_WORDS.length)}>
                                {word}
                            </span>
                        ))}
                    />
                    <GamePick
                        to="/games/facename"
                        variant="facename"
                        title="Gương mặt & Tên"
                        description="Gắn một tên gọi với một gương mặt, rồi nhớ lại khi vị trí được xáo trộn."
                        unit="người"
                        progress={{
                            unlocked: faceUnlocked,
                            maxLevel: 10,
                            nextCount: faceNextCount,
                            played: faceStats.totalRounds,
                        }}
                        fan={FAN_FACES.map((name, i) => (
                            <span key={name} className="pfacetile" style={spread(i, FAN_FACES.length)}>
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} alt="" />
                            </span>
                        ))}
                    />
                    <GamePick
                        to="/games/cards"
                        variant="cards"
                        title="Thẻ bài"
                        description="Nhớ thứ tự các lá bài, rồi tìm lại chúng trong bộ 52 lá."
                        unit="lá"
                        progress={fromCatalog(cardGame)}
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
                        progress={fromCatalog(imageGame)}
                        fan={FAN_PICTURES.map((src, i) => (
                            <span key={src} className="ptile" data-size="md" style={spread(i, FAN_PICTURES.length)}>
                                <img src={src} alt="" />
                            </span>
                        ))}
                    />
                    <GamePick
                        to="/games/numbers"
                        variant="numbers"
                        title="Ghi nhớ số"
                        description="Nhớ một dãy chữ số dài theo đúng thứ tự, rồi gõ lại từng số."
                        unit="chữ số"
                        progress={
                            numbers
                                ? {
                                      unlocked: numbers.unlockedLevel,
                                      maxLevel: numbers.digitCounts.length,
                                      nextCount: numbers.digitCounts[numbers.unlockedLevel - 1],
                                  }
                                : null
                        }
                        note={isAuthenticated ? undefined : "Cần đăng nhập để chơi và lưu tiến độ."}
                        fan={FAN_DIGITS.map((digit, i) => (
                            <span key={i} className="pick__digit" style={spread(i, FAN_DIGITS.length)}>
                                {digit}
                            </span>
                        ))}
                    />
                </div>
            </main>
        </>
    );
};

export default GameSelectionPage;
