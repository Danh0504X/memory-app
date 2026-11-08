import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { gamesApi, type CompletedRound, type GameName } from "../api/games.api";

type ResultState = { id: string; owner: string | null } & (
    | { status: "loading" }
    | { status: "ready"; round: CompletedRound }
    | { status: "error" }
);

// Loading the recorded result is read-only: retrying here never submits answers or grants rewards again.
export const useCompletedRound = (sessionId: string, gameName: GameName, knownRound?: CompletedRound) => {
    const owner = useAuthStore((state) => state.user?._id ?? null);
    const [state, setState] = useState<ResultState>({ id: sessionId, owner, status: "loading" });
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        if (knownRound?.sessionId === sessionId && knownRound.gameName === gameName && knownRound.status === 'completed') return;
        let active = true;
        gamesApi.getCompletedRound(sessionId).then((round) => {
            if (round.gameName !== gameName) throw new Error("Wrong game result");
            if (active) setState({ id: sessionId, owner, status: "ready", round });
        }).catch(() => { if (active) setState({ id: sessionId, owner, status: "error" }); });
        return () => { active = false; };
    }, [sessionId, gameName, owner, attempt, knownRound]);
    const retry = useCallback(() => {
        setState({ id: sessionId, owner, status: "loading" });
        setAttempt((value) => value + 1);
    }, [sessionId, owner]);
    if (knownRound?.sessionId === sessionId && knownRound.gameName === gameName && knownRound.status === 'completed') {
        return { state: { status: 'ready' as const, round: knownRound }, retry };
    }
    return { state: state.id === sessionId && state.owner === owner ? state : { status: "loading" as const }, retry };
};
