import { LoaderCircle } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useWordsGameStore } from "../store/wordsGameStore";
import { WordsSettingsPhase } from "./WordsSettingsPhase";
import { WordsPrepPhase } from "./WordsPrepPhase";
import { WordsMemorizePhase } from "./WordsMemorizePhase";
import { WordsRecallPhase } from "./WordsRecallPhase";
import { WordsResultPhase } from "./WordsResultPhase";
import "@/features/shared-game/game.css";

export const WordsGame = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const phase = useWordsGameStore((state) => state.phase);

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <LoaderCircle
          size={28}
          className="animate-spin text-[var(--color-brand)]"
          aria-label="Đang tải"
        />
      </div>
    );
  }

  if (phase === "prep") return <WordsPrepPhase />;
  if (phase === "memorize") return <WordsMemorizePhase />;
  if (phase === "recall") return <WordsRecallPhase />;
  if (phase === "result") return <WordsResultPhase />;
  return <WordsSettingsPhase />;
};

export default WordsGame;

