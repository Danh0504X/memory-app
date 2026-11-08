import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/features/cards-game/store/gameStore';
import { useImagesGameStore } from '@/features/images-game/store/imagesGameStore';
import { GAME_META } from '@/features/dashboard/constants';
import { useRequest } from '@/features/dashboard/hooks/useOverview';
import { dailyApi, type DailyChallengeView } from '../api/daily.api';

const loadDaily = async (): Promise<DailyChallengeView> => (await dailyApi.get()).data;

// Đi qua bộ nhớ đệm chung: trang chủ và trang thử thách dùng chung một lần tải; sau mỗi ván bộ đệm bị xoá nên số liệu luôn mới
export const useDailyChallenge = () => useRequest('daily-challenge', loadDaily, 'Không tải được thử thách hôm nay.');

const pad = (value: number) => String(value).padStart(2, '0');

// Đồng hồ tới lúc đổi đề, chạy từng giây; hết giờ thì gọi onEnd (tải đề mới)
export const useCountdown = (endsAt: string | null, onEnd?: () => void) => {
    const [now, setNow] = useState(() => Date.now());
    const ended = useRef(false);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const seconds = endsAt ? Math.max(0, Math.floor((Date.parse(endsAt) - now) / 1000)) : null;

    useEffect(() => {
        if (seconds === 0 && !ended.current) {
            ended.current = true;
            onEnd?.();
        }
    }, [seconds, onEnd]);

    if (seconds === null) return null;
    return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
};

const describeStartError = (error: unknown) => {
    const { status } = (error as { status?: number } | null) ?? {};
    if (status === 409) return 'Bạn đã dùng lượt thử thách hôm nay. Quay lại vào ngày mai nhé.';
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    return 'Không bắt đầu được thử thách. Vui lòng thử lại.';
};

// Dùng lượt hôm nay: lấy ván từ backend, nạp vào store của đúng trò rồi chuyển sang trang trò đó (vào thẳng phase ghi nhớ)
export const useStartDaily = (onFailed?: () => void) => {
    const navigate = useNavigate();
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const start = async () => {
        setStarting(true);
        setError(null);
        try {
            const { data } = await dailyApi.start();
            if (data.session.gameName === 'card') useGameStore.getState().loadRound(data.session);
            else await useImagesGameStore.getState().loadRound(data.session);
            navigate(GAME_META[data.session.gameName].route);
        } catch (startError) {
            setError(describeStartError(startError));
            setStarting(false);
            onFailed?.();
        }
    };

    return { start, starting, error };
};
