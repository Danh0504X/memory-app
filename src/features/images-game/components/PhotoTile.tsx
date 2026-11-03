import memioMark from "@/assets/memio/Logo/Memio.svg";
import type { ImageCard } from "../types/imageTypes";

type Size = "xs" | "sm" | "md" | "lg";

export const PhotoTile = ({ image, size, label }: { image: ImageCard; size?: Size; label: string }) => (
    <span className="ptile" data-size={size}>
        <img src={image.imageUrl} alt={label} draggable={false} />
    </span>
);

// Ảnh chưa xem: úp mặt vàng như lá bài
export const PhotoBack = ({ size }: { size?: Size }) => (
    <span className="ptile ptile--back" data-size={size} aria-hidden="true">
        <img src={memioMark} alt="" />
    </span>
);
