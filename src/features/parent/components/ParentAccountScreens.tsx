import { useCallback, useState } from 'react';
import { router, type Href } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Panel, BlockState } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { FormError } from '@/features/auth/components/AuthParts';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { parentApi } from '../api/parent.api';
import { roomsApi } from '../api/rooms.api';
import { useParentAction, useParentResource } from '../hooks/useParentResource';
import { dateLabel, LogoutButton, ParentNav, ParentScreen } from './ParentParts';

export function ParentPendingScreen() {
    const action = useParentAction();
    return <ParentScreen title="Chờ xác minh email">
        <AppText>Mở liên kết trong email và chọn xác nhận. Bạn có thể hoàn tất trên web rồi quay lại ứng dụng. Nếu cần gửi lại email, hãy thực hiện từ tài khoản con ở mục Phụ huynh đồng hành.</AppText>
        <FormError>{action.error}</FormError>
        <Button title="Tôi đã xác minh — kiểm tra lại" loading={action.busy} onPress={() => void action.run(async () => {
            const user = await authApi.refreshToken(); useAuthStore.getState().saveSession(user);
            if (!user.isEmailVerified) throw new Error('Email chưa được xác minh. Hãy kiểm tra hộp thư.');
            router.replace('/parent' as Href);
        })} />
        <Button title="Đổi mật khẩu" variant="secondary" onPress={() => router.push('/parent/password' as Href)} />
        <Button title="Mở liên kết xác minh trong app" variant="secondary" onPress={() => router.push('/parent/verify' as Href)} />
        <LogoutButton />
    </ParentScreen>;
}

export function ParentVerifyScreen({ rawToken }: { rawToken?: string }) {
    const [input, setInput] = useState('');
    // Web emails use #token=; allow pasting the exact link without logging or persisting it.
    const value = rawToken ?? input;
    const token = value.match(/(?:[?#&]token=)([\w-]+)/)?.[1] ?? value;
    const loader = useCallback(async () => {
        if (!/^[\w-]{40,80}$/.test(token)) throw new Error('Nhập liên kết xác minh trong email.');
        return parentApi.inspect(token);
    }, [token]);
    const request = useParentResource(loader);
    const action = useParentAction();
    const [done, setDone] = useState(false);
    return <ParentScreen title="Xác minh email phụ huynh">
        {!rawToken && !done && <TextField label="Dán liên kết xác minh từ email" value={input} onChangeText={setInput} autoCapitalize="none" autoCorrect={false} />}
        <FormError>{action.error}</FormError>
        {done ? <><AppText>Email đã được xác minh.</AppText><Button title="Tiếp tục" onPress={() => router.replace((useAuthStore.getState().user?.role === 'parent' ? '/parent/pending' : '/login') as Href)} /></> :
            <BlockState request={request.state} onRetry={request.reload}>{() => <Button title="Xác nhận email" loading={action.busy} onPress={() => void action.run(async () => {
                await parentApi.verify(token); setDone(true);
                // Do not mark the currently logged-in parent verified: link may belong to another account.
                if (useAuthStore.getState().user?.role === 'parent') {
                    try { useAuthStore.getState().saveSession(await authApi.refreshToken()); } catch { /* continue via pending retry */ }
                }
            })} />}</BlockState>}
    </ParentScreen>;
}

export function ParentProfileScreen() {
    const user = useAuthStore((s) => s.user);
    const request = useParentResource(roomsApi.points);
    return <ParentScreen title="Tài khoản phụ huynh">
        <Panel title={user?.username}><AppText>{user?.email}</AppText><AppText>Email đã xác minh</AppText></Panel>
        <Button title="Đổi mật khẩu" onPress={() => router.push('/parent/password' as Href)} />
        <Panel title="Điểm đồng hành"><BlockState request={request.state} onRetry={request.reload}>{(data) => <>
            <AppText variant="title">{data.points} điểm</AppText>
            <AppText>Hoàn thành đủ các vòng, cả hai cùng tham gia: 10 điểm mỗi phiên.</AppText>
            {!data.sessions.length && <AppText>Chưa có phiên được ghi nhận.</AppText>}
            {data.sessions.map((session) => <AppText key={session.roomId}>{dateLabel(session.earnedAt)} · +{session.points} điểm</AppText>)}
            <AppText variant="small">Hiển thị tối đa 50 phiên gần nhất.</AppText>
        </>}</BlockState></Panel>
        <ParentNav /><LogoutButton />
    </ParentScreen>;
}
