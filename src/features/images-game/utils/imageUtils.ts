import { Image } from "expo-image";
import type { ItemView } from "@/features/shared-game/api/games.api";
import type { ImageCard } from "../types/imageTypes";

// Backend gửi mã ảnh kèm đường dẫn; mã được dùng làm id và gửi lại khi nộp bài
export const imageFromView = (item: ItemView): ImageCard => ({
    id: item.code,
    imageUrl: item.imageUrl ?? "",
});

// Chờ tối đa vài giây khi mạng chậm để không giữ người chơi ở màn cài đặt quá lâu
const PRELOAD_TIMEOUT_MS = 3500;

// Tải trước ảnh vào cache của expo-image để ảnh hiện ngay khi vào phase ghi nhớ; ảnh lỗi vẫn bỏ qua để không treo ván
export const preloadImages = (urls: string[]): Promise<void> => {
    if (urls.length === 0) return Promise.resolve();

    const load = Image.prefetch(urls).then(() => undefined, () => undefined);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, PRELOAD_TIMEOUT_MS));

    return Promise.race([load, timeout]);
};
