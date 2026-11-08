import { useCallback, useEffect, useState } from 'react';
import { fetchQuery, peekQuery, prefetchQuery } from '@/lib/queryCache';
import { profileApi, type UserProfile } from '@/features/profile/api/profile.api';
import { gamesApi, type GameCatalogItem } from '@/features/shared-game/api/games.api';
import { dashboardApi } from '../api/dashboard.api';
import { toGameSession } from './useGameHistory';
import type { GameSession } from '../types';

// Mỗi khối trên dashboard tự tải và tự báo lỗi: một API hỏng không làm trắng cả trang
export type Request<T> =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; data: T };

const toMessage = (error: unknown, fallback: string) => (error as { message?: string }).message ?? fallback;

// Đọc qua bộ nhớ đệm (lib/queryCache): có dữ liệu cũ thì hiện ngay rồi làm mới ở nền,
// đang có request cùng khoá thì dùng chung. loader phải ổn định (khai báo ở cấp module).
export const useRequest = <T>(key: string, loader: () => Promise<T>, fallbackError: string) => {
    const [state, setState] = useState<Request<T>>(() => {
        const cached = peekQuery<T>(key);
        return cached === undefined ? { status: 'loading' } : { status: 'ready', data: cached };
    });
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isCurrent = true;
        fetchQuery(key, loader, { force: reloadKey > 0 })
            .then((data) => isCurrent && setState({ status: 'ready', data }))
            .catch((error) => {
                // Đang hiện dữ liệu cũ thì giữ nguyên, chỉ báo lỗi khi chưa có gì để hiện
                if (isCurrent) setState((current) => (current.status === 'ready' ? current : { status: 'error', message: toMessage(error, fallbackError) }));
            });
        return () => {
            isCurrent = false;
        };
    }, [key, loader, fallbackError, reloadKey]);

    const reload = useCallback(() => {
        setState((current) => (current.status === 'ready' ? current : { status: 'loading' }));
        setReloadKey((count) => count + 1);
    }, []);

    return { state, reload };
};

const loadProfile = async (): Promise<UserProfile> => (await profileApi.getProfile()).data.profile;

const loadCatalog = async (): Promise<GameCatalogItem[]> => (await gamesApi.getGames()).data.games;

// Đủ để vẽ dải 14 ngày: lật trang (50 ván mỗi trang) tới khi qua mốc 14 ngày, tối đa 6 trang
export const STRIP_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAGES = 6;

const loadRecent = async (): Promise<GameSession[]> => {
    // Lùi thêm 1 ngày để không hụt ngày đầu dải khi múi giờ trình duyệt khác múi giờ của backend
    const cutoff = Date.now() - (STRIP_DAYS + 1) * DAY_MS;
    const sessions: GameSession[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
        const { data } = await dashboardApi.getHistory({ limit: 50, cursor });
        sessions.push(...data.items.map(toGameSession));
        cursor = data.nextCursor ?? undefined;
        const oldest = sessions.at(-1);
        if (!cursor || !oldest || oldest.playedAt.getTime() < cutoff) break;
    }
    return sessions;
};

export const PROFILE_KEY = 'profile';
const CATALOG_KEY = 'games';
const RECENT_KEY = 'recent-sessions';

export const loadProfileQuery = loadProfile;

export const useProfile = () => useRequest(PROFILE_KEY, loadProfile, 'Không tải được thông tin tài khoản.');
export const useCatalog = () => useRequest(CATALOG_KEY, loadCatalog, 'Không tải được danh sách trò chơi.');
export const useRecentSessions = () => useRequest(RECENT_KEY, loadRecent, 'Không tải được các ván gần đây.');

// Tải trước khi người dùng rê chuột / focus vào link, để lúc bấm trang hiện đủ ngay
export const prefetchProfilePage = () => {
    prefetchQuery(PROFILE_KEY, loadProfile);
    prefetchQuery(CATALOG_KEY, loadCatalog);
};

export const prefetchDashboardBase = () => {
    prefetchProfilePage();
    prefetchQuery(RECENT_KEY, loadRecent);
};
