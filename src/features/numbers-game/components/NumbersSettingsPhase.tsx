import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, BookOpen, Check, Info, LoaderCircle, Lock, Play, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PhotoBack } from '@/features/images-game/components/PhotoTile';
import { ChoiceGroup, GameDialog, SettingRow, Switch } from '@/features/shared-game/components/GameDialog';
import { formatSeconds } from '@/features/shared-game/utils/formatTime';
import { useGameCatalog } from '@/features/shared-game/store/gameCatalogStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { isValidGroups } from '../utils/numberUtils';
import type { NumberPreferences } from '../types/numberTypes';

const DEFAULT_DIGIT_COUNTS = [8, 12, 18, 24, 30, 40, 50, 60, 70, 80];
const TIME_OPTIONS = [30, 60, 120, 300];
const STANDARD_RECALL_SEC = 240;
const CHALLENGE = { digits: 80, memorizeSec: 60, recallSec: 240 };
const FAN_MAX = 9;
const MODES = [
    ['standard', 'Tiêu chuẩn'],
    ['custom', 'Tùy chỉnh'],
    ['challenge', 'Thử thách'],
] as const;
type Mode = (typeof MODES)[number][0];

const getLevelLabel = (level: number) => {
    if (level <= 3) return 'Mức căn bản';
    if (level <= 6) return 'Mức trung cấp';
    return 'Mức nâng cao';
};

const Preferences = ({ onClose }: { onClose: () => void }) => {
    const { preferences, setPreferences } = useNumbersGameStore();
    const [draft, setDraft] = useState<NumberPreferences>(preferences);
    const valid = isValidGroups(draft.groups);

    return (
        <GameDialog
            title="Tùy chọn"
            subtitle="Ghi nhớ số"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn btn--quiet" onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="btn btn--brand"
                        disabled={!valid}
                        onClick={() => {
                            setPreferences(draft);
                            onClose();
                        }}
                    >
                        Lưu tùy chọn
                    </button>
                </>
            }
        >
            <SettingRow title="Nhóm chữ số" hint={valid ? 'Mẫu lặp lại, ví dụ 3 (3-3-3…), 2 2 hoặc 3 2.' : 'Nhập số từ 1 đến 9, cách nhau bằng dấu cách.'}>
                <input
                    className="ninput"
                    value={draft.groups}
                    aria-label="Nhóm chữ số"
                    aria-invalid={!valid}
                    onChange={(event) => setDraft({ ...draft, groups: event.target.value })}
                />
            </SettingRow>
            <SettingRow title="Thời gian chuẩn bị" hint="Đếm ngược trước khi dãy số hiện ra.">
                <ChoiceGroup
                    options={[0, 3, 5, 10, 20]}
                    value={draft.prepTime}
                    label="Thời gian chuẩn bị"
                    format={(seconds) => `${seconds} giây`}
                    onChange={(prepTime) => setDraft({ ...draft, prepTime })}
                />
            </SettingRow>
            <SettingRow title="Ẩn đồng hồ" hint="Không hiện thời gian đếm ngược trong lúc ghi nhớ.">
                <Switch checked={draft.hideTimer} label="Ẩn đồng hồ" onToggle={() => setDraft({ ...draft, hideTimer: !draft.hideTimer })} />
            </SettingRow>
        </GameDialog>
    );
};

const Guide = ({ onClose }: { onClose: () => void }) => (
    <GameDialog
        title="Cách chơi"
        subtitle="Nhớ một dãy chữ số theo đúng thứ tự, rồi gõ lại"
        onClose={onClose}
        wide
        footer={
            <button type="button" className="btn btn--brand" onClick={onClose}>
                Đã hiểu
            </button>
        }
    >
        <ol className="guide">
            <li>
                <h3>Ghi nhớ</h3>
                <p>
                    Dãy số hiện theo từng nhóm. Dùng <kbd>←</kbd> <kbd>→</kbd> để chuyển nhóm, <kbd>Space</kbd> về nhóm đầu.
                </p>
                <p>
                    Nhớ xong thì bấm <strong>Đã nhớ xong</strong> hoặc <kbd>Enter</kbd>: thời gian ghi nhớ dừng ngay lúc đó.
                </p>
            </li>
            <li>
                <h3>Gõ lại</h3>
                <p>
                    Gõ 0–9 vào từng ô hoặc dùng bàn phím trên màn hình. <kbd>←</kbd> <kbd>→</kbd> chọn ô, <kbd>Backspace</kbd> xoá
                    ô bên trái.
                </p>
                <p>
                    Lỡ thiếu hoặc thừa một số: <kbd>+</kbd> chèn ô trống, <kbd>−</kbd> xoá ô. Đáp án được tự lưu khi bạn gõ.
                </p>
            </li>
            <li>
                <h3>Tính điểm</h3>
                <p>Mỗi chữ số đúng vị trí được một điểm. Đúng hết thì mở cấp tiếp theo.</p>
                <p>Bằng điểm thì ai ghi nhớ nhanh hơn giỏi hơn.</p>
            </li>
        </ol>
        <p className="gdlg__tip">
            <strong>Mẹo:</strong> đổi mỗi chữ số thành một hình (2 là thiên nga, 8 là người tuyết) rồi nối các hình thành câu
            chuyện.{' '}
            <Link to="/methods/number-shape" className="text-link">
                Xem cách làm
            </Link>
        </p>
    </GameDialog>
);

const LevelTable = ({ digitCounts, unlocked, onClose }: { digitCounts: number[]; unlocked: number; onClose: () => void }) => (
    <GameDialog
        title="Bảng cấp độ"
        subtitle="Ghi nhớ số"
        onClose={onClose}
        footer={
            <button type="button" className="btn btn--brand" onClick={onClose}>
                Đã hiểu
            </button>
        }
    >
        <p className="gdlg__lead">Nhớ đúng toàn bộ chữ số để mở cấp tiếp theo.</p>
        <table className="levels-table">
            <thead>
                <tr>
                    <th scope="col">Cấp</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Số chữ số</th>
                </tr>
            </thead>
            <tbody>
                {digitCounts.map((digits, index) => {
                    const level = index + 1;
                    const state = level > unlocked ? 'locked' : level === unlocked ? 'current' : 'done';
                    return (
                        <tr key={level} data-state={state}>
                            <th scope="row">Cấp {level}</th>
                            <td>
                                <span className="levels-table__state">
                                    {state === 'done' && <Check size={16} aria-hidden="true" />}
                                    {state === 'locked' && <Lock size={14} aria-hidden="true" />}
                                    {state === 'done' ? 'Đã qua' : state === 'current' ? 'Đang chơi' : 'Chưa mở'}
                                </span>
                            </td>
                            <td>{digits}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </GameDialog>
);

const parseIntIn = (value: string, min: number, max: number) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max;
};

export const NumbersSettingsPhase = () => {
    const { progress, busy, prepare, preferences } = useNumbersGameStore();
    const { game } = useGameCatalog('number');
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [mode, setMode] = useState<Mode>('standard');
    const [level, setLevel] = useState<number | null>(null);
    const [standardMemorize, setStandardMemorize] = useState(60);
    const [count, setCount] = useState('8');
    const [memorize, setMemorize] = useState('60');
    const [recall, setRecall] = useState('240');
    const [modal, setModal] = useState<'guide' | 'preferences' | 'levels' | null>(null);

    const digitCounts = game?.levels.map((item) => item.itemCount) ?? progress?.digitCounts ?? DEFAULT_DIGIT_COUNTS;
    const maxLevel = digitCounts.length;
    const timeOptions = game?.memorizeSecOptions ?? TIME_OPTIONS;
    const selectedMemorize = timeOptions.includes(standardMemorize) ? standardMemorize : game?.defaultMemorizeSec ?? 60;
    const unlocked = Math.min(maxLevel, game?.player?.unlockedLevel ?? progress?.unlockedLevel ?? 1);
    const selectedLevel = Math.min(level ?? unlocked, unlocked);
    const today = progress?.todayChallenge;
    const challengeDone = mode === 'challenge' && !!today?.played;
    const challengeNeedsLogin = mode === 'challenge' && !isAuthenticated;
    const memorizeMin = isAuthenticated ? 5 : game?.customTimeRange?.min ?? 10;
    const memorizeMax = isAuthenticated ? 300 : game?.customTimeRange?.max ?? 600;

    const customValid = parseIntIn(count, 4, 80) && parseIntIn(memorize, memorizeMin, memorizeMax) && parseIntIn(recall, 10, 600);
    const valid = mode !== 'custom' || customValid;

    const digitCount = mode === 'standard' ? (digitCounts[selectedLevel - 1] ?? 8) : mode === 'challenge' ? CHALLENGE.digits : Number(count) || 0;
    const memorizeSec = mode === 'standard' ? selectedMemorize : mode === 'challenge' ? CHALLENGE.memorizeSec : Number(memorize);
    const recallSec = mode === 'standard' ? game?.recallSec ?? STANDARD_RECALL_SEC : mode === 'challenge' ? CHALLENGE.recallSec : Number(recall);
    const groupCount = Math.min(FAN_MAX, Math.max(1, Math.ceil(digitCount / 3)));

    const start = () => {
        if (!valid || challengeDone || challengeNeedsLogin) return;
        prepare(
            mode === 'challenge'
                ? { mode: 'challenge', prepareRecall: true }
                : {
                      mode: 'practice',
                      prepareRecall: true,
                      ...(mode === 'standard' ? { level: selectedLevel } : { digitCount: Number(count) }),
                      memorizeSeconds: memorizeSec,
                      recallSeconds: recallSec,
                  },
        );
    };

    let goal = 'Đây là cấp cao nhất. Thử ghi nhớ nhanh hơn để phá kỷ lục!';
    if (mode === 'standard' && selectedLevel < unlocked) goal = `Chơi lại để luyện tập. Chỉ ván ở cấp ${unlocked} mới mở cấp tiếp theo.`;
    else if (mode === 'standard' && selectedLevel < maxLevel) goal = `Nhớ đúng hết để mở cấp ${selectedLevel + 1}.`;
    else if (mode === 'custom') goal = 'Ván tự chọn để luyện tập, không mở cấp mới.';
    else if (mode === 'challenge') goal = 'Mỗi ngày một lượt. Bắt đầu rồi thì lượt được tính.';

    return (
        <>
            <Header />
            <main className="round page-col">
                <Link to="/games" viewTransition className="round__back">
                    <ArrowLeft size={18} aria-hidden="true" />
                    Chọn trò chơi
                </Link>
                <div className="round__head">
                    <div>
                        <h1>Ghi nhớ số</h1>
                        <p>Nhớ một dãy chữ số theo đúng thứ tự, rồi gõ lại.</p>
                    </div>
                    <div className="round__tools">
                        <button type="button" className="tool" onClick={() => setModal('guide')}>
                            <BookOpen size={18} aria-hidden="true" />
                            Cách chơi
                        </button>
                        <button type="button" className="tool" onClick={() => setModal('preferences')}>
                            <SlidersHorizontal size={18} aria-hidden="true" />
                            Tùy chọn
                        </button>
                        <button type="button" className="tool" onClick={() => setModal('levels')}>
                            <Info size={18} aria-hidden="true" />
                            Bảng cấp độ
                        </button>
                    </div>
                </div>

                <div className="choices nmodes" role="group" aria-label="Chế độ chơi">
                    {MODES.map(([key, label]) => (
                        <button key={key} type="button" aria-pressed={mode === key} disabled={busy} onClick={() => setMode(key)}>
                            {label}
                        </button>
                    ))}
                </div>

                <div className="round__grid">
                    <section className="levels" aria-labelledby="nside-title">
                        {mode === 'standard' && (
                            <>
                                <h2 id="nside-title">Cấp độ</h2>
                                <p>
                                    Đã mở {unlocked} trên {maxLevel} cấp. Chọn lại cấp đã mở để luyện tập.
                                </p>
                                <ol className="levels__grid">
                                    {digitCounts.map((digits, index) => {
                                        const option = index + 1;
                                        const locked = option > unlocked;
                                        const state = locked ? 'locked' : option === unlocked ? 'current' : 'done';
                                        return (
                                            <li key={option}>
                                                <button
                                                    type="button"
                                                    className="lvl"
                                                    data-state={state}
                                                    disabled={locked}
                                                    aria-pressed={option === selectedLevel}
                                                    aria-label={`Cấp độ ${option}, ${digits} chữ số${locked ? ', chưa mở khoá' : ''}`}
                                                    onClick={() => setLevel(option)}
                                                >
                                                    {locked && <Lock size={14} aria-hidden="true" />}
                                                    {state === 'done' && <Check size={14} aria-hidden="true" />}
                                                    <strong>{option}</strong>
                                                    <span>{digits} số</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </>
                        )}

                        {mode === 'custom' && (
                            <>
                                <h2 id="nside-title">Tự chọn</h2>
                                <p>Tự đặt số chữ số và thời gian. Ván tự chọn không mở cấp mới.</p>
                                <div className="nfields">
                                    <label>
                                        Số chữ số
                                        <input className="ninput" type="number" min={4} max={80} value={count} onChange={(event) => setCount(event.target.value)} />
                                        <span>Từ 4 đến 80</span>
                                    </label>
                                    <label>
                                        Ghi nhớ (giây)
                                        <input className="ninput" type="number" min={memorizeMin} max={memorizeMax} value={memorize} onChange={(event) => setMemorize(event.target.value)} />
                                        <span>Từ {memorizeMin} đến {memorizeMax}</span>
                                    </label>
                                    <label>
                                        Gõ lại (giây)
                                        <input className="ninput" type="number" min={10} max={600} value={recall} onChange={(event) => setRecall(event.target.value)} />
                                        <span>Từ 10 đến 600</span>
                                    </label>
                                </div>
                            </>
                        )}

                        {mode === 'challenge' && (
                            <>
                                <h2 id="nside-title">Thử thách số hôm nay</h2>
                                <p>
                                    Ai cũng nhớ {CHALLENGE.digits} chữ số trong {formatSeconds(CHALLENGE.memorizeSec)}, mỗi người một lượt
                                    mỗi ngày.
                                </p>
                                {!isAuthenticated ? <p className="levels__custom"><Link to="/login" state={{ from: { pathname: '/games/numbers' } }}>Đăng nhập</Link> để tham gia thử thách ngày. Bạn vẫn có thể luyện theo cấp hoặc chơi ván tự chọn.</p> : today?.played && today.phase !== 'completed' ? (
                                    // Đã bắt đầu nhưng chưa nộp (ví dụ tải lại trang giữa ván): chưa có điểm để hiện
                                    <div className="nchallenge">
                                        <p className="nchallenge__label">Bạn đã bắt đầu thử thách hôm nay</p>
                                        <p className="nchallenge__meta">
                                            Ván sẽ tự được chấm khi hết giờ, với những số bạn đã gõ. Kết quả hiện ở đây khi chấm xong.
                                        </p>
                                    </div>
                                ) : today?.played ? (
                                    <div className="nchallenge">
                                        <p className="nchallenge__label">Kết quả hôm nay của bạn</p>
                                        <p className="nchallenge__score">
                                            <strong>{today.correctCount ?? today.score ?? 0}</strong> / {today.digitCount ?? CHALLENGE.digits} chữ số đúng
                                        </p>
                                        <p className="nchallenge__meta">
                                            {today.accuracy !== undefined && `Chính xác ${today.accuracy}%`}
                                            {today.memorizeUsedMs ? ` · Ghi nhớ ${(today.memorizeUsedMs / 1000).toFixed(2)} giây` : ''}
                                        </p>
                                        <p className="nchallenge__meta">Quay lại vào ngày mai để thử lập kỷ lục mới nhé.</p>
                                    </div>
                                ) : (
                                    <p className="levels__custom">Bạn chưa chơi thử thách hôm nay. Nhớ kỹ trước khi bắt đầu: chỉ có một lượt.</p>
                                )}
                            </>
                        )}
                        {!isAuthenticated && mode !== 'challenge' && <p className="levels__note">Bạn đang chơi với tư cách khách. Cấp đã mở được giữ tạm theo phiên khách; đáp án đang nhập chỉ giữ trong tab này. Đăng nhập để lưu lịch sử và nhận EXP.</p>}
                    </section>

                    <section className="deal" aria-labelledby="deal-title">
                        <div className="deal__title">
                            <h2 id="deal-title">
                                {mode === 'standard' ? `Cấp độ ${selectedLevel}` : mode === 'custom' ? 'Ván tự chọn' : 'Thử thách hôm nay'}
                            </h2>
                            {mode === 'standard' && <span>{getLevelLabel(selectedLevel)}</span>}
                        </div>

                        <p className="deal__count">
                            <strong>{digitCount || '–'}</strong>
                            <span>chữ số cần nhớ</span>
                        </p>

                        {/* Mỗi lá úp là một nhóm số; số nhóm theo tùy chọn nhóm 3 chữ số (vẽ tối đa 9 lá) */}
                        <div className="deal__fan" key={`${mode}-${digitCount}`} aria-hidden="true">
                            {Array.from({ length: groupCount }, (_, i) => (
                                <span key={i} style={{ '--o': i - (groupCount - 1) / 2, '--i': i } as CSSProperties}>
                                    <PhotoBack size="sm" />
                                </span>
                            ))}
                        </div>

                        {mode === 'standard' && (
                            <div className="timepick-field">
                                <p id="number-memorize-time">Thời gian ghi nhớ</p>
                                <div className="timepick" role="group" aria-labelledby="number-memorize-time">
                                    {timeOptions.map((seconds) => (
                                        <button key={seconds} type="button" aria-pressed={selectedMemorize === seconds} onClick={() => setStandardMemorize(seconds)}>
                                            {formatSeconds(seconds)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <ul className="deal__facts">
                            {mode !== 'standard' && valid && <li>Ghi nhớ {formatSeconds(memorizeSec)}</li>}
                            {valid && <li>Gõ lại trong {formatSeconds(recallSec)}</li>}
                            <li>Nhóm {preferences.groups.trim().split(/\s+/).join('-')} chữ số</li>
                        </ul>

                        <p className="deal__goal">{goal}</p>

                        {!valid && (
                            <p role="alert" className="deal__error">
                                <AlertCircle size={18} aria-hidden="true" />
                                Giá trị chưa hợp lệ: hãy nhập số nguyên trong khoảng cho phép.
                            </p>
                        )}

                        <button type="button" onClick={start} disabled={!valid || challengeDone || challengeNeedsLogin || busy} className="btn btn--sun deal__start">
                            {busy ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}
                            {challengeDone ? 'Đã hoàn thành hôm nay' : 'Bắt đầu'}
                        </button>
                    </section>
                </div>
            </main>

            {modal === 'preferences' && <Preferences onClose={() => setModal(null)} />}
            {modal === 'guide' && <Guide onClose={() => setModal(null)} />}
            {modal === 'levels' && <LevelTable digitCounts={digitCounts} unlocked={unlocked} onClose={() => setModal(null)} />}
        </>
    );
};
