import mascot from '@/assets/memio/mascot.svg';
import { LiveShape } from './LiveShape';

// Linh vật Memio: nhảy lên khi màn mở, chạm vào thì nhảy lại (khoảnh khắc của các màn tài khoản)
export function Mascot({ size = 88 }: { size?: number }) {
    return <LiveShape art={mascot} motion="hop" size={size} label="Linh vật Memio" tappable />;
}
