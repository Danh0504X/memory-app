import { gamesApi, type GameCatalogItem, type StartedRound } from "@/features/shared-game/api/games.api";
import type { GameStats, LevelConfig, Person, RoundSubmissionResult } from "../types";
import { clientDeadline } from "../../shared-game/utils/deadline.ts";

export interface CreateRoundResponse {
    roundId: string;
    mode: "level" | "free";
    levelId?: number;
    settings: { faceCount: number; memorizeSeconds: number; recallSeconds: number };
    people: Person[];
    memorizeDeadline: string;
}

const statsFromCatalog = (game: GameCatalogItem): GameStats => ({
    unlockedLevel: game.player?.unlockedLevel ?? 1,
    totalRounds: game.player?.played ?? 0,
    bestScores: {}, totalAccuracies: [],
    completedLevels: Array.from({ length: (game.player?.unlockedLevel ?? 1) - 1 }, (_, index) => index + 1),
});

export const fetchFaceNameSetup = async (): Promise<{ levels: LevelConfig[]; stats: GameStats }> => {
    const { data } = await gamesApi.getGames();
    const game = data.games.find((item) => item.gameName === "facename");
    if (!game) throw new Error("FaceName is not available");
    return {
        levels: game.levels.map((level) => ({ levelId: level.level, faceCount: level.itemCount,
            memorizeSeconds: game.defaultMemorizeSec, recallSeconds: level.recallSec ?? game.recallSec,
            requiredScore: level.requiredScore ?? level.itemCount * game.passAccuracy,
            unlockThreshold: (level.requiredScore ?? level.itemCount * game.passAccuracy) / level.itemCount,
            nameType: level.level <= 2 ? "Tên phổ biến" : level.level <= 4 ? "Tên đa dạng" : "Tên quốc tế",
        })),
        stats: statsFromCatalog(game),
    };
};

const toRound = (round: StartedRound): CreateRoundResponse => ({
    roundId: round.sessionId, mode: round.rules.mode === "custom" ? "free" : "level",
    levelId: round.rules.gameLevel ?? undefined,
    settings: { faceCount: round.rules.totalItems, memorizeSeconds: round.rules.memorizeLimitSec, recallSeconds: round.rules.recallLimitSec },
    people: round.items.map((item) => ({ id: Number(item.code), name: item.label ?? "", imageUrl: item.imageUrl ?? "" })),
    memorizeDeadline: new Date(clientDeadline(round.memorizeDeadline, round.serverNow)).toISOString(),
});

export const startLevelRound = async (levelId: number) => toRound((await gamesApi.startRound({ gameName: "facename", mode: "level", gameLevel: levelId })).data.session);
export const startFreeRound = async (faceCount: number, memorizeSeconds: number, recallSeconds: number) =>
    toRound((await gamesApi.startRound({ gameName: "facename", mode: "custom", itemCount: faceCount, memorizeSec: memorizeSeconds, recallSec: recallSeconds })).data.session);

export const startFaceNameRecall = async (roundId: string) => {
    const round = (await gamesApi.startRecall(roundId)).data.session;
    return { ...round, recallDeadline: new Date(clientDeadline(round.recallDeadline, round.serverNow)).toISOString() };
};

export const submitFaceNameRound = async (roundId: string, answers: Array<{ personId: number; answer: string }>, _timeUsedSeconds: number): Promise<RoundSubmissionResult> => {
    // The store retains the original person order; recall only changes their visual order.
    const { data: { session } } = await gamesApi.submitRound(roundId, answers.map((item) => item.answer.trim() ? item.answer : null));
    const { result, rules } = session;
    return {
        round: session,
        roundId, mode: rules.mode === "custom" ? "free" : "level", levelId: rules.gameLevel ?? undefined,
        score: result.score ?? result.correctItems, maxScore: result.maxScore ?? result.totalItems,
        accuracy: Math.round(result.accuracy * 1000) / 10, correctCount: result.correctItems,
        incorrectCount: result.perItem.filter((item) => !item.correct && item.answer !== null).length,
        blankCount: result.perItem.filter((item) => item.answer === null).length,
        isPassed: result.result !== "fail", timeUsedSeconds: result.memorizeSec + result.recallSec,
        nextLevelUnlocked: result.result !== "fail" && !!rules.gameLevel && (session.unlockedLevel?.after ?? 1) > rules.gameLevel,
        unlockedLevel: session.unlockedLevel?.after ?? 1,
        results: result.perItem.map((item) => ({ personId: Number(item.expected.code), name: item.expected.label ?? "",
            answer: item.answer?.label ?? item.answer?.code ?? "", isCorrect: item.correct, isBlank: item.answer === null })),
    };
};
