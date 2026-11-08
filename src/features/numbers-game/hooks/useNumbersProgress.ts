import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { numbersApi } from '../api/numbers.api';
import type { NumberProgress } from '../types/numberTypes';

export const useNumbersProgress = () => {
    const owner = useAuthStore((state) => state.user?._id ?? 'guest');
    const loading = useAuthStore((state) => state.isLoading);
    const [stored, setStored] = useState<{ owner: string; progress: NumberProgress } | null>(null);
    useEffect(() => {
        if (loading) return;
        let active = true;
        numbersApi.progress().then((progress) => { if (active) setStored({ owner, progress }); }).catch(() => {});
        return () => { active = false; };
    }, [owner, loading]);
    return !loading && stored?.owner === owner ? stored.progress : null;
};
