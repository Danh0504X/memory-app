import { AlertCircle, LoaderCircle } from "lucide-react";

interface RoundStatusBarProps {
    pendingText: string | null;
    error: string | null;
}

// Dải thông báo dưới header khi đang chờ backend hoặc khi thao tác thất bại (bấm lại nút để thử lại)
export const RoundStatusBar = ({ pendingText, error }: RoundStatusBarProps) => {
    if (!pendingText && !error) return null;

    return (
        <div
            role={error ? "alert" : "status"}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold ${error ? "bg-[#fff1f0] text-[#b42318]" : "bg-[#e6f7ed] text-[#1a7a4a]"}`}
        >
            {error ? (
                <AlertCircle size={16} aria-hidden="true" />
            ) : (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            )}
            {error ?? pendingText}
        </div>
    );
};
