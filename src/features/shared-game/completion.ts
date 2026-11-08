import { notifyGameSessionRecorded } from "./events";
import { reloadGameCatalog } from "./store/gameCatalogStore";

const recorded = new Set<string>();

// A submit retry or result reload must not refresh the whole app twice for the same session.
export const synchronizeRoundCompletion = (sessionId: string) => {
    if (recorded.has(sessionId)) return;
    recorded.add(sessionId);
    notifyGameSessionRecorded();
    void reloadGameCatalog();
};
