// Class dùng chung cho các màn Ghi nhớ số; giữ màu và kiểu nút của Memio.
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d631b] focus-visible:ring-offset-2';

export const primaryButton = `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#2e7d32] px-8 py-3 text-lg font-bold text-white shadow-[0px_8px_20px_rgba(46,125,50,0.3),0px_4px_0px_#1b5e20] transition hover:bg-[#236527] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const secondaryButton = `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#2e7d32] bg-white px-6 py-3 text-base font-bold text-[#1a7a4a] transition hover:bg-[#e6f7ed] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const quietButton = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#d7e5dd] bg-white px-4 py-2 text-base font-semibold text-[#2f3a4a] transition hover:border-[#1a7a4a] hover:text-[#1a7a4a] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;
export const fieldClass = `min-h-11 w-full rounded-xl border border-[#b9cfc3] bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-[#2e7d32]`;
export const mutedText = 'text-[#586274]';

