import { useState } from "react";
import { RoundSettings } from "@/features/shared-game/components/RoundSettings";
import { useFaceNameStore } from "../store/faceNameStore";
import { FaceNameFreeConfigModal } from "./FaceNameFreeConfigModal";
import type { GameCatalogItem, GameName } from "@/features/shared-game/api/games.api";
import memioMark from "@/assets/memio/Logo/Memio.svg";

export const FaceNameSettingsPhase = () => {
  const {
    levels,
    stats,
    selectedLevel,
    setSelectedLevel,
    memorizeTime,
    setMemorizeTime,
    startLevelGame,
    isLoading,
    errorMessage,
  } = useFaceNameStore();
  const [showPreferences, setShowPreferences] = useState(false);

  const defaultLevels = [
    { level: 1, itemCount: 6 },
    { level: 2, itemCount: 8 },
    { level: 3, itemCount: 10 },
    { level: 4, itemCount: 12 },
    { level: 5, itemCount: 14 },
    { level: 6, itemCount: 16 },
    { level: 7, itemCount: 18 },
    { level: 8, itemCount: 22 },
    { level: 9, itemCount: 26 },
    { level: 10, itemCount: 30 },
  ];

  const gameCatalogItem: GameCatalogItem = {
    gameName: "facename" as unknown as GameName,
    maxLevel: 10,
    levels: levels.length
      ? levels.map((lvl) => ({ level: lvl.levelId, itemCount: lvl.faceCount }))
      : defaultLevels,
    customItems: { min: 3, max: 30 },
    memorizeSecOptions: [30, 60, 120, 240],
    defaultMemorizeSec: 60,
    recallSec: 120,
    passAccuracy: 0.7,
    unlockOn: "pass",
    player: {
      unlockedLevel: stats.unlockedLevel || 1,
      bestLevel: stats.completedLevels.length > 0 ? Math.max(...stats.completedLevels) : null,
      played: stats.totalRounds || 0,
    },
  };

  const handleStart = (level: number) => {
    void startLevelGame(level, memorizeTime);
  };

  return (
    <>
      <RoundSettings
        title="Gương mặt & Tên"
        itemUnit="gương mặt"
        shortUnit="người"
        game={gameCatalogItem}
        customItemCount={null}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        memorizeSec={memorizeTime}
        onMemorizeSecChange={setMemorizeTime}
        onStart={handleStart}
        isStarting={isLoading}
        error={errorMessage}
        onOpenPreferences={() => setShowPreferences(true)}
        renderBack={() => (
          <span className="ptile ptile--back" data-size="sm" aria-hidden="true">
            <img src={memioMark} alt="" />
          </span>
        )}
      />

      <FaceNameFreeConfigModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
};
