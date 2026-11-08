import { useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameHome } from "./FaceNameHome";
import { FaceNameLevelSelect } from "./FaceNameLevelSelect";
import { FaceNameMemorizePhase } from "./FaceNameMemorizePhase";
import { FaceNameRecallPhase } from "./FaceNameRecallPhase";
import { FaceNameResultPhase } from "./FaceNameResultPhase";

export const FaceNameGame = () => {
  const { phase, initialize, isLoading, errorMessage, clearError, goHome } =
    useFaceNameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  let content = null;

  if (phase === "home") {
    content = <FaceNameHome />;
  } else if (phase === "level-select") {
    content = <FaceNameLevelSelect />;
  } else if (phase === "loading-faces" || isLoading) {
    content = (
      <div className="flex min-h-[calc(100vh-120px)] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e6efe8] text-[#2e7d32]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#1f2937]">Đang tải dữ liệu ván chơi...</h2>
        <p className="mt-1 text-sm text-[#77839a]">
          Hệ thống đang tải trước các hình ảnh gương mặt để đảm bảo trải nghiệm mượt mà.
        </p>
      </div>
    );
  } else if (phase === "memorize") {
    content = <FaceNameMemorizePhase />;
  } else if (phase === "recall" || phase === "submitting") {
    content = <FaceNameRecallPhase />;
  } else if (phase === "result") {
    content = <FaceNameResultPhase />;
  }

  return (
    <div className="min-h-screen bg-[#f8fbf8] font-sans antialiased text-[#1f2937]">
      <Header />

      {errorMessage && (
        <div className="mx-auto mt-4 max-w-xl px-4">
          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearError();
                goHome();
              }}
              className="text-xs font-bold underline hover:text-red-900"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      )}

      <main className="transition-opacity duration-300">{content}</main>
    </div>
  );
};

