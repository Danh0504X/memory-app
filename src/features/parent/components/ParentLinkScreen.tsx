import { useState } from 'react';
import { router } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Panel, BlockState } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { FormError } from '@/features/auth/components/AuthParts';
import { useAuthStore } from '@/features/auth/store/authStore';
import { parentApi } from '../api/parent.api';
import { useParentAction, useParentResource } from '../hooks/useParentResource';
import { ParentScreen } from './ParentParts';

export function ParentLinkScreen() {
    const request = useParentResource(parentApi.link);
    const action = useParentAction();
    const user = useAuthStore((s) => s.user);
    const [form, setForm] = useState({ fullname: '', email: '', password: '', confirmPassword: '' });
    const [resendAt, setResendAt] = useState(0);
    const register = async () => {
        if (form.fullname.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) throw new Error('Nhập họ tên và email hợp lệ.');
        if (form.password.length < 8 || form.password !== form.confirmPassword) throw new Error('Mật khẩu từ 8 ký tự và xác nhận phải khớp.');
        try { await parentApi.register(form); }
        finally { request.reload(); } // Account may exist even when SMTP fails.
    };
    return <ParentScreen title="Phụ huynh đồng hành">
        <AppText>Con: {user?.username}. Ba mẹ xác minh email để xem hoạt động của tài khoản này.</AppText>
        <FormError>{action.error}</FormError>
        <BlockState request={request.state} onRetry={request.reload}>{(link) => <Panel>
            {link.state === 'none' ? <>
                {(['fullname', 'email', 'password', 'confirmPassword'] as const).map((key) => <TextField key={key}
                    label={{ fullname: 'Họ tên phụ huynh', email: 'Email phụ huynh', password: 'Mật khẩu', confirmPassword: 'Xác nhận mật khẩu' }[key]}
                    value={form[key]} onChangeText={(value) => setForm((old) => ({ ...old, [key]: value }))}
                    autoCapitalize={key === 'fullname' ? 'words' : 'none'} secureTextEntry={key.toLowerCase().includes('password')}
                    keyboardType={key === 'email' ? 'email-address' : 'default'} maxLength={key === 'fullname' ? 100 : 254} />)}
                <Button title="Đăng ký tài khoản phụ huynh" loading={action.busy} onPress={() => void action.run(register)} />
            </> : link.state === 'pending' ? <>
                <AppText>Chờ xác minh email {link.maskedEmail}. Kiểm tra cả thư rác. Liên kết có hiệu lực 24 giờ.</AppText>
                <Button title="Gửi lại email xác minh" loading={action.busy} onPress={() => void action.run(async () => {
                    if (Date.now() < resendAt) throw new Error(`Vui lòng chờ ${Math.ceil((resendAt - Date.now()) / 1000)} giây trước khi gửi lại.`);
                    await parentApi.resend(); setResendAt(Date.now() + 60000); request.reload();
                })} />
            </> : <><AppText>Đã liên kết với {link.fullname}. Ba mẹ đăng nhập trên thiết bị khác để chơi cùng lúc.</AppText>
                <Button title="Đăng nhập phụ huynh trên máy này" loading={action.busy} onPress={() => void action.run(async () => {
                    await useAuthStore.getState().logout(); router.replace('/login');
                })} /></>}
        </Panel>}</BlockState>
        <Button title="Kiểm tra lại trạng thái" variant="secondary" onPress={request.reload} />
    </ParentScreen>;
}
