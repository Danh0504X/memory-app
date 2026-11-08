import { useCallback, useEffect, useState } from 'react';
import { dashboardApi, type ApiHistoryItem } from '../api/dashboard.api';
import type { GameFilter, GameSession } from '../types';

const PAGE_SIZE = 10;

export const toGameSession = (item: ApiHistoryItem): GameSession => ({
    id: item.sessionId,
    game: item.gameName,
    playedAt: new Date(item.completedAt),
    level: item.mode === 'level' ? item.gameLevel : null,
    totalItems: item.totalItems,
    correctItems: item.correctItems,
    accuracy: item.accuracy,
    grade: item.result,
    durationSec: item.memorizeSec + item.recallSec,
    expEarned: item.expEarned,
});

interface HistoryState {
    sessions: GameSession[];
    nextCursor: string | null;
    status: 'loading' | 'ready' | 'error';
    error: string | null;
}

const toErrorMessage = (error: unknown) =>
    (error as { message?: string }).message ?? 'Không thể tải lịch sử ván chơi. Vui lòng thử lại.';

// Lịch sử ván trong khoảng [from, to), tải từng trang khi người dùng bấm "Xem thêm"
export const useGameHistory = (from: string, to: string, game: GameFilter) => {
    const [state, setState] = useState<HistoryState>({
        sessions: [],
        nextCursor: null,
        status: 'loading',
        error: null,
    });

    const fetchPage = useCallback(async (cursor?: string) => {
        const { data } = await dashboardApi.getHistory({
            from,
            to,
            limit: PAGE_SIZE,
            cursor,
            game: game === 'all' ? undefined : game,
        });
        return { sessions: data.items.map(toGameSession), nextCursor: data.nextCursor };
    }, [from, to, game]);

    useEffect(() => {
        let isCurrent = true;

        const loadFirstPage = async () => {
            setState({ sessions: [], nextCursor: null, status: 'loading', error: null });
            try {
                const page = await fetchPage();
                if (isCurrent) setState({ ...page, status: 'ready', error: null });
            } catch (error) {
                if (isCurrent) setState((current) => ({ ...current, status: 'error', error: toErrorMessage(error) }));
            }
        };

        void loadFirstPage();
        return () => {
            isCurrent = false;
        };
    }, [fetchPage]);

    const loadMore = useCallback(async () => {
        if (!state.nextCursor || state.status === 'loading') return;
        setState((current) => ({ ...current, status: 'loading', error: null }));
        try {
            const page = await fetchPage(state.nextCursor);
            setState((current) => ({
                sessions: [...current.sessions, ...page.sessions],
                nextCursor: page.nextCursor,
                status: 'ready',
                error: null,
            }));
        } catch (error) {
            setState((current) => ({ ...current, status: 'error', error: toErrorMessage(error) }));
        }
    }, [fetchPage, state.nextCursor, state.status]);

    return { ...state, loadMore };
};
