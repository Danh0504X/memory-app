import { useState } from "react";
import { User } from "lucide-react";

interface FaceAvatarProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const BG_PALETTES = [
  "bg-emerald-100 text-emerald-800 border-emerald-300",
  "bg-amber-100 text-amber-800 border-amber-300",
  "bg-sky-100 text-sky-800 border-sky-300",
  "bg-violet-100 text-violet-800 border-violet-300",
  "bg-rose-100 text-rose-800 border-rose-300",
  "bg-teal-100 text-teal-800 border-teal-300",
  "bg-indigo-100 text-indigo-800 border-indigo-300",
];

export const FaceAvatar = ({ src, alt, size = "md", className = "" }: FaceAvatarProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Deterministic palette pick based on alt string
  let hash = 0;
  for (let i = 0; i < alt.length; i++) {
    hash = (hash << 5) - hash + alt.charCodeAt(i);
  }
  const paletteIndex = Math.abs(hash) % BG_PALETTES.length;
  const palette = BG_PALETTES[paletteIndex]!;

  const sizeClasses = {
    sm: "w-14 h-14 text-sm",
    md: "w-24 h-24 sm:w-28 sm:h-28 text-base",
    lg: "w-32 h-32 text-lg",
  }[size];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-[#e6efe8] bg-slate-50 transition-all ${sizeClasses} ${className}`}
    >
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse">
              <User className="h-6 w-6 text-slate-300" />
            </div>
          )}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            crossOrigin="anonymous"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
            }}
            className={`h-full w-full object-cover transition-opacity duration-200 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
          />
        </>
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-center border p-2 font-bold ${palette}`}
          title={alt}
        >
          <User className="mb-0.5 h-6 w-6 opacity-60" />
          <span className="truncate text-xs font-semibold">{alt.slice(0, 4)}</span>
        </div>
      )}
    </div>
  );
};

