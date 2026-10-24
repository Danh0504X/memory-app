import { useState, useEffect } from "react";
import { useWordsGameStore } from "../store/wordsGameStore";
import type { WordLanguage } from "../types/wordTypes";

interface WordsPreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WordsPreferencesModal = ({
    isOpen,
    onClose,
}: WordsPreferencesModalProps) => {
    const {
        preferences,
        setPreferences,
        memorizeTime,
        setMemorizeTime,
        recallTime,
        setRecallTime,
    } = useWordsGameStore();

    const [language, setLanguage] = useState<WordLanguage>(preferences.language);
    const [groups, setGroups] = useState<number>(preferences.groups);
    const [hideTimer, setHideTimer] = useState<boolean>(preferences.hideTimer);
    const [prepTime, setPrepTime] = useState<number>(preferences.prepTime);
    const [tempMemorizeTime, setTempMemorizeTime] = useState<number>(memorizeTime);
    const [tempRecallTime, setTempRecallTime] = useState<number>(recallTime);

    // Đồng bộ trạng thái khi mở modal
    useEffect(() => {
        if (isOpen) {
            setLanguage(preferences.language);
            setGroups(preferences.groups);
            setHideTimer(preferences.hideTimer);
            setPrepTime(preferences.prepTime);
            setTempMemorizeTime(memorizeTime);
            setTempRecallTime(recallTime);
        }
    }, [isOpen, preferences, memorizeTime, recallTime]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Cập nhật cấu hình vào store
        setMemorizeTime(tempMemorizeTime);
        setRecallTime(tempRecallTime);
        setPreferences({
            language,
            groups: Math.max(1, Math.min(5, Number(groups) || 1)),
            hideTimer,
            prepTime,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in">
            {/* Modal Dialog */}
            <div className="relative flex max-h-[92vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">

                {/* ── 1. Header Modal ── */}
                <div className="flex items-center justify-between border-b border-[#eef2f0] px-7 py-5">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f7ed] text-2xl text-[#1a7a4a] shadow-xs">
                            ⚙️
                        </div>
                        <div>
                            <h2 className="text-[20px] font-extrabold text-[#1f2937]">
                                Tùy Chọn Ghi Nhớ Từ
                            </h2>
                            <p className="text-[12px] font-semibold text-[#667085]">
                                Cấu hình bài thi từ vựng • Words Preferences
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085] transition hover:bg-[#e4e7ec] cursor-pointer"
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>

                {/* ── 2. Nội dung cài đặt ── */}
                <div className="flex-1 space-y-3.5 overflow-y-auto p-7">

                    {/* Mục 1: Ngôn ngữ từ vựng (Language) */}
                    <div className="flex items-center justify-between rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7ed] text-lg text-[#1a7a4a]">
                                🌐
                            </div>
                            <div className="max-w-[320px]">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">Ngôn ngữ</h4>
                                <p className="text-[12px] text-[#667085]">
                                    Ngôn ngữ cho danh sách từ vựng cần ghi nhớ
                                </p>
                            </div>
                        </div>

                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as WordLanguage)}
                            className="rounded-xl border border-[#d7e5dd] bg-white px-3.5 py-2 text-sm font-bold text-[#1f2937] shadow-xs transition focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20 focus:outline-none cursor-pointer"
                        >
                            <option value="vi">🇻🇳 Tiếng Việt</option>
                            <option value="en">🇬🇧 English (Tiếng Anh)</option>
                            <option value="ko">🇰🇷 한국어 (Tiếng Hàn)</option>
                            <option value="ja">🇯🇵 日本語 (Tiếng Nhật)</option>
                            <option value="zh">🇨🇳 中文 (Tiếng Trung)</option>
                            <option value="th">🇹🇭 ภาษาไทย (Tiếng Thái)</option>
                        </select>
                    </div>

                    {/* Mục 2: Nhóm từ cùng lúc (Groups) */}
                    <div className="flex items-center justify-between rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7ed] text-lg text-[#1a7a4a]">
                                📑
                            </div>
                            <div className="max-w-[320px]">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">Nhóm từ</h4>
                                <p className="text-[12px] text-[#667085]">
                                    Số lượng từ hiển thị trong một nhóm
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center rounded-xl border border-[#d7e5dd] bg-white p-1 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setGroups(Math.max(1, groups - 1))}
                                disabled={groups <= 1}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-[#40493d] transition hover:bg-[#e6f7ed] disabled:opacity-30 cursor-pointer"
                            >
                                −
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-[#1f2937]">
                                {groups}
                            </span>
                            <button
                                type="button"
                                onClick={() => setGroups(Math.min(5, groups + 1))}
                                disabled={groups >= 5}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-[#40493d] transition hover:bg-[#e6f7ed] disabled:opacity-30 cursor-pointer"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Mục 3: Ẩn đồng hồ bấm giờ (Hide Timer) */}
                    <div className="flex items-center justify-between rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7ed] text-lg text-[#1a7a4a]">
                                ⏱️
                            </div>
                            <div className="max-w-[320px]">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">Ẩn đồng hồ</h4>
                                <p className="text-[12px] text-[#667085]">
                                    Chọn để ẩn đồng hồ đếm ngược trong lúc ghi nhớ
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            role="switch"
                            aria-checked={hideTimer}
                            onClick={() => setHideTimer(!hideTimer)}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${hideTimer ? "bg-[#1a7a4a]" : "bg-[#d1d5db]"
                                }`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${hideTimer ? "translate-x-5" : "translate-x-0"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Mục 5: Thời gian ghi nhớ */}
                    <div className="flex items-center justify-between rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7ed] text-lg text-[#1a7a4a]">
                                🧠
                            </div>
                            <div className="max-w-[320px]">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">Thời gian ghi nhớ</h4>
                                <p className="text-[12px] text-[#667085]">Thời gian tối đa để xem và ghi nhớ dãy từ</p>
                            </div>
                        </div>

                        <select
                            value={tempMemorizeTime}
                            onChange={(e) => setTempMemorizeTime(Number(e.target.value))}
                            className="rounded-xl border border-[#d7e5dd] bg-white px-3.5 py-2 text-sm font-bold text-[#1f2937] shadow-xs transition focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20 focus:outline-none cursor-pointer"
                        >
                            <option value={30}>30 giây</option>
                            <option value={60}>1 phút</option>
                            <option value={120}>2 phút</option>
                            <option value={300}>5 phút</option>
                        </select>
                    </div>

                    {/* Mục 6: Thời gian hoàn thành (Gõ từ) */}
                    <div className="flex items-center justify-between rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e6f7ed] text-lg text-[#1a7a4a]">
                                ✍️
                            </div>
                            <div className="max-w-[320px]">
                                <h4 className="text-[14px] font-bold text-[#1f2937]">Thời gian hoàn thành</h4>
                                <p className="text-[12px] text-[#667085]">Thời gian tối đa để nhớ lại và nhập các từ</p>
                            </div>
                        </div>

                        <select
                            value={tempRecallTime}
                            onChange={(e) => setTempRecallTime(Number(e.target.value))}
                            className="rounded-xl border border-[#d7e5dd] bg-white px-3.5 py-2 text-sm font-bold text-[#1f2937] shadow-xs transition focus:border-[#1a7a4a] focus:ring-2 focus:ring-[#1a7a4a]/20 focus:outline-none cursor-pointer"
                        >
                            <option value={60}>1 phút</option>
                            <option value={120}>2 phút</option>
                            <option value={240}>4 phút</option>
                            <option value={300}>5 phút</option>
                        </select>
                    </div>

                </div>

                {/* ── 3. Footer ── */}
                <div className="flex items-center justify-end gap-3 border-t border-[#eef2f0] bg-[#f8faf9]/60 px-7 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-[#f2f4f7] px-6 py-2.5 text-sm font-bold text-[#667085] transition hover:bg-[#e4e7ec] cursor-pointer"
                    >
                        Hủy (Cancel)
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-full bg-[#1a7a4a] px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1a7a4a]/20 transition hover:bg-[#14623b] active:scale-95 cursor-pointer"
                    >
                        OK • Đồng ý
                    </button>
                </div>

            </div>
        </div>
    );
};
