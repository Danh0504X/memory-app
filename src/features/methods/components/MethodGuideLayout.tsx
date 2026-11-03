import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";

interface MethodGuideLayoutProps {
    breadcrumbCurrent: string;
    title: string;
    description: string;
    children: React.ReactNode;
    practiceLabel: string;
    practiceLink: string;
    backMethodParam: "story" | "numbers" | "loci";
    nextMethodLink: string;
    nextMethodLabel?: string;
}

export const MethodGuideLayout: React.FC<MethodGuideLayoutProps> = ({
    breadcrumbCurrent,
    title,
    description,
    children,
    practiceLabel,
    practiceLink,
    backMethodParam,
    nextMethodLink,
    nextMethodLabel = "Xem kỹ thuật khác",
}) => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-[#F8FBF8] font-sans text-[#1F2937]">
            <Header />

            <main className="mx-auto max-w-[1040px] px-5 py-8 md:py-12">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] text-[#2E7D32]">
                    <Link to={`/?method=${backMethodParam}#methods`} viewTransition className="hover:underline">
                        Các cách ghi nhớ
                    </Link>
                    <span className="text-[#5F6B7A] select-none">→</span>
                    <span className="font-medium text-[#1F2937]">{breadcrumbCurrent}</span>
                </nav>

                {/* Hero / Page Header */}
                <header className="mt-4 mb-8">
                    <h1 className="text-[32px] font-bold leading-[1.2] text-[#1F2937] md:text-[44px]">
                        {title}
                    </h1>
                    <p className="mt-4 text-[15px] leading-[1.65] text-[#5F6B7A] md:text-[16px] max-w-[880px]">
                        {description}
                    </p>
                </header>

                {/* Main Content Sections */}
                <div className="space-y-6">
                    {children}

                    {/* Section: Bài tự thử */}
                    <section className="rounded-[24px] border border-[#E3EBE6] bg-white p-6 md:p-10 shadow-sm">
                        <h2 className="text-[20px] font-bold text-[#1F2937] md:text-[24px]">
                            Bài tự thử
                        </h2>
                        <p className="mt-3 text-[15px] leading-[1.65] text-[#5F6B7A]">
                            Xem đề, che đi và tự gọi tên hoặc tự kể trong đầu. Chỉ mở đáp án sau khi bạn đã thử.
                        </p>
                        <div className="mt-6">
                            <Link
                                to={practiceLink}
                                className="flex h-[52px] w-full items-center justify-center rounded-[14px] bg-[#2E7D32] px-8 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#236527]"
                            >
                                {practiceLabel}
                            </Link>
                        </div>
                    </section>
                </div>

                {/* Footer Navigation Buttons */}
                <div className="mt-6 flex flex-col gap-3">
                    <Link
                        to={`/?method=${backMethodParam}#methods`}
                        viewTransition
                        className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#E3EBE6] bg-white px-8 text-[15px] font-semibold text-[#1F2937] transition-colors duration-200 hover:bg-[#F0FAF3] hover:text-[#2E7D32]"
                    >
                        ← Trở lại các cách ghi nhớ
                    </Link>
                    <Link
                        to={nextMethodLink}
                        viewTransition
                        className="flex h-[52px] w-full items-center justify-center rounded-[14px] border border-[#E3EBE6] bg-white px-8 text-[15px] font-semibold text-[#1F2937] transition-colors duration-200 hover:bg-[#F0FAF3] hover:text-[#2E7D32]"
                    >
                        {nextMethodLabel}
                    </Link>
                </div>
            </main>
        </div>
    );
};
