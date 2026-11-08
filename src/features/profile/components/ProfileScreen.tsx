import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { LiveShape } from '@/components/ui/LiveShape';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState, Panel } from '@/components/ui/Panel';
import { TextField } from '@/components/ui/TextField';
import { enterUp } from '@/constants/motion';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GAME_META } from '@/features/dashboard/constants';
import { PROFILE_KEY, useCatalog, useProfile } from '@/features/dashboard/hooks/useOverview';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { setQuery } from '@/lib/queryCache';
import type { ApiErrorResponse } from '@/types/auth.types';
import { profileApi, type UserProfile } from '../api/profile.api';
import { buildBadges, isEarned, type Badge } from '../utils/badges';
import { GOAL_LABELS, describeTargetDate, formatMinutes } from '../utils/preferences';
import { formatNumber, getLevelProgress } from '../utils/profileProgress';

export function ProfileScreen() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <AppText variant="title">Hồ sơ</AppText>
                    <AppText variant="lead">Đăng nhập để lưu EXP, kỷ lục và chuỗi ngày luyện tập trên mọi thiết bị.</AppText>
                    <Button title="Đăng nhập" onPress={() => router.push('/login')} />
                    <Button title="Tạo tài khoản" variant="secondary" onPress={() => router.push('/register')} />
                </ScrollView>
            </SafeAreaView>
        );
    }
    return <MemberProfile />;
}

// Hồ sơ trả lời một câu: "Tôi đã đạt được gì, và tài khoản của tôi"
function MemberProfile() {
    const profile = useProfile();
    const catalog = useCatalog();
    const { reload: reloadProfile } = profile;
    const { reload: reloadCatalog } = catalog;

    // Nộp xong một ván thì EXP, chuỗi ngày và huy hiệu cập nhật theo
    useEffect(
        () =>
            onGameSessionRecorded(() => {
                reloadProfile();
                reloadCatalog();
            }),
        [reloadProfile, reloadCatalog],
    );

    const games = catalog.state.status === 'ready' ? catalog.state.data : null;
    const badges = profile.state.status === 'ready' && games ? buildBadges(profile.state.data, games) : null;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={() => {
                            reloadProfile();
                            reloadCatalog();
                        }}
                        tintColor={colors.brand}
                    />
                }
            >
                <BlockState request={profile.state} onRetry={reloadProfile}>
                    {(data) => <Header profile={data} badges={badges} />}
                </BlockState>

                <Button title="Xem tiến độ chi tiết" variant="secondary" onPress={() => router.push('/progress')} />

                <Panel title="Huy hiệu">
                    {badges ? <Badges badges={badges} /> : <BlockState request={catalog.state} onRetry={reloadCatalog}>{() => null}</BlockState>}
                </Panel>

                {profile.state.status === 'ready' ? (
                    <Panel title="Kỷ lục cá nhân">
                        <BlockState request={catalog.state} onRetry={reloadCatalog}>
                            {(data) => <Records profile={profile.state.status === 'ready' ? profile.state.data : null} games={data} />}
                        </BlockState>
                    </Panel>
                ) : null}

                <Panel title="Mục tiêu luyện tập">
                    <BlockState request={profile.state} onRetry={reloadProfile}>
                        {(data) => <Goals profile={data} />}
                    </BlockState>
                </Panel>

                <Panel title="Tài khoản">
                    <BlockState request={profile.state} onRetry={reloadProfile}>
                        {(data) => <Account profile={data} onSaved={reloadProfile} />}
                    </BlockState>
                </Panel>
            </ScrollView>
        </SafeAreaView>
    );
}

function Header({ profile, badges }: { profile: UserProfile; badges: Badge[] | null }) {
    const progress = getLevelProgress(profile.level);
    const initials = profile.username.trim().split(/\s+/).slice(-2).map((word) => word.charAt(0).toUpperCase()).join('');
    return (
        <Animated.View entering={enterUp(0)} style={styles.header}>
            <View style={styles.headerTop}>
                <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>{initials || 'M'}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                    <AppText variant="heading" numberOfLines={1}>{profile.username}</AppText>
                    <AppText variant="small">
                        Cấp {profile.level.level} · {formatNumber(profile.exp)} EXP
                        {badges ? ` · ${badges.filter(isEarned).length}/${badges.length} huy hiệu` : ''}
                    </AppText>
                </View>
            </View>
            <ProgressBar value={progress.percentage / 100} track={colors.white} />
            <AppText variant="small">Còn {formatNumber(progress.remaining)} EXP lên cấp {progress.nextLevel}</AppText>
        </Animated.View>
    );
}

function Badges({ badges }: { badges: Badge[] }) {
    return (
        <View style={styles.badges}>
            {badges.map((badge) => {
                const earned = isEarned(badge);
                return (
                    <View
                        key={badge.id}
                        style={[styles.badge, earned ? styles.badgeEarned : null]}
                        accessibilityLabel={`${badge.title}: ${earned ? 'đã đạt' : badge.unit(badge.current)}`}
                    >
                        <View style={[styles.badgeShape, !earned && styles.badgeLocked]}>
                            {earned ? <LiveShape art={badge.shape} motion={badge.motion} size={44} tappable /> : <badge.shape width={44} height={44} />}
                        </View>
                        <AppText variant="small" style={styles.badgeTitle} numberOfLines={2}>{badge.title}</AppText>
                        <AppText variant="small" style={styles.badgeProgress}>{earned ? 'Đã đạt' : badge.unit(badge.current)}</AppText>
                    </View>
                );
            })}
        </View>
    );
}

// Kỷ lục lấy từ số liệu backend giữ trọn đời (hồ sơ và danh sách trò), không suy ra từ lịch sử gần đây
function Records({ profile, games }: { profile: UserProfile | null; games: GameCatalogItem[] }) {
    if (!profile) return null;
    return (
        <View>
            <RecordRow label="Chuỗi ngày dài nhất" value={`${profile.longestStreak} ngày`} />
            <RecordRow label="Tổng EXP" value={formatNumber(profile.exp)} />
            {games.map((game) => {
                const best = game.player?.bestLevel ?? null;
                return (
                    <RecordRow
                        key={game.gameName}
                        label={GAME_META[game.gameName].label}
                        sub={`Đã mở cấp ${game.player?.unlockedLevel ?? 1}/${game.maxLevel} · ${formatNumber(game.player?.played ?? 0)} ván`}
                        value={best ? `Hoàn hảo cấp ${best}` : 'Chưa có'}
                    />
                );
            })}
        </View>
    );
}

function RecordRow({ label, sub, value }: { label: string; sub?: string; value: string }) {
    return (
        <View style={styles.recordRow}>
            <View style={{ flex: 1 }}>
                <AppText style={styles.recordLabel}>{label}</AppText>
                {sub ? <AppText variant="small">{sub}</AppText> : null}
            </View>
            <AppText style={styles.recordValue}>{value}</AppText>
        </View>
    );
}

function Goals({ profile }: { profile: UserProfile }) {
    const { goals, dailyMinutes, targetDate, status } = profile.preferences;
    return (
        <View style={{ gap: spacing.sm }}>
            {status === 'answered' && goals.length > 0 ? (
                <>
                    <AppText variant="body">{goals.map((goal) => GOAL_LABELS[goal]).join(' · ')}</AppText>
                    {dailyMinutes ? <AppText variant="small">Mỗi ngày {formatMinutes(dailyMinutes)}</AppText> : null}
                    {targetDate ? <AppText variant="small">Ngày thi: {describeTargetDate(targetDate)}</AppText> : null}
                </>
            ) : (
                <AppText variant="body">Chưa đặt mục tiêu. Chọn mục tiêu để Memio gợi ý đúng trò và số ván mỗi ngày.</AppText>
            )}
            <Button title={status === 'answered' ? 'Đổi mục tiêu' : 'Chọn mục tiêu'} variant="secondary" onPress={() => router.push('/goals')} />
        </View>
    );
}

// Khớp với kiểm tra ở backend (profile.service.ts): bỏ khoảng trắng hai đầu, 2–100 ký tự
const validateName = (value: string) => {
    const name = value.trim();
    if (name.length < 2) return 'Tên hiển thị cần ít nhất 2 ký tự.';
    if (name.length > 100) return 'Tên hiển thị tối đa 100 ký tự.';
    return null;
};

function Account({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
    const { user, updateUser, logout } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(profile.username);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const save = async () => {
        const invalid = validateName(name);
        if (invalid) return setError(invalid);
        setSaving(true);
        setError(null);
        try {
            const { data } = await profileApi.updateUsername(name.trim());
            setQuery(PROFILE_KEY, data.profile);
            updateUser({ username: data.profile.username });
            setEditing(false);
            onSaved();
        } catch (saveError) {
            setError((saveError as ApiErrorResponse).message || 'Không lưu được tên. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    const onLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
        } catch {
            // logout() luôn xoá phiên trên máy; lỗi mạng chỉ làm backend chưa thu hồi được refresh token
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <View style={{ gap: spacing.md }}>
            {editing ? (
                <View style={{ gap: spacing.sm }}>
                    <TextField label="Tên hiển thị" value={name} onChangeText={setName} error={error ?? undefined} maxLength={100} autoFocus onSubmitEditing={() => void save()} />
                    <View style={styles.inline}>
                        <Button title="Lưu" loading={saving} onPress={() => void save()} style={{ flex: 1 }} />
                        <Button
                            title="Huỷ"
                            variant="secondary"
                            disabled={saving}
                            onPress={() => {
                                setEditing(false);
                                setName(profile.username);
                                setError(null);
                            }}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>
            ) : (
                <SettingRow label="Tên hiển thị" value={profile.username} action="Đổi" onPress={() => setEditing(true)} />
            )}
            {user?.email ? <SettingRow label="Email đăng nhập" value={user.email} /> : null}
            <SettingRow
                label="Mật khẩu"
                value={user?.hasPassword === false ? 'Chưa đặt (đăng nhập bằng Google)' : '••••••••'}
                action={user?.hasPassword === false ? 'Đặt' : 'Đổi'}
                onPress={() => router.push('/change-password')}
            />
            <Button title="Đăng xuất" variant="secondary" loading={loggingOut} onPress={() => void onLogout()} />
        </View>
    );
}

function SettingRow({ label, value, action, onPress }: { label: string; value: string; action?: string; onPress?: () => void }) {
    return (
        <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
                <AppText variant="small">{label}</AppText>
                <AppText style={styles.recordLabel} numberOfLines={1}>{value}</AppText>
            </View>
            {action && onPress ? <Button title={action} variant="secondary" onPress={onPress} style={styles.rowButton} /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.md },
    header: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, backgroundColor: colors.mint },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.white },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    badge: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 4, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.wall, borderWidth: 1, borderColor: colors.step },
    badgeEarned: { backgroundColor: '#fff8e1', borderColor: colors.sun },
    badgeShape: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
    badgeLocked: { opacity: 0.3 },
    badgeTitle: { fontFamily: fonts.semibold, color: colors.ink, textAlign: 'center' },
    badgeProgress: { fontSize: 12, lineHeight: 16, textAlign: 'center' },
    recordRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.step },
    recordLabel: { fontFamily: fonts.semibold, color: colors.ink },
    recordValue: { fontFamily: fonts.bold, color: colors.brandDeep },
    inline: { flexDirection: 'row', gap: spacing.sm },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    rowButton: { minHeight: 40, paddingHorizontal: 14 },
});
