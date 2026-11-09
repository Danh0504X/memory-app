import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { Request } from '@/features/dashboard/hooks/useOverview';

// No shared cache: reports and family data must not leak between accounts or filters.
export function useParentResource<T>(loader: () => Promise<T>) {
    const accountId = useAuthStore((s) => s.user?._id);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<{ loader: typeof loader; accountId: string | undefined; attempt: number; state: Request<T> }>({ loader, accountId, attempt, state: { status: 'loading' } });
    const reload = useCallback(() => setAttempt((n) => n + 1), []);
    useFocusEffect(useCallback(() => {
        let active = true;
        const setState = (state: Request<T>) => { if (active) setResult({ loader, accountId, attempt, state }); };
        setState({ status: 'loading' });
        void loader().then((data) => setState({ status: 'ready', data }))
            .catch((error) => setState({ status: 'error', message: error?.message ?? 'Không tải được dữ liệu.' }));
        const sub = AppState.addEventListener('change', (next) => { if (next === 'active') reload(); });
        return () => { active = false; sub.remove(); };
    }, [loader, attempt, accountId, reload]));
    const state: Request<T> = result.loader === loader && result.accountId === accountId && result.attempt === attempt ? result.state : { status: 'loading' };
    return { state, reload };
}

// Ref locks synchronously, before React has committed the disabled button.
export function useParentAction() {
    const lock = useRef(false);
    const mounted = useRef(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const run = async (action: () => Promise<void>) => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError(null);
        try { await action(); }
        catch (cause) { if (mounted.current) setError((cause as { message?: string })?.message ?? 'Không thực hiện được. Hãy thử lại.'); }
        finally { lock.current = false; if (mounted.current) setBusy(false); }
    };
    return { busy, error, run };
}
