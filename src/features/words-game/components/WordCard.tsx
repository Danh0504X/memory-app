import type { FC } from "react";
import { BookOpen } from "lucide-react";

interface WordCardProps {
  word?: string;
  index?: number;
  size?: "lg" | "md" | "sm" | "xs";
  isBack?: boolean;
  status?: "normal" | "correct" | "wrong";
  className?: string;
}

export const WordCard: FC<WordCardProps> = ({
  word,
  index,
  size = "md",
  isBack = false,
  status = "normal",
  className = "",
}) => {
  // Mặt sau của thẻ từ (dùng cho bài úp hoặc hình đại diện ở màn Settings)
  if (isBack) {
    const sizeClasses = {
      lg: "w-48 h-64 text-base",
      md: "w-36 h-48 text-sm",
      sm: "w-24 h-32 text-xs",
      xs: "w-14 h-18 text-[10px]",
    }[size];

    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl border-2 border-emerald-700/30 bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-md select-none ${sizeClasses} ${className}`}
      >
        <div className="absolute inset-2 flex items-center justify-center rounded-xl border border-white/20 bg-white/5">
          <BookOpen className="opacity-80" size={size === "xs" ? 14 : size === "sm" ? 20 : 32} />
        </div>
      </div>
    );
  }

  // Mặt trước của thẻ từ
  const sizeClasses = {
    lg: "min-w-[200px] max-w-[280px] h-48 sm:h-56 px-6 py-6 text-2xl sm:text-3xl font-bold",
    md: "min-w-[150px] max-w-[220px] h-36 sm:h-44 px-4 py-4 text-xl sm:text-2xl font-bold",
    sm: "min-w-[110px] max-w-[150px] h-24 sm:h-28 px-3 py-2 text-sm sm:text-base font-semibold",
    xs: "min-w-[70px] max-w-[90px] h-14 sm:h-16 px-2 py-1 text-xs font-medium",
  }[size];

  const statusBorder = {
    normal: "border-[#e0eee6] bg-white text-[#121c2a] shadow-sm hover:border-[#1a7a4a]",
    correct: "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm",
    wrong: "border-rose-400 bg-rose-50 text-rose-900 shadow-sm",
  }[status];

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 text-center transition-all select-none ${sizeClasses} ${statusBorder} ${className}`}
    >
      {index !== undefined && (
        <span className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
          {index}
        </span>
      )}
      <span className="break-words leading-tight tracking-wide px-1">
        {word || "..."}
      </span>
    </div>
  );
};

