interface ImagesGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImagesGuideModal = ({ isOpen, onClose }: ImagesGuideModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs animate-fade-in">
            {/* Modal Container */}
            <div className="relative flex max-h-[90vh] w-full max-w-[820px] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">

                {/* ── 1. Modal Header ── */}
                <div className="flex items-center justify-between border-b border-[#eef2f0] px-7 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff7e6] text-2xl text-[#d97706]">
                            🖼️
                        </div>
                        <div>
                            <h2 className="text-[22px] font-extrabold tracking-tight text-[#1f2937]">
                                Hướng Dẫn Ghi Nhớ Hình Ảnh
                            </h2>
                            <p className="text-[12px] font-semibold text-[#667085]">
                                Images Instructions • Chuẩn Trí Nhớ Memory League
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

                {/* ── 2. Modal Body ── */}
                <div className="flex-1 space-y-5 overflow-y-auto p-7 text-[#202b39]">

                    {/* Mục tiêu (Aim) */}
                    <div className="flex items-start gap-4 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-xs">
                            🎯
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[15px] font-extrabold text-[#1f2937]">Mục tiêu</h3>
                            <p className="text-[13px] leading-relaxed text-[#4b5563]">
                                Ghi nhớ các hình ảnh ngẫu nhiên một cách chính xác và nhanh nhất có thể.
                            </p>
                        </div>
                    </div>

                    {/* Cách tính điểm (Scoring) */}
                    <div className="flex items-start gap-4 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-[#1a7a4a] shadow-xs">
                            ✓
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-[15px] font-extrabold text-[#1f2937]">Cách tính điểm</h3>
                            <p className="text-[13px] leading-relaxed text-[#4b5563]">
                                Nhận <span className="font-bold text-[#1a7a4a]">1 điểm</span> cho mỗi hình ảnh được nhớ lại và xếp chính xác vị trí ban đầu.
                            </p>
                        </div>
                    </div>

                    {/* Thời gian (Time) */}
                    <div className="flex items-start gap-4 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-xs">
                            ⏳
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-[15px] font-extrabold text-[#1f2937]">Thời gian</h3>
                                <div className="flex gap-2">
                                    <span className="rounded-full border border-[#d7e5dd] bg-white px-2.5 py-0.5 text-xs font-bold text-[#1a7a4a]">
                                        1 phút ghi nhớ
                                    </span>
                                    <span className="rounded-full border border-[#d7e5dd] bg-white px-2.5 py-0.5 text-xs font-bold text-[#009e83]">
                                        4 phút xếp hình
                                    </span>
                                </div>
                            </div>
                            <p className="text-[13px] leading-relaxed text-[#4b5563]">
                                Nếu bạn đã ghi nhớ tất cả các hình ảnh trong vòng dưới 1 phút, bạn có thể dừng đồng hồ bấm giờ bất kỳ lúc nào để chuyển sang giai đoạn xếp hình.
                            </p>
                            <div className="rounded-xl bg-[#eef4f8] p-3 text-[12px] leading-relaxed text-[#374151]">
                                🛡️ <strong className="font-bold text-[#1f2937]">Quy tắc cốt lõi:</strong> Điểm số quan trọng hơn thời gian. Ví dụ: đúng 10 hình trong 60 giây vẫn tốt hơn đúng 9 hình trong 30 giây.
                            </div>
                        </div>
                    </div>

                    {/* Giai đoạn Ghi nhớ (Memorization) */}
                    <div className="flex items-start gap-4 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-xs">
                            👁️
                        </div>
                        <div className="flex-1 space-y-2.5">
                            <h3 className="text-[15px] font-extrabold text-[#1f2937]">Giai đoạn Ghi nhớ</h3>
                            <ul className="space-y-2 text-[13px] leading-relaxed text-[#4b5563]">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>
                                        Nhấn phím <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1f2937] shadow-xs">→</kbd> để chuyển sang hình tiếp theo, hoặc <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1f2937] shadow-xs">←</kbd> để quay lại.
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>
                                        Nhấn phím cách <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1f2937] shadow-xs">Space</kbd> hoặc phím <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1f2937] shadow-xs">↑</kbd> để quay nhanh về hình ảnh đầu tiên.
                                    </span>
                                </li>
                                <li className="flex flex-col gap-1.5 pt-1">
                                    <div className="font-semibold text-[#1f2937]">
                                        Để dừng đồng hồ bấm giờ (hoàn tất ghi nhớ sớm):
                                    </div>
                                    <div className="ml-4 space-y-1 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span>▪ Nhấn phím</span>
                                            <kbd className="rounded-md border border-[#c8d8d0] bg-white px-1.5 py-0.5 font-mono font-bold text-[#1f2937]">→</kbd>
                                            <span>2 lần liên tiếp nhanh khi đang ở hình ảnh cuối cùng, HOẶC</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span>▪ Bấm vào nút</span>
                                            <span className="rounded-full bg-[#1a7a4a] px-2.5 py-0.5 font-bold text-white">
                                                ✓ Tôi đã nhớ xong
                                            </span>
                                            <span>(Finished), HOẶC</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span>▪ Nhấn phím</span>
                                            <kbd className="rounded-md border border-[#c8d8d0] bg-white px-1.5 py-0.5 font-mono font-bold text-[#1f2937]">Enter ↵</kbd>
                                        </div>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Giai đoạn Xếp lại hình (Recall) */}
                    <div className="flex items-start gap-4 rounded-2xl border border-[#e0eee6] bg-[#f8faf9] p-4.5 transition hover:bg-[#f1f7f4]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-xs">
                            ✏️
                        </div>
                        <div className="flex-1 space-y-2">
                            <h3 className="text-[15px] font-extrabold text-[#1f2937]">Giai đoạn Xếp lại hình ảnh</h3>
                            <ul className="space-y-2 text-[13px] leading-relaxed text-[#4b5563]">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>Nhấp chuột vào một ô trống để chọn vị trí xếp hình.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>Nhấp vào một hình ảnh ở hàng bên dưới để đưa hình đó vào vị trí đã chọn.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>Nhấp vào một hình ảnh ở hàng bên trên để trả hình đó trở lại hàng dưới.</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>
                                        Nhấn phím <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1a7a4a]">+</kbd> để chèn thêm một vị trí, tự động dồn các hình phía sau sang (hoặc bấm vào con số phía trên vị trí hình).
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#1a7a4a]">•</span>
                                    <span>
                                        Nhấn phím <kbd className="rounded-md border border-[#c8d8d0] bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#c93b2b]">-</kbd> để xóa hình đã chọn, tự động kéo các hình phía sau về trước.
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>

                {/* ── 3. Modal Footer ── */}
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
