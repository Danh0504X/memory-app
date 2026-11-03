import { useState } from "react";
import { RoundSettings, RoundSettingsStatus } from "@/features/shared-game/components/RoundSettings";
import { useGameCatalog } from "@/features/shared-game/store/gameCatalogStore";
import { useImagesGameStore } from "../store/imagesGameStore";
import { ImagesPreferencesModal } from "./ImagesPreferencesModal";
import { PhotoBack } from "./PhotoTile";

export const ImagesSettingsPhase = () => {
    const { game, status, error: catalogError, reload } = useGameCatalog("image");
    const { memorizeTime, setMemorizeTime, selectedLevel, setSelectedLevel, startGame, pending, error } =
        useImagesGameStore();
    const [showPreferences, setShowPreferences] = useState(false);

    if (!game) {
        return <RoundSettingsStatus title="Hình ảnh" status={status} error={catalogError} onRetry={() => void reload()} />;
    }

    // Giá trị đang chọn có thể không còn hợp lệ khi luật ở backend thay đổi
    const memorizeSec = game.memorizeSecOptions.includes(memorizeTime) ? memorizeTime : game.defaultMemorizeSec;

    return (
        <>
            <RoundSettings
                title="Hình ảnh"
                itemUnit="hình ảnh"
                shortUnit="hình"
                renderBack={() => <PhotoBack size="sm" />}
                game={game}
                customItemCount={null}
                selectedLevel={selectedLevel}
                onSelectLevel={setSelectedLevel}
                memorizeSec={memorizeSec}
                onMemorizeSecChange={setMemorizeTime}
                onStart={(gameLevel) => void startGame(memorizeSec, gameLevel)}
                isStarting={pending === "start"}
                error={error}
                onOpenPreferences={() => setShowPreferences(true)}
            />

            {showPreferences && (
                <ImagesPreferencesModal
                    isOpen={showPreferences}
                    onClose={() => setShowPreferences(false)}
                    game={game}
                />
            )}
        </>
    );
};
