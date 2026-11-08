import { useState } from "react";
import {
  RoundSettings,
  RoundSettingsStatus,
} from "@/features/shared-game/components/RoundSettings";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useWordsGameStore } from "../store/wordsGameStore";
import { WordsPreferencesModal } from "./WordsPreferencesModal";
import { WordsLevelsModal } from "./WordsLevelsModal";
import { WordCard } from "./WordCard";

export const WordsSettingsPhase = () => {
  const { game, status, error: catalogError, reload } = useGameCatalog("word");
  const {
    memorizeTime,
    setMemorizeTime,
    selectedLevel,
    setSelectedLevel,
    startGame,
    pending,
    error,
  } = useWordsGameStore();

  const [showPreferences, setShowPreferences] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  if (!game) {
    return (
      <RoundSettingsStatus
        title="Ghi nhớ từ"
        status={status}
        error={catalogError}
        onRetry={() => void reload()}
      />
    );
  }

  const memorizeSec = game.memorizeSecOptions.includes(memorizeTime)
    ? memorizeTime
    : game.defaultMemorizeSec;

  return (
    <>
      <RoundSettings
        title="Ghi nhớ từ"
        itemUnit="từ vựng"
        shortUnit="từ"
        renderBack={() => <WordCard size="sm" isBack />}
        game={game}
        customItemCount={null}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        memorizeSec={memorizeSec}
        onMemorizeSecChange={setMemorizeTime}
        onStart={(gameLevel) =>
          void startGame({ gameLevel, memorizeSec })
        }
        isStarting={pending === "start"}
        error={error}
        onOpenPreferences={() => setShowPreferences(true)}
        onOpenLevels={() => setShowLevels(true)}
      />

      {showPreferences && (
        <WordsPreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {showLevels && (
        <WordsLevelsModal
          isOpen={showLevels}
          onClose={() => setShowLevels(false)}
        />
      )}
    </>
  );
};
