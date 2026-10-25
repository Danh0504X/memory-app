import { useState } from "react";
import { LevelExplanationModal } from "@/features/cards-game/components/LevelExplanationModal";
import { GameGuideModal } from "@/features/cards-game/components/GameGuideModal";
import { Header } from "./Header";

const MAX_LEVEL = 10;

const MEMORIZE_TIME_OPTIONS = [
    { value: 30, label: "30 giây" },
    { value: 60, label: "60 giây" },
    { value: 120, label: "2 phút" },
    { value: 300, label: "5 phút" },
];

const getLevelLabel = (lvl: number) => {
    if (lvl <= 3) return "Mức căn bản";
    if (lvl <= 6) return "Mức trung cấp";
    return "Mức nâng cao";
};


interface GameSettingsLayoutProps {
    title: string;
    level: number;
    itemCount: number;
    itemUnit: string; // ví dụ: "thẻ bài" hoặc "hình ảnh"
    memorizeTime: number;
    setMemorizeTime: (time: number) => void;
    onStart: () => void;
    onOpenPreferences?: () => void;
    onOpenGuide?: () => void;
    onOpenExplanation?: () => void;
}

export const GameSettingsLayout = ({
    title,
    level,
    itemCount,
    itemUnit,
    memorizeTime,
    setMemorizeTime,
    onStart,
    onOpenPreferences,
    onOpenGuide,
    onOpenExplanation,
}: GameSettingsLayoutProps) => {
    const [activeTab, setActiveTab] = useState("Tiêu chuẩn");
    const [showExplanation, setShowExplanation] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    return (
        <>
            <Header />
            <main className="min-h-screen bg-[#f6fcf8] px-4 py-8 font-sans text-[#121c2a]">
                <div className="mx-auto flex max-w-4xl flex-col items-start gap-6">
                    <header className="flex w-full items-center justify-between">
                        <h1 className="text-[40px] font-extrabold tracking-[-1px] text-[#0d631b]">
                            {title}
                        </h1>

                        <button
                            type="button"
                            onClick={onOpenExplanation || (() => setShowExplanation(true))}
                            className="flex items-center gap-1.5 rounded-full bg-[#eff4ff] px-4 py-1.5 text-[13px] font-bold text-[#40493d] shadow-sm transition hover:bg-[#dfe9fb] cursor-pointer"
                        >
                            <span>💡</span>
                            <span>Giải thích cấp độ</span>
                        </button>
                    </header>

                    <LevelExplanationModal
                        isOpen={showExplanation}
                        onClose={() => setShowExplanation(false)}
                    />
                    <GameGuideModal
                        isOpen={showGuide}
                        onClose={() => setShowGuide(false)}
                    />

                    <div className="flex w-full flex-wrap items-center justify-between gap-4">
                        <nav className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onOpenGuide || (() => setShowGuide(true))}
                                className="flex items-center gap-1.5 rounded-full bg-[#dee9fc] px-5 py-2 text-[14px] font-bold text-[#121c2a] shadow-sm hover:bg-[#d0e0fb] cursor-pointer"
                            >
                                📖 Hướng dẫn
                            </button>
                            <button
                                type="button"
                                onClick={onOpenPreferences}
                                className="flex items-center gap-1.5 rounded-full bg-[#dee9fc] px-5 py-2 text-[14px] font-bold text-[#121c2a] shadow-sm hover:bg-[#d0e0fb] cursor-pointer"
                            >
                                ⚙️ Tùy chọn
                            </button>
                        </nav>

                        <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-[0px_8px_30px_rgba(0,0,0,0.05)]">
                            {["Tiêu chuẩn", "Thử thách ngày"].map((tab) => {
                                const isActive = activeTab === tab;
                                return (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                        className={`flex items-center gap-1.5 rounded-[48px] px-5 py-2 text-[14px] font-bold transition-all cursor-pointer ${isActive
                                            ? "bg-[#2e7d32] text-[#cbffc2] shadow-sm"
                                            : "text-[#40493d] hover:bg-[#f3f8f4]"
                                            }`}
                                    >
                                        <span>{tab === "Tiêu chuẩn" ? "★" : "🏆"}</span>
                                        <span>{tab}</span>
                                        {tab === "Thử thách ngày" && (
                                            <span className="rounded-full bg-[#ffdf97] px-2 py-0.5 text-[11px] font-bold text-[#251a00]">
                                                Mới
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <section className="relative w-full overflow-hidden rounded-[32px] bg-white p-8 shadow-[0px_2px_6px_rgba(0,0,0,0.05),0px_8px_30px_rgba(0,0,0,0.0a)]">
                        <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#80f7d833] blur-[32px]" />

                        <div className="relative z-10 flex flex-col gap-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-[28px] font-extrabold tracking-[-0.3px] text-[#121c2a]">
                                    Cấp độ {level}
                                </h2>
                                <span className="flex items-center gap-1.5 rounded-full bg-[#a3f69c] px-4 py-1 text-[13px] font-bold text-[#002204]">
                                    {getLevelLabel(level)}
                                </span>

                                <div className="flex items-center gap-1 rounded-full bg-[#dee9fc] px-3 py-1 text-[13px] font-bold text-[#121c2a]">
                                    ⏱️
                                    {MEMORIZE_TIME_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setMemorizeTime(opt.value)}
                                            className={`rounded-full px-2 py-0.5 text-[12px] transition cursor-pointer ${memorizeTime === opt.value
                                                ? "bg-[#2e7d32] text-white"
                                                : "hover:bg-[#cbffc2]"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <p className="max-w-xl text-[18px] leading-[29px] text-[#40493d]">
                                Bạn có <strong className="font-bold text-[#0d631b]">{itemCount} {itemUnit}</strong> cần ghi nhớ. Ghi nhớ và chọn đúng tất cả để mở khóa cấp độ {level < MAX_LEVEL ? level + 1 : level} nhé!
                            </p>

                            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#40493d]">
                                <span>Độ chính xác yêu cầu: 100%</span>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={onStart}
                                    className="flex items-center justify-center gap-2 rounded-full bg-[#2e7d32] px-8 py-4 text-[18px] font-bold text-white shadow-[0px_8px_20px_rgba(46,125,50,0.3),0px_4px_0px_#1b5e20] transition hover:bg-[#236527] active:translate-y-1 active:shadow-none cursor-pointer"
                                >
                                    <span>Bắt đầu</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
};
