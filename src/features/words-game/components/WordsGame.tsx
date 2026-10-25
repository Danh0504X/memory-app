import { useWordsGameStore } from "../store/wordsGameStore";
import { WordsSettingsPhase } from "./WordsSettingsPhase";
import { WordsMemorizePhase } from "./WordsMemorizePhase";
import { WordsRecallPhase } from "./WordsRecallPhase";
import { WordsResultPhase } from "./WordsResultPhase";

export const WordsGame = () => {
    const { phase } = useWordsGameStore();
    let content = null;

    if (phase === "idle") content = <WordsSettingsPhase />;
    if (phase === "memorize") content = <WordsMemorizePhase />;
    if (phase === "recall") content = <WordsRecallPhase />;
    if (phase === "result") content = <WordsResultPhase />;

    return (
        <div className="min-h-screen bg-[#f5faf7]">
            {content}
        </div>
    );
};
