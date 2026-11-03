import { useEffect, type RefObject } from 'react';

// Gắn .is-in cho mọi [data-reveal] bên trong root khi chúng cuộn vào màn hình (chỉ một lần).
// CSS tương ứng nằm trong index.css; thứ tự xuất hiện chỉnh bằng biến --d trên từng phần tử.
export const useReveal = (root: RefObject<HTMLElement | null>) => {
    useEffect(() => {
        const element = root.current;
        if (!element) return;

        const targets = element.querySelectorAll('[data-reveal]');
        if (!('IntersectionObserver' in window)) {
            targets.forEach((target) => target.classList.add('is-in'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.classList.add('is-in');
                    observer.unobserve(entry.target);
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
        );

        targets.forEach((target) => observer.observe(target));
        return () => observer.disconnect();
    }, [root]);
};
