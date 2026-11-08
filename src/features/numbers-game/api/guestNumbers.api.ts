import { gamesApi } from '@/features/shared-game/api/games.api';
import { clientDeadline } from '../../shared-game/utils/deadline.ts';
import type { NumberAnswers, NumberProgress, NumberSession, NumberSettings } from '../types/numberTypes';

const failure = (status: number, code: string, message: string) => ({ status, code, message });

// Guest rounds use the shared cookie-owned API. Draft answers stay in this tab; the server grades submission.
export const createGuestNumbersApi = (api: Pick<typeof gamesApi, 'startRound' | 'startRecall' | 'submitRound' | 'getGames'>) => {
    const sessions = new Map<string, NumberSession>();
    let generation = 0;
    const own = (id: string) => {
        const session = sessions.get(id);
        if (!session) throw failure(404, 'SESSION_NOT_FOUND', 'Guest session not found');
        return session;
    };
    const view = (session: NumberSession) => structuredClone({ ...session, serverNow: new Date().toISOString() });
    const answersFor = (session: NumberSession, revision: number, answers: NumberAnswers) => {
        if (revision !== session.revision) throw failure(409, 'REVISION_CONFLICT', 'Revision conflict');
        if (session.phase !== 'recalling') throw failure(409, 'INVALID_PHASE', 'Recall has not started');
        if (answers.length !== session.digitCount || answers.some((answer) => answer !== null && (typeof answer !== 'string' || !/^\d$/.test(answer)))) {
            throw failure(400, 'INVALID_ANSWERS', 'Invalid digit answers');
        }
        return [...answers];
    };
    const recall = async (id: string): Promise<NumberSession> => {
        const session = own(id);
        if (session.phase !== 'memorizing') return view(session);
        const current = generation;
        const { data: { session: round } } = await api.startRecall(id);
        if (current !== generation) throw failure(409, 'SESSION_CLOSED', 'Guest session was closed');
        Object.assign(session, {
            phase: 'recalling', digits: undefined, revision: session.revision + 1,
            recallStartedAt: new Date().toISOString(), recallEndsAt: new Date(clientDeadline(round.recallDeadline, round.serverNow)).toISOString(),
            memorizeUsedMs: Math.min(session.memorizeSeconds * 1000, Math.max(0, Date.now() - Date.parse(session.startedAt))),
        });
        return view(session);
    };
    return {
        clear: () => { generation++; sessions.clear(); },
        create: async (settings: NumberSettings): Promise<NumberSession> => {
            if (settings.mode === 'challenge') throw failure(401, 'AUTH_REQUIRED', 'Sign in to play the daily challenge');
            const current = generation;
            const { data: { session: round } } = await api.startRound({
                gameName: 'number', memorizeSec: settings.memorizeSeconds,
                ...(settings.level !== undefined ? { mode: 'level', gameLevel: settings.level }
                    : { mode: 'custom', itemCount: settings.digitCount ?? 8, recallSec: settings.recallSeconds }),
            });
            if (current !== generation) throw failure(409, 'SESSION_CLOSED', 'Guest session was closed');
            const session: NumberSession = {
                id: round.sessionId, mode: 'practice', level: round.rules.gameLevel, prepareRecall: false,
                digitCount: round.rules.totalItems, memorizeSeconds: round.rules.memorizeLimitSec, recallSeconds: round.rules.recallLimitSec,
                phase: 'memorizing', revision: 0, startedAt: new Date().toISOString(), serverNow: new Date().toISOString(),
                memorizeEndsAt: new Date(clientDeadline(round.memorizeDeadline, round.serverNow)).toISOString(),
                recallStartedAt: null, recallEndsAt: null, completedAt: null, completionReason: null, memorizeUsedMs: null,
                digits: round.items.map((item) => item.code), answers: Array(round.rules.totalItems).fill(null),
            };
            sessions.set(session.id, session);
            return view(session);
        },
        get: async (id: string) => view(own(id)),
        recall,
        ready: recall,
        save: async (id: string, revision: number, answers: NumberAnswers): Promise<NumberSession> => {
            const session = own(id);
            session.answers = answersFor(session, revision, answers);
            session.revision++;
            return view(session);
        },
        submit: async (id: string, revision: number, answers: NumberAnswers): Promise<NumberSession> => {
            const session = own(id);
            if (session.phase === 'completed') return view(session);
            const submitted = answersFor(session, revision, answers);
            const current = generation;
            const { data: { session: round } } = await api.submitRound(id, submitted);
            if (current !== generation) throw failure(409, 'SESSION_CLOSED', 'Guest session was closed');
            const { result } = round;
            Object.assign(session, {
                phase: 'completed', answers: submitted, revision: session.revision + 1, completedAt: round.completedAt,
                completionReason: 'submitted', completedRound: round, memorizeUsedMs: result.memorizeSec * 1000,
                result: { score: result.correctItems, accuracy: Math.round(result.accuracy * 10000) / 100,
                    correctCount: result.correctItems, total: result.totalItems,
                    wrongCount: result.perItem.filter((item) => !item.correct && item.answer !== null).length,
                    blankCount: result.perItem.filter((item) => item.answer === null).length,
                    completionReason: 'submitted', memorizeUsedMs: result.memorizeSec * 1000 },
                comparison: result.perItem.map((item, index) => ({ index, expected: item.expected.code,
                    actual: item.answer?.code ?? null, status: item.correct ? 'correct' : item.answer === null ? 'blank' : 'wrong' })),
            });
            return view(session);
        },
        progress: async (): Promise<NumberProgress> => {
            const { data } = await api.getGames();
            const game = data.games.find((item) => item.gameName === 'number');
            if (!game) throw failure(404, 'GAME_NOT_FOUND', 'Numbers is not available');
            return { unlockedLevel: game.player?.unlockedLevel ?? 1, digitCounts: game.levels.map((item) => item.itemCount), todayChallenge: { played: false } };
        },
    };
};

export const guestNumbersApi = createGuestNumbersApi(gamesApi);
