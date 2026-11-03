import { useState } from "react";
import { RoundSettings, RoundSettingsStatus } from "@/features/shared-game/components/RoundSettings";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useGameStore } from "../store/gameStore";
import { clamp } from "../utils/cardUtils";
import { CardPreferencesModal } from "./CardPreferencesModal";
import { CardBack } from "./PlayingCard";

export const SettingsPhase = () => {
  const { game, status, error: catalogError, reload } = useGameCatalog("card");
  const { memorizeTime, setMemorizeTime, selectedLevel, setSelectedLevel, startGame, preferences, pending, error } =
    useGameStore();
  const [showPreferences, setShowPreferences] = useState(false);

  if (!game) {
    return <RoundSettingsStatus title="Thẻ bài" status={status} error={catalogError} onRetry={() => void reload()} />;
  }

  // Giá trị đã lưu có thể không còn hợp lệ khi luật ở backend thay đổi
  const memorizeSec = game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec;
  const customCardCount =
    game.customItems && preferences.cardCount !== null
      ? clamp(preferences.cardCount, game.customItems.min, game.customItems.max)
      : null;

  return (
    <>
      <RoundSettings
        title="Thẻ bài"
        itemUnit="thẻ bài"
        shortUnit="lá"
        renderBack={() => <CardBack size="sm" />}
        game={game}
        customItemCount={customCardCount}
        selectedLevel={selectedLevel}
        onSelectLevel={setSelectedLevel}
        memorizeSec={memorizeSec}
        onMemorizeSecChange={setMemorizeTime}
        onStart={(gameLevel) => void startGame({ memorizeSec, customCardCount, gameLevel })}
        isStarting={pending === "start"}
        error={error}
        onOpenPreferences={() => setShowPreferences(true)}
      />
      {showPreferences && (
        <CardPreferencesModal isOpen={showPreferences} onClose={() => setShowPreferences(false)} game={game} />
      )}
    </>
  );
};
