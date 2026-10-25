import { useState } from "react";
import { useImagesGameStore } from "../store/imagesGameStore";
import { getImageCountForLevel } from "../utils/imageUtils";
import { GameSettingsLayout } from "@/components/layout/GameSettingsLayout";
import { ImagesPreferencesModal } from "./ImagesPreferencesModal";
import { ImagesGuideModal } from "./ImagesGuideModal";
import { ImagesLevelExplanationModal } from "./ImagesLevelExplanationModal";

export const ImagesSettingsPhase = () => {
    const { level, memorizeTime, setMemorizeTime, startGame } = useImagesGameStore();
    const [showExplanation, setShowExplanation] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const imageCount = getImageCountForLevel(level);

    return (
        <>
            <GameSettingsLayout
                title="Hình ảnh"
                level={level}
                itemCount={imageCount}
                itemUnit="hình ảnh"
                memorizeTime={memorizeTime}
                setMemorizeTime={setMemorizeTime}
                onStart={startGame}
                onOpenExplanation={() => setShowExplanation(true)}
                onOpenGuide={() => setShowGuide(true)}
                onOpenPreferences={() => setShowPreferences(true)}
            />

            <ImagesLevelExplanationModal
                isOpen={showExplanation}
                onClose={() => setShowExplanation(false)}
                currentLevel={level}
            />

            <ImagesGuideModal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
            />

            <ImagesPreferencesModal
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
            />
        </>
    );
};
