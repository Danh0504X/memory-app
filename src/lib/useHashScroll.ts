import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Đưa tới phần tử có id trùng với #hash trên đường dẫn.
// Vừa từ trang khác sang thì nhảy thẳng và cho phần đang trên màn hình hiện ngay (class reveal-instant trong
// index.css), vì hiệu ứng chuyển trang đã là chuyển động; cuộn mượt qua cả trang nữa chỉ thêm thời gian chờ.
// Đang ở trong trang mà đổi hash (bấm mục lục) thì cuộn mượt.
export const useHashScroll = () => {
    const { hash } = useLocation();
    const arriving = useRef(true);

    useEffect(() => {
        if (!hash) {
            arriving.current = false;
            return;
        }
        const target = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (!target) return;

        const instant = arriving.current;
        let release = 0;
        const timer = window.setTimeout(() => {
            if (instant) document.documentElement.classList.add('reveal-instant');
            target.scrollIntoView({ behavior: instant ? 'instant' : 'smooth' });
            arriving.current = false;
            if (instant) release = window.setTimeout(() => document.documentElement.classList.remove('reveal-instant'), 500);
        }, 0);

        return () => {
            window.clearTimeout(timer);
            window.clearTimeout(release);
            document.documentElement.classList.remove('reveal-instant');
        };
    }, [hash]);
};
