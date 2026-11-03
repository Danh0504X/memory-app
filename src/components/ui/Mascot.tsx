import mascotSvg from "@/assets/memio/mascot.svg?raw";

// Linh vật Memio nhúng thẳng SVG để mắt có thể chớp (CSS .mascot trong index.css)
export const Mascot = ({ className = "" }: { className?: string }) => (
    <span className={`mascot ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: mascotSvg }} />
);
