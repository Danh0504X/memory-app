import { Hash, Image, Smile, Spade, Type, type LucideIcon } from 'lucide-react-native';
import type { GameName } from './registry';

// Biểu tượng của từng trò trên ô màu (Hôm nay, Luyện tập, thanh trên cùng khi chơi)
export const GAME_ICONS: Record<GameName, LucideIcon> = {
    card: Spade,
    image: Image,
    number: Hash,
    facename: Smile,
    word: Type,
};
