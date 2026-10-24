import { Header } from "@/components/layout/Header";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const GameSelectionPage = () => {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f8fbf8] font-sans text-[#1f2937]">
        {/* ── 2. Nội dung Chọn trò chơi ── */}
        <div className="mx-auto max-w-[1120px] px-6 py-12">
          {/* Title */}
          <div className="mb-10">
            <h1 className="text-[40px] font-extrabold tracking-tight text-[#1f2937]">
              Chọn trò chơi
            </h1>
          </div>

          {/* ── Danh sách Card Trò chơi ── */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1: Game Thẻ Bài */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedGame("cards");
                navigate("/games/cards");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/games/cards");
                }
              }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 bg-white p-7 text-left transition-all cursor-pointer ${selectedGame === "cards"
                ? "border-[#2e7d32] shadow-[0px_12px_32px_rgba(46,125,50,0.12)]"
                : "border-[#e3ebe6] hover:-translate-y-1 hover:border-[#9bc9a8] hover:shadow-lg"
                }`}
            >
              {/* Khung minh họa xếp thẻ bài */}
              <div className="relative mb-6 flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#f3f8f4]">
                <div className="relative h-[160px] w-[200px]">
                  <div className="absolute left-4 top-2 flex h-[130px] w-[90px] -rotate-12 items-center justify-center rounded-xl border border-[#fca5a5] bg-[#fee5e5] text-2xl font-bold text-[#b91c1c] shadow-md">
                    ♦ A
                  </div>
                  <div className="absolute left-14 top-1 flex h-[130px] w-[90px] rotate-6 items-center justify-center rounded-xl border border-[#a7f3d0] bg-[#e6f4ea] text-2xl font-bold text-[#047857] shadow-md">
                    ♣ K
                  </div>
                  <div className="absolute left-24 top-3 flex h-[130px] w-[90px] rotate-12 items-center justify-center rounded-xl border border-[#fde047] bg-[#fef7e0] text-2xl font-bold text-[#b45309] shadow-md">
                    ♠ 10
                  </div>
                </div>
              </div>

              {/* Tiêu đề & Thông tin */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[24px] font-extrabold text-[#1f2937] group-hover:text-[#2e7d32]">
                    Thẻ bài
                  </h2>
                  <span className="rounded-full bg-[#d7f1e4] px-3 py-1 text-[12px] font-bold text-[#246629]">
                    Luyện trí nhớ
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-medium text-[#667085]">
                  Ghi nhớ các lá bài và kiểm tra khả năng hồi đáp nhanh.
                </p>
              </div>
            </div>

            {/* Card 2: Game Hình ảnh */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedGame("images");
                navigate("/games/images");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/games/images");
                }
              }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 bg-white p-7 text-left transition-all cursor-pointer ${selectedGame === "images"
                ? "border-[#2e7d32] shadow-[0px_12px_32px_rgba(46,125,50,0.12)]"
                : "border-[#e3ebe6] hover:-translate-y-1 hover:border-[#9bc9a8] hover:shadow-lg"
                }`}
            >
              {/* Khung minh họa icon linh vật/hình ảnh */}
              <div className="relative mb-6 flex h-[220px] w-full items-center justify-center overflow-hidden rounded-[20px] bg-[#edf4fc]">
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs">
                    🍏
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs">
                    🌸
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs">
                    🍋
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-xs">
                    🍇
                  </div>
                </div>
              </div>

              {/* Tiêu đề & Thông tin */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[24px] font-extrabold text-[#1f2937] group-hover:text-[#2e7d32]">
                    Hình ảnh
                  </h2>
                  <span className="rounded-full bg-[#d7f1e4] px-3 py-1 text-[12px] font-bold text-[#246629]">
                    Luyện trí nhớ
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-medium text-[#667085]">
                  Ghi nhớ thứ tự các hình ảnh và kiểm tra khả năng hồi đáp
                  nhanh.
                </p>
              </div>
            </div>

            {/* Card 3: Game Từ ngẫu nhiên (Words Game) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedGame("words");
                navigate("/games/words");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/games/words");
                }
              }}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[28px] border-2 bg-white p-7 text-left transition-all cursor-pointer ${selectedGame === "words"
                ? "border-[#2e7d32] shadow-[0px_12px_32px_rgba(46,125,50,0.12)]"
                : "border-[#e3ebe6] hover:-translate-y-1 hover:border-[#9bc9a8] hover:shadow-lg"
                }`}
            >
              {/* Khung minh họa từ vựng */}
              <div className="relative mb-6 flex h-[220px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] bg-[#fbf5e8] p-4">
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-black text-sm text-[#b45309] shadow-sm">
                  <span>1.</span>
                  <span className="tracking-wide">airplane</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 font-bold text-xs text-[#77839a] shadow-xs">
                  <span>2.</span>
                  <span className="tracking-wide">crystal</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/70 px-4 py-1.5 font-semibold text-xs text-[#98a2b3]">
                  <span>3.</span>
                  <span className="tracking-wide">guitar</span>
                </div>
              </div>

              {/* Tiêu đề & Thông tin */}
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-[24px] font-extrabold text-[#1f2937] group-hover:text-[#2e7d32]">
                    Từ
                  </h2>
                  <span className="rounded-full bg-[#fef3c7] px-3 py-1 text-[12px] font-bold text-[#b45309]">
                    Luyện trí nhớ
                  </span>
                </div>
                <p className="mt-2 text-[15px] font-medium text-[#667085]">
                  Ghi nhớ danh sách từ vựng và gõ lại chuẩn xác từng vị trí.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default GameSelectionPage;
