import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Lock } from 'lucide-react';
import { GameSettingsLayout } from '@/components/layout/GameSettingsLayout';
import { useNumbersGameStore } from '../store/numbersGameStore';
import { isValidGroups } from '../utils/numberUtils';
import { fieldClass, primaryButton, secondaryButton } from '../styles';
import type { NumberPreferences } from '../types/numberTypes';

const MAX_LEVEL = 10;
const DEFAULT_DIGIT_COUNTS = [8, 12, 18, 24, 30, 40, 50, 60, 70, 80];
const TIME_OPTIONS = [{ value: 30, label: '30 giây' }, { value: 60, label: '1 phút' }, { value: 120, label: '2 phút' }, { value: 300, label: '5 phút' }];
const MODES = [['standard', 'Tiêu chuẩn'], ['custom', 'Tùy chỉnh'], ['challenge', 'Thử thách']] as const;
const kbd = 'mx-0.5 rounded border border-[#d7e5dd] bg-[#f5faf7] px-1.5 py-0.5 font-mono text-sm';

const getLevelLabel = (lvl: number) => {
    if (lvl <= 3) return 'Mức căn bản';
    if (lvl <= 6) return 'Mức trung cấp';
    return 'Mức nâng cao';
};

// Native dialog cung cấp focus trap, Escape và trả focus về nút mở; style theo modal Hình ảnh.
// Đóng bằng Escape, bấm nền hoặc nút Hủy/Đóng đều không lưu thay đổi.
const NumberDialog = ({ title, children, footer, onClose }: {
    title: string; children: React.ReactNode; footer?: React.ReactNode; onClose: () => void;
}) => {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => { ref.current?.showModal(); }, []);
    return <dialog ref={ref} aria-labelledby="number-dialog-title" onCancel={onClose} onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
    }} className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-[28px] bg-white p-6 text-[#1f2937] shadow-2xl backdrop:bg-black/40">
        <h2 id="number-dialog-title" className="mb-5 border-b border-[#e0eee6] pb-4 text-2xl font-extrabold text-[#0d631b]">{title}</h2>
        {children}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
            {footer ?? <button type="button" onClick={onClose} className={primaryButton}>Đóng</button>}
        </div>
    </dialog>;
};

const Preferences = ({ onClose }: { onClose: () => void }) => {
    const { preferences, setPreferences } = useNumbersGameStore();
    const [draft, setDraft] = useState<NumberPreferences>(preferences);
    const valid = isValidGroups(draft.groups);
    return <NumberDialog title="Tùy chọn" onClose={onClose} footer={<>
        <button type="button" onClick={onClose} className={secondaryButton}>Hủy</button>
        <button type="submit" form="number-preferences" className={primaryButton} disabled={!valid}>Lưu</button>
    </>}>
        <form id="number-preferences" className="space-y-5" onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            setPreferences(draft); onClose();
        }}>
            <label className="block space-y-2 text-base font-bold">Nhóm chữ số
                <input className={fieldClass} value={draft.groups} onChange={(event) => setDraft({ ...draft, groups: event.target.value })} aria-describedby="groups-help" aria-invalid={!valid} />
                <span id="groups-help" className={`block text-sm font-normal ${valid ? 'text-[#586274]' : 'font-semibold text-red-700'}`} role={valid ? undefined : 'alert'}>
                    {valid ? 'Ví dụ: 2, 2 2 2 hoặc 3 2' : 'Nhập số từ 1–9, cách nhau bằng dấu cách.'}
                </span>
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base font-bold"><input type="checkbox" className="h-5 w-5 accent-[#1a7a4a]" checked={draft.hideTimer} onChange={(event) => setDraft({ ...draft, hideTimer: event.target.checked })} />Ẩn đồng hồ khi ghi nhớ</label>
            <label className="block space-y-2 text-base font-bold">Thời gian chuẩn bị
                <select className={fieldClass} value={draft.prepTime} onChange={(event) => setDraft({ ...draft, prepTime: Number(event.target.value) })}>
                    {[0, 3, 5, 10, 20].map((seconds) => <option key={seconds} value={seconds}>{seconds} giây</option>)}
                </select>
            </label>
        </form>
    </NumberDialog>;
};

const GuideSection = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <section className="flex gap-3">
        <span aria-hidden="true" className="w-7 shrink-0 text-center text-xl">{icon}</span>
        <div className="min-w-0"><h3 className="text-lg font-extrabold">{title}</h3><div className="mt-1 text-base leading-relaxed">{children}</div></div>
    </section>
);

export const NumbersSettingsPhase = () => {
    const { progress, busy, prepare } = useNumbersGameStore();
    const [mode, setMode] = useState<'standard' | 'custom' | 'challenge'>('standard');
    const [level, setLevel] = useState<number | null>(null);
    const [isLevelOpen, setIsLevelOpen] = useState(false);
    const levelDropdownRef = useRef<HTMLDivElement>(null);
    const [standardMemorize, setStandardMemorize] = useState(60);
    const [count, setCount] = useState('8');
    const [memorize, setMemorize] = useState('60');
    const [recall, setRecall] = useState('240');
    const [modal, setModal] = useState<'guide' | 'preferences' | 'levels' | null>(null);

    useEffect(() => {
        if (!isLevelOpen) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (levelDropdownRef.current && !levelDropdownRef.current.contains(event.target as Node)) {
                setIsLevelOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsLevelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isLevelOpen]);

    const digitCounts = progress?.digitCounts ?? DEFAULT_DIGIT_COUNTS;
    const selectedLevel = Math.min(level ?? progress?.unlockedLevel ?? 1, progress?.unlockedLevel ?? 1);
    const digitCount = mode === 'standard' ? digitCounts[selectedLevel - 1] ?? 8 : mode === 'challenge' ? 80 : Number(count);
    const isChallengeCompleted = mode === 'challenge' && !!progress?.todayChallenge?.played;
    const valid = mode !== 'custom' || (Number.isInteger(Number(count)) && Number(count) >= 4 && Number(count) <= 80 &&
        Number.isInteger(Number(memorize)) && Number(memorize) >= 5 && Number(memorize) <= 300 &&
        Number.isInteger(Number(recall)) && Number(recall) >= 10 && Number(recall) <= 600);
    const start = () => {
        if (!valid || isChallengeCompleted) return;
        prepare(mode === 'challenge' ? { mode: 'challenge', prepareRecall: true } : {
            mode: 'practice', prepareRecall: true,
            ...(mode === 'standard' ? { level: selectedLevel } : { digitCount: Number(count) }),
            memorizeSeconds: mode === 'standard' ? standardMemorize : Number(memorize), recallSeconds: mode === 'standard' ? 240 : Number(recall),
        });
    };
    return <>
        <GameSettingsLayout title="Ghi nhớ số" level={selectedLevel} itemCount={digitCount} itemUnit="chữ số"
            memorizeTime={standardMemorize} setMemorizeTime={setStandardMemorize}
            onStart={start} startDisabled={!valid || isChallengeCompleted}
            startLabel={isChallengeCompleted ? 'Đã hoàn thành hôm nay' : 'Bắt đầu'}
            onOpenExplanation={() => setModal('levels')} onOpenGuide={() => setModal('guide')} onOpenPreferences={() => setModal('preferences')}
            modeControl={<div role="group" aria-label="Chế độ chơi" className="flex flex-wrap gap-5 border-b border-[#d7e5dd]">
                {MODES.map(([key, label]) => <button type="button" key={key} aria-pressed={mode === key} disabled={busy} onClick={() => setMode(key)}
                    className={`-mb-px min-h-11 cursor-pointer border-b-[3px] px-1 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d631b] ${mode === key ? 'border-[#2e7d32] text-[#0d631b]' : 'border-transparent text-[#40493d] hover:text-[#0d631b]'}`}>{label}</button>)}
            </div>}
            settingsContent={<>
                <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-extrabold text-[#121c2a]">{mode === 'standard' ? `Cấp độ ${selectedLevel}` : mode === 'custom' ? 'Tùy chỉnh' : 'Thử thách'}</h2>
                    {mode === 'standard' && (
                        <>
                            <span className="rounded-full bg-[#a3f69c] px-3.5 py-1 text-xs font-bold text-[#002204]">
                                {getLevelLabel(selectedLevel)}
                            </span>

                            {/* Dropdown chọn cấp độ phong cách Memio */}
                            <div className="relative inline-block text-left" ref={levelDropdownRef}>
                                <button
                                    type="button"
                                    id="level-select-button"
                                    aria-haspopup="listbox"
                                    aria-expanded={isLevelOpen}
                                    aria-label="Chọn cấp độ"
                                    onClick={() => setIsLevelOpen((prev) => !prev)}
                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold transition-all cursor-pointer select-none ${
                                        isLevelOpen
                                            ? 'border-[#1a7a4a] bg-[#e6f7ed] text-[#0d631b] shadow-xs ring-2 ring-[#1a7a4a]/20'
                                            : 'border-[#b9cfc3] bg-[#e6f7ed] text-[#0d631b] hover:bg-[#d7f1e4] hover:border-[#1a7a4a]'
                                    }`}
                                >
                                    <span>Cấp {selectedLevel}</span>
                                    <ChevronDown
                                        size={14}
                                        className={`transition-transform duration-200 text-[#1a7a4a] ${isLevelOpen ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {isLevelOpen && (
                                    <div
                                        id="level-select-menu"
                                        role="listbox"
                                        aria-labelledby="level-select-button"
                                        className="absolute left-0 top-[calc(100%+6px)] z-50 w-60 rounded-[18px] border border-[#e0eee6] bg-white p-1.5 shadow-[0px_10px_25px_rgba(13,99,27,0.12),0px_2px_8px_rgba(0,0,0,0.06)]"
                                    >
                                        <div className="flex items-center justify-between border-b border-[#f0f5f2] px-2.5 py-1 mb-1">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#77839a]">
                                                Cấp độ (1–{MAX_LEVEL})
                                            </span>
                                            <span className="rounded-full bg-[#e6f7ed] px-2 py-0.5 text-[10px] font-bold text-[#1a7a4a]">
                                                Đã mở: Cấp {progress?.unlockedLevel ?? 1}
                                            </span>
                                        </div>

                                        <div className="max-h-36 overflow-y-auto space-y-0.5 pr-0.5">
                                            {digitCounts.map((digits, index) => {
                                                const lvl = index + 1;
                                                const isUnlocked = lvl <= (progress?.unlockedLevel ?? 1);
                                                const isSelected = lvl === selectedLevel;

                                                if (!isUnlocked) {
                                                    return (
                                                        <div
                                                            key={lvl}
                                                            role="option"
                                                            aria-selected={false}
                                                            aria-disabled={true}
                                                            className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#9ca3af] bg-[#fafbfc] cursor-not-allowed select-none opacity-60"
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f1f5f9] text-[10px] font-bold text-[#9ca3af]">
                                                                    {lvl}
                                                                </span>
                                                                <span>Cấp độ {lvl}</span>
                                                                <span className="text-[11px] font-normal text-[#9ca3af]">({digits} số)</span>
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#9ca3af]">
                                                                <Lock size={12} /> Khóa
                                                            </span>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        onClick={() => {
                                                            setLevel(lvl);
                                                            setIsLevelOpen(false);
                                                        }}
                                                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer select-none ${
                                                            isSelected
                                                                ? 'bg-[#e6f7ed] text-[#0d631b] font-bold shadow-2xs'
                                                                : 'text-[#1f2937] hover:bg-[#f6fcf8] hover:text-[#0d631b]'
                                                        }`}
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            <span
                                                                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                                    isSelected
                                                                        ? 'bg-[#1a7a4a] text-white'
                                                                        : 'bg-[#f0f5f2] text-[#586274]'
                                                                }`}
                                                            >
                                                                {lvl}
                                                            </span>
                                                            <span>Cấp độ {lvl}</span>
                                                            <span className="text-[11px] font-normal text-[#586274]">
                                                                ({digits} số)
                                                            </span>
                                                        </span>
                                                        {isSelected && (
                                                            <Check size={14} className="text-[#1a7a4a]" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
                {mode === 'standard' && <>
                    <p className="max-w-xl text-xl leading-relaxed text-[#2f3a4a]">Bạn có <strong className="text-[#0d631b]">{digitCount || '…'} chữ số</strong> cần ghi nhớ.{selectedLevel < MAX_LEVEL && ` Nhớ đúng hết để lên cấp ${selectedLevel + 1}.`}</p>
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Thời gian ghi nhớ">
                        <span className="text-base font-bold">⏱ Ghi nhớ</span>
                        {TIME_OPTIONS.map((option) => <button type="button" key={option.value} aria-pressed={standardMemorize === option.value} onClick={() => setStandardMemorize(option.value)}
                            className={`min-h-11 cursor-pointer rounded-full px-4 py-2 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d631b] focus-visible:ring-offset-2 ${standardMemorize === option.value ? 'bg-[#2e7d32] text-white' : 'bg-[#dee9fc] text-[#1f2937] hover:bg-[#d0e0fb]'}`}>{option.label}</button>)}
                    </div>
                </>}
                {mode === 'custom' && <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2 text-base font-bold">Số chữ số<input aria-label="Số chữ số" type="number" min="4" max="80" step="1" className={fieldClass} value={count} onChange={(event) => setCount(event.target.value)} /></label>
                    <label className="space-y-2 text-base font-bold">Ghi nhớ (giây)<input aria-label="Thời gian ghi nhớ" type="number" min="5" max="300" step="1" className={fieldClass} value={memorize} onChange={(event) => setMemorize(event.target.value)} /></label>
                    <label className="space-y-2 text-base font-bold">Nhập (giây)<input aria-label="Thời gian nhập đáp án" type="number" min="10" max="600" step="1" className={fieldClass} value={recall} onChange={(event) => setRecall(event.target.value)} /></label>
                </div>}
                {mode === 'challenge' && (
                    <div className="space-y-4 max-w-xl">
                        <p className="text-base text-[#40493d] leading-relaxed">
                            Trong chế độ thử thách ngày, mỗi đấu thủ chỉ có duy nhất <strong>1 lượt chơi mỗi ngày</strong>. Ngày mới bắt đầu lúc 00:00 GMT.
                        </p>
                        {isChallengeCompleted ? (
                            <div className="rounded-2xl border border-[#b9cfc3] bg-[#f0f9f4] p-5 shadow-2xs space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#1a7a4a]">Kết quả hôm nay của bạn</span>
                                    <span className="rounded-full bg-[#a3f69c] px-2.5 py-0.5 text-[11px] font-bold text-[#002204]">Đã hoàn thành</span>
                                </div>
                                <div className="flex flex-wrap items-baseline gap-3">
                                    <span className="text-2xl font-extrabold text-[#0d631b]">
                                        {progress?.todayChallenge?.correctCount ?? progress?.todayChallenge?.score ?? 0}/{progress?.todayChallenge?.digitCount ?? 80} chữ số đúng
                                    </span>
                                    {progress?.todayChallenge?.accuracy !== undefined && (
                                        <span className="text-sm font-semibold text-[#586274]">
                                            · Chính xác: {progress.todayChallenge.accuracy}%
                                        </span>
                                    )}
                                    {progress?.todayChallenge?.memorizeUsedMs ? (
                                        <span className="text-sm font-semibold text-[#586274]">
                                            · Nhớ: {((progress.todayChallenge.memorizeUsedMs) / 1000).toFixed(2)}s
                                        </span>
                                    ) : null}
                                </div>
                                <p className="text-sm text-[#2f3a4a]">
                                    Bạn đã hoàn thành thử thách ngày hôm nay. Hãy quay lại vào ngày mai để tiếp tục lập kỷ lục mới nhé! 🎉
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2 text-base text-[#2f3a4a]">
                                <span className="rounded-full bg-[#dee9fc] px-3.5 py-1 font-bold text-[#0d631b]">80 chữ số</span>
                                <span>· 1 phút ghi nhớ · 4 phút nhập</span>
                            </div>
                        )}
                    </div>
                )}
                {!valid && <p role="alert" className="text-base font-semibold text-red-700">Giá trị chưa hợp lệ. Hãy nhập số nguyên trong giới hạn.</p>}
            </>}
        />
        {modal === 'preferences' && <Preferences onClose={() => setModal(null)} />}
        {modal === 'levels' && <NumberDialog title="Các cấp độ" onClose={() => setModal(null)}>
            <p className="mb-4 text-base">Nhớ đúng toàn bộ chữ số để lên cấp tiếp theo.</p>
            <table className="w-full text-left text-base"><thead className="bg-[#e6f7ed] text-[#0d631b]"><tr><th scope="col" className="p-2">Cấp độ</th><th scope="col" className="p-2">Số chữ số</th><th scope="col" className="p-2">Điểm để lên cấp</th></tr></thead><tbody>
                {progress?.digitCounts.map((total, index) => <tr key={index} className="border-t border-[#e0eee6]"><td className="p-2">{index + 1}</td><td className="p-2">{total}</td><td className="p-2">{index === MAX_LEVEL - 1 ? '–' : total}</td></tr>)}
            </tbody></table>
        </NumberDialog>}
        {modal === 'guide' && <NumberDialog title="Hướng dẫn" onClose={() => setModal(null)}>
            <div className="space-y-5">
                <GuideSection icon="🎯" title="Mục tiêu"><p>Nhớ dãy số chính xác và nhanh nhất có thể.</p></GuideSection>
                <GuideSection icon="✔️" title="Tính điểm"><p>Mỗi chữ số đúng được 1 điểm.</p></GuideSection>
                <GuideSection icon="⏳" title="Thời gian"><p>Hết giờ ghi nhớ sẽ đến lượt nhập đáp án. Nhớ xong sớm có thể dừng đồng hồ.</p></GuideSection>
                <GuideSection icon="👁" title="Ghi nhớ"><ul className="list-disc pl-5">
                    <li><kbd className={kbd}>←</kbd><kbd className={kbd}>→</kbd> chuyển nhóm</li>
                    <li><kbd className={kbd}>Space</kbd> hoặc <kbd className={kbd}>↑</kbd> về nhóm đầu</li>
                    <li><kbd className={kbd}>Enter</kbd> hoặc nút “Mình đã nhớ xong” để dừng</li>
                </ul></GuideSection>
                <GuideSection icon="✏️" title="Nhập đáp án"><ul className="list-disc pl-5">
                    <li>Chạm vào ô hoặc dùng <kbd className={kbd}>←</kbd><kbd className={kbd}>→</kbd> để chọn ô</li>
                    <li>Gõ 0–9; <kbd className={kbd}>Backspace</kbd> xóa ô bên trái</li>
                    <li><kbd className={kbd}>+</kbd> chèn ô, <kbd className={kbd}>−</kbd> xóa ô</li>
                </ul></GuideSection>
            </div>
        </NumberDialog>}
    </>;
};
