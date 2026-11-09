import { router } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { authApi } from '@/features/auth/api/auth.api';
import { AuthHeader, FormError } from '@/features/auth/components/AuthParts';
import { useAuthStore } from '@/features/auth/store/authStore';
import { sessionStore } from '@/lib/session';
import type { ApiErrorResponse } from '@/types/auth.types';

const LOSES = ['EXP, cấp tài khoản và huy hiệu', 'Cấp đã mở và kỷ lục của mọi trò', 'Lịch sử ván chơi và chuỗi ngày', 'Mục tiêu luyện tập'];

// Xoá tài khoản (App Store/Google Play bắt buộc có). Backend xoá user và mọi dữ liệu gắn với nó (DELETE /api/profile).
export function DeleteAccountScreen() {
    const hasPassword = useAuthStore((state) => state.user?.hasPassword !== false);
    const clearSession = useAuthStore((state) => state.clearSession);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const remove = async () => {
        setDeleting(true);
        setError(null);
        try {
            await authApi.deleteAccount(hasPassword ? password : undefined);
            sessionStore.clearTokens();
            clearSession();
            router.dismissTo('/');
            Alert.alert('Đã xoá tài khoản', 'Toàn bộ dữ liệu của bạn đã được xoá khỏi Memio.');
        } catch (deleteError) {
            setError((deleteError as ApiErrorResponse).message || 'Không xoá được tài khoản. Vui lòng thử lại.');
            setDeleting(false);
        }
    };

    // Hỏi lại một lần nữa: không hoàn tác được
    const confirm = () => {
        if (hasPassword && !password) return setError('Vui lòng nhập mật khẩu để xác nhận.');
        Alert.alert('Xoá vĩnh viễn tài khoản?', 'Không thể khôi phục sau khi xoá.', [
            { text: 'Huỷ', style: 'cancel' },
            { text: 'Xoá', style: 'destructive', onPress: () => void remove() },
        ]);
    };

    return (
        <Screen
            edges={['bottom']}
            footer={
                <>
                    <FormError>{error}</FormError>
                    <Button title="Xoá tài khoản" tone={{ color: colors.danger, edge: '#a61e1e' }} loading={deleting} onPress={confirm} />
                </>
            }
        >
            <AuthHeader
                title="Xoá tài khoản"
                line="Tài khoản và mọi dữ liệu sẽ bị xoá vĩnh viễn, không khôi phục được."
                icon={<TriangleAlert color={colors.danger} size={48} />}
                tint={colors.dangerTint}
            />
            <View style={styles.list}>
                <AppText style={styles.listTitle}>Bạn sẽ mất</AppText>
                {LOSES.map((item) => (
                    <AppText key={item} variant="body">• {item}</AppText>
                ))}
            </View>
            {hasPassword ? (
                <TextField
                    label="Nhập mật khẩu để xác nhận"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="current-password"
                    textContentType="password"
                    onSubmitEditing={confirm}
                />
            ) : null}
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: { gap: 4, padding: spacing.md, borderRadius: radius * 1.25, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line },
    listTitle: { fontFamily: fonts.extrabold, color: colors.ink },
});
