import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { numbersApi } from '../api/numbers.api';
import type { NumberProgress } from '../types/numberTypes';

// Tiến độ trò Ghi nhớ số cho thẻ ở trang chọn trò chơi. Trò này cần đăng nhập nên khách không gọi API.
export const useNumbersProgress = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const [progress, setProgress] = useState<NumberProgress | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        let active = true;
        numbersApi
            .progress()
            .then((value) => active && setProgress(value))
            .catch(() => {
                /* Thẻ vẫn hiện được không cần số liệu */
            });
        return () => {
            active = false;
        };
    }, [isAuthenticated]);

    return isAuthenticated ? progress : null;
};
