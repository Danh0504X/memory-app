interface WordsLevelExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentLevel?: number;
}

export const WORDS_LEVEL_DETAILS = [
    { level: 1, words: 6, requiredScore: "4" },
    { level: 2, words: 10, requiredScore: "7" },
    { level: 3, words: 14, requiredScore: "10" },
    { level: 4, words: 18, requiredScore: "12" },
    { level: 5, words: 22, requiredScore: "15" },
    { level: 6, words: 26, requiredScore: "18" },
    { level: 7, words: 30, requiredScore: "20" },
    { level: 8, words: 35, requiredScore: "24" },
    { level: 9, words: 42, requiredScore: "28" },
    { level: 10, words: 50, requiredScore: "– (Cấp tối đa)", isMax: true },
];

export const WordsLevelExplanationModal = ({
    isOpen,
    onClose,
    currentLevel,
}: WordsLevelExplanationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in">
            {/* Modal Dialog */}
            <div className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">

                {/* ── 1. Header Modal ── */}
                <div className="flex items-center justify-between border-b border-[#eef2f0] px-7 py-5">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6f7ed] text-2xl text-[#1a7a4a] shadow-xs">
                            💡
                        </div>
                        <div>
                            <h2 className="text-[20px] font-extrabold tracking-tight text-[#1f2937]">
                                Cấp Độ Ghi Nhớ Từ
                            </h2>
                            <p className="text-[12px] font-semibold text-[#667085]">
                                Words Levels
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

                {/* ── 2. Nội dung giải thích ── */}
                <div className="flex-1 space-y-4 overflow-y-auto p-7 text-[#202b39]">

                    {/* Đoạn mô tả quy tắc */}
                    <div className="rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 space-y-2">
                        <p className="text-[14px] font-semibold text-[#1a7a4a]">
                            Người chơi mới sẽ bắt đầu tại Cấp độ 1.
                        </p>
                        <p className="text-[13px] leading-relaxed text-[#4b5563]">
                            Ở mỗi cấp độ, bạn sẽ được cung cấp nhiều từ vựng hơn để ghi nhớ. Bạn phải nhớ lại chính xác ít nhất <strong className="font-bold text-[#1f2937]">2/3</strong> số từ đó để vượt qua và mở khóa cấp độ tiếp theo.
                        </p>
                    </div>

                    {/* Bảng cấp độ chi tiết theo chuẩn Memory League */}
                    <div className="overflow-hidden rounded-2xl border border-[#e0eee6] shadow-2xs">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#e0eee6] bg-[#eff4ff] text-[13px] font-bold text-[#374151]">
                                    <th className="py-3.5 pl-6 pr-4">Cấp độ</th>
                                    <th className="py-3.5 px-4 text-center">Số từ xuất hiện</th>
                                    <th className="py-3.5 pl-4 pr-6 text-center">Điểm yêu cầu lên cấp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f4f2] bg-white">
                                {WORDS_LEVEL_DETAILS.map((row) => {
                                    const isCurrent = currentLevel === row.level;
                                    return (
                                        <tr
                                            key={row.level}
                                            className={`transition ${isCurrent
                                                    ? "bg-[#e6f7ed]/70 font-semibold"
                                                    : "hover:bg-[#fbfdfc]"
                                                }`}
                                        >
                                            <td className="py-3 pl-6 pr-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#1f2937]">
                                                        {row.level}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="rounded-full bg-[#1a7a4a] px-2 py-0.5 text-[10px] font-bold text-white">
                                                            Hiện tại
                                                        </span>
                                                    )}
                                                    {row.isMax && (
                                                        <span className="text-xs">🎖️</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center font-semibold text-[#4b5563]">
                                                {row.words}
                                            </td>
                                            <td className="py-3 pl-4 pr-6 text-center">
                                                <span
                                                    className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${row.isMax
                                                            ? "bg-gray-100 text-gray-500"
                                                            : "bg-[#e6f7ed] text-[#1a7a4a]"
                                                        }`}
                                                >
                                                    {row.requiredScore}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* ── 3. Footer Modal ── */}
                <div className="flex items-center justify-end border-t border-[#eef2f0] bg-[#f8faf9]/60 px-7 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full bg-[#1a7a4a] px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1a7a4a]/20 transition hover:bg-[#14623b] active:scale-95 cursor-pointer"
                    >
                        OK • Đã hiểu
                    </button>
                </div>

            </div>
        </div>
    );
};
