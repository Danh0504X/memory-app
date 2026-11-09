import type { ReactNode } from 'react';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Mascot } from '@/components/ui/Mascot';
import { Screen } from '@/components/ui/Screen';
import { FormError } from '@/features/auth/components/AuthParts';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useParentAction } from '../hooks/useParentResource';
import { GAME_META, type GameName } from '@/features/shared-game/registry';

export const gameLabel = (name: string) => GAME_META[name as GameName]?.label ?? name;
export const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString('vi-VN') : 'Chưa có';
export const percent = (value: number | null) => value === null ? 'Chưa có dữ liệu' : `${Math.round(value * 100)}%`;
export function ParentScreen({ title, children }: { title: string; children: ReactNode }) {
    return <Screen edges={['bottom']}><Mascot size={64} /><AppText variant="title">{title}</AppText>{children}</Screen>;
}
export function ParentNav() {
    return <>{[['Tổng quan', '/parent'], ['Hồ sơ của con', '/parent/child-profile'], ['Chơi cùng con', '/family-room'], ['Tài khoản phụ huynh', '/parent/profile']].map(([title, path]) =>
        <Button key={path} title={title} variant="secondary" onPress={() => router.navigate(path as Href)} />)}</>;
}
export function LogoutButton() {
    const action = useParentAction();
    return <><FormError>{action.error}</FormError><Button title="Đăng xuất" variant="secondary" loading={action.busy} onPress={() => void action.run(async () => {
        await useAuthStore.getState().logout(); router.replace('/login');
    })} /></>;
}
