import { useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

import memioLogo from '@/assets/memio/Logo/Memio.svg';
import egg from '@/assets/memio/guides/num-0-egg.svg';
import candle from '@/assets/memio/guides/num-1-candle.svg';
import swan from '@/assets/memio/guides/num-2-swan.svg';
import butterfly from '@/assets/memio/guides/num-3-butterfly.svg';
import boat from '@/assets/memio/guides/num-4-boat.svg';
import cherry from '@/assets/memio/guides/num-6-cherry.svg';
import snowman from '@/assets/memio/guides/num-8-snowman.svg';
import balloon from '@/assets/memio/guides/num-9-balloon.svg';
import '../auth.css';

// Hình móc số-hình của Memio trôi quanh tấm thẻ; depth càng lớn càng nghiêng mạnh theo con trỏ
const DRIFTERS = [
    { src: egg, x: '4%', y: '8%', size: 64, depth: 0.5, tilt: '-6deg' },
    { src: candle, x: '6%', y: '60%', size: 72, depth: 0.9, tilt: '4deg', side: true },
    { src: swan, x: '20%', y: '84%', size: 84, depth: 0.7, tilt: '-3deg' },
    { src: butterfly, x: '36%', y: '3%', size: 64, depth: 1, tilt: '8deg' },
    { src: boat, x: '70%', y: '85%', size: 80, depth: 0.6, tilt: '-5deg' },
    { src: balloon, x: '80%', y: '1%', size: 72, depth: 1.1, tilt: '5deg' },
    { src: cherry, x: '91%', y: '14%', size: 64, depth: 0.8, tilt: '-7deg', side: true },
    { src: snowman, x: '90.5%', y: '58%', size: 76, depth: 0.5, tilt: '3deg', side: true },
];

// Chuyển động mở màn chỉ chạy ở lần vào đầu tiên; chuyển qua lại login/register do view transition đảm nhận
let introPlayed = false;

type AuthSceneProps = {
    switchPrompt: string;
    switchLabel: string;
    switchTo: string;
    title: [string, string];
    lead: string;
    children: ReactNode;
};

// Khung chung cho đăng nhập / đăng ký: tấm thẻ vào phòng nhớ, xung quanh là các hình móc số trôi nhẹ
export const AuthScene = ({
    switchPrompt,
    switchLabel,
    switchTo,
    title,
    lead,
    children,
}: AuthSceneProps): ReactElement => {
    // Đến từ nút "nở thành thẻ" (state.morph) thì view transition đã lo chuyển động, bỏ qua mở màn
    const morphed = Boolean((useLocation().state as { morph?: boolean } | null)?.morph);
    const [intro] = useState(() => !introPlayed && !morphed);
    const wallRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        introPlayed = true;
    }, []);

    // Parallax theo con trỏ: chỉ ghi 2 biến CSS mỗi khung hình, phần còn lại do CSS transition làm mượt
    useEffect(() => {
        const wall = wallRef.current;
        if (!wall || !matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;

        let frame = 0;
        const onMove = (event: PointerEvent) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                wall.style.setProperty('--px', ((event.clientX / innerWidth) * 2 - 1).toFixed(3));
                wall.style.setProperty('--py', ((event.clientY / innerHeight) * 2 - 1).toFixed(3));
            });
        };

        addEventListener('pointermove', onMove, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            removeEventListener('pointermove', onMove);
        };
    }, []);

    return (
        <main className="auth" data-intro={intro}>
            <header className="auth__bar">
                <div className="auth__start">
                    <Link to="/" viewTransition className="auth-back" aria-label="Quay lại trang chủ">
                        <ArrowLeft size={18} aria-hidden="true" />
                        <span className="auth-back__label">Trang chủ</span>
                    </Link>
                    <Link to="/" viewTransition className="auth__mark" aria-label="Memio, về trang chủ">
                        <img src={memioLogo} alt="" width={147} height={36} />
                    </Link>
                </div>
                <p className="auth__switch">
                    <span className="auth__switch-prompt">{switchPrompt} </span>
                    <Link to={switchTo} viewTransition className="auth__link">
                        {switchLabel}
                    </Link>
                </p>
            </header>

            <div className="auth__wall" ref={wallRef}>
                <div className="drifters" aria-hidden="true">
                    {DRIFTERS.map((drifter, index) => (
                        <span
                            key={drifter.src}
                            className="drifter"
                            data-side={drifter.side ?? false}
                            style={{
                                '--x': drifter.x,
                                '--y': drifter.y,
                                '--size': `${drifter.size}px`,
                                '--depth': drifter.depth,
                                '--tilt': drifter.tilt,
                                '--i': index,
                            } as CSSProperties}
                        >
                            <img src={drifter.src} alt="" />
                        </span>
                    ))}
                </div>

                <section className="auth-card" aria-labelledby="auth-title">
                    <div className="auth-card__head">
                        <h1 id="auth-title" className="auth-card__title">
                            <span className="auth-line"><span style={{ '--i': 0 } as CSSProperties}>{title[0]}</span></span>
                            <span className="auth-line"><span style={{ '--i': 1 } as CSSProperties}>{title[1]}</span></span>
                        </h1>
                        <p className="auth-card__lead">{lead}</p>
                    </div>
                    <div className="auth-card__body">{children}</div>
                </section>
            </div>
        </main>
    );
};

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    id: string;
    label: string;
    error?: string;
    hint?: ReactNode;
    ref?: Ref<HTMLInputElement>;
    revealable?: boolean;
};

// Ô nhập trên thẻ; revealable = ô mật khẩu có nút hiện/ẩn
export const AuthField = ({
    id,
    label,
    error,
    hint,
    ref,
    revealable = false,
    type,
    ...inputProps
}: AuthFieldProps): ReactElement => {
    const [revealed, setRevealed] = useState(false);
    const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

    return (
        <div className="field" data-invalid={Boolean(error)}>
            <label htmlFor={id} className="field__label">{label}</label>
            <div className="field__control">
                <input
                    id={id}
                    ref={ref}
                    type={revealable && revealed ? 'text' : type}
                    aria-invalid={Boolean(error)}
                    aria-describedby={describedBy}
                    className="field__input"
                    {...inputProps}
                />
                {revealable && (
                    <button
                        type="button"
                        onClick={() => setRevealed(!revealed)}
                        aria-label={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="field__reveal"
                    >
                        {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {hint && <div id={`${id}-hint`}>{hint}</div>}
            {error && <p id={`${id}-error`} className="field__error">{error}</p>}
        </div>
    );
};
