import { useState } from "react";
import { useWordsGameStore } from "../store/wordsGameStore";
import { getWordCountForLevel } from "../utils/wordUtils";
import { GameSettingsLayout } from "@/components/layout/GameSettingsLayout";
import { WordsGuideModal } from "./WordsGuideModal";
import { WordsPreferencesModal } from "./WordsPreferencesModal";
import { WordsLevelExplanationModal } from "./WordsLevelExplanationModal";

export const WordsSettingsPhase = () => {
    const { level, memorizeTime, setMemorizeTime, startGame } = useWordsGameStore();
    const [showExplanation, setShowExplanation] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const wordCount = getWordCountForLevel(level);

    return (
        <>
            <GameSettingsLayout
                title="Từ"
                level={level}
                itemCount={wordCount}
                itemUnit="từ vựng"
                memorizeTime={memorizeTime}
                setMemorizeTime={setMemorizeTime}
                onStart={startGame}
                onOpenExplanation={() => setShowExplanation(true)}
                onOpenGuide={() => setShowGuide(true)}
                onOpenPreferences={() => setShowPreferences(true)}
            />

            <WordsLevelExplanationModal
                isOpen={showExplanation}
                onClose={() => setShowExplanation(false)}
                currentLevel={level}
            />

            <WordsGuideModal
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
            />

            <WordsPreferencesModal
                isOpen={showPreferences}
                onClose={() => setShowPreferences(false)}
            />
        </>
    );
};
