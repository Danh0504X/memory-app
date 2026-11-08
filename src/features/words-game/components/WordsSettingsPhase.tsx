import { useState, useMemo } from "react";
import { RoundSettings } from "@/features/shared-game/components/RoundSettings";
import type { GameCatalogItem } from "@/features/shared-game/api/games.api";
import { DEFAULT_WORDS_LEVELS } from "../api/wordsApi";
import { useWordsGameStore } from "../store/wordsGameStore";
import { WordsPreferencesModal } from "./WordsPreferencesModal";
import { WordsLevelsModal } from "./WordsLevelsModal";
import { WordCard } from "./WordCard";

export const WordsSettingsPhase = () => {
  const {
    memorizeTime,
    setMemorizeTime,
    selectedLevel,
    setSelectedLevel,
    unlockedLevel,
    startGame,
    pending,
    error,
  } = useWordsGameStore();

  const [showPreferences, setShowPreferences] = useState(false);
  const [showLevels, setShowLevels] = useState(false);

  // Xây dựng GameCatalogItem ảo từ cấu hình Words Game để tái sử dụng component RoundSettings
  const wordsCatalogItem: GameCatalogItem = useMemo(
    () => ({
      gameName: "card" as any, // Dùng schema tương thích
      maxLevel: 10,
      levels: DEFAULT_WORDS_LEVELS.map((l) => ({ level: l.level, itemCount: l.itemCount })),
      customItems: null,
      memorizeSecOptions: [30, 60, 120, 300],
      defaultMemorizeSec: 60,
      recallSec: 240,
      passAccuracy: 2 / 3,
      unlockOn: "pass",
      player: {
        unlockedLevel: unlockedLevel || 1,
        bestLevel: null,
        played: 0,
      },
    }),
    [unlockedLevel]
  );

  return (
    <>
      <RoundSettings
        title="Ghi nhớ từ"
        itemUnit="từ vựng"
        shortUnit="từ"
        renderBack={() => <WordCard size="sm" isBack />}
        game={wordsCatalogItem}
        customItemCount={null}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        memorizeSec={memorizeTime}
        onMemorizeSecChange={setMemorizeTime}
        onStart={(gameLevel) => void startGame({ gameLevel, memorizeSec: memorizeTime })}
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

