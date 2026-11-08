import { useState, useEffect, useRef, useCallback } from "react";

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

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkTime();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [phaseDeadline, calculateRemaining]);

    const formattedTime = (() => {
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    })();

    return { timeLeft, formattedTime };
};
