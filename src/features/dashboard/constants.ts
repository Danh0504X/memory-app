import type { GameId } from './types';

// Thứ tự cố định: màu luôn đi theo game, không đổi khi lọc
export const GAME_IDS: readonly GameId[] = ['card', 'image'];

// Cặp màu đã kiểm tra khả năng phân biệt cho người mù màu (validate_palette, light)
export const GAME_META: Record<GameId, { label: string; color: string; unit: string; route: string }> = {
    card: { label: 'Thẻ bài', color: '#2e7d32', unit: 'lá', route: '/games/cards' },
    image: { label: 'Hình ảnh', color: '#2a78d6', unit: 'hình', route: '/games/images' },
};
