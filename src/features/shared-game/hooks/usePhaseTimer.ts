import { useState, useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";

export const usePhaseTimer = (
    phaseDeadline: number | null,
    onExpire: () => void
) => {
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
        onExpireRef.current = onExpire;
    });

    const calculateRemaining = useCallback((deadline: number | null) => {
        if (!deadline) return 0;
        const diff = deadline - Date.now();
        if (diff <= 0) return 0;
        return Math.ceil(diff / 1000);
    }, []);

    const [prevDeadline, setPrevDeadline] = useState(phaseDeadline);
    const [timeLeft, setTimeLeft] = useState(() => calculateRemaining(phaseDeadline));

    if (phaseDeadline !== prevDeadline) {
        setPrevDeadline(phaseDeadline);
        setTimeLeft(calculateRemaining(phaseDeadline));
    }

    useEffect(() => {
        if (!phaseDeadline) return;

        let hasExpired = false;

        const checkTime = () => {
            const remaining = calculateRemaining(phaseDeadline);
            setTimeLeft(remaining);
            if (remaining <= 0) {
                if (!hasExpired) {
                    hasExpired = true;
                    onExpireRef.current?.();
                }
                return true;
            }
            return false;
        };

        if (checkTime()) return;

        const timer = setInterval(() => {
            if (checkTime()) {
                clearInterval(timer);
            }
        }, 200);

        // App bị đưa xuống nền thì interval ngừng chạy: khi quay lại, tính ngay theo deadline
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                checkTime();
            }
        });

        return () => {
            clearInterval(timer);
            subscription.remove();
        };
    }, [phaseDeadline, calculateRemaining]);

    const formattedTime = (() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    })();

    return { timeLeft, formattedTime };
};
