import { router } from 'expo-router';
import { BarChart3, Bell, CalendarDays, ChevronDown, ChevronRight, Flame, KeyRound, LogOut, Mail, Medal, Pencil, Sparkles, Target } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { LiveShape } from '@/components/ui/LiveShape';
import { BlockState } from '@/components/ui/Panel';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { TextField } from '@/components/ui/TextField';
import { enterUp } from '@/constants/motion';
import { EDGE, colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GAME_META } from '@/features/dashboard/constants';
import { PROFILE_KEY, useCatalog, useProfile } from '@/features/dashboard/hooks/useOverview';
import type { GameCatalogItem } from '@/features/shared-game/api/games.api';
import { onGameSessionRecorded } from '@/features/shared-game/events';
import { GAME_ICONS } from '@/features/shared-game/gameIcons';
import { Chips } from '@/features/shared-game/components/Chips';
import { REMINDER_HOURS, getReminderHour, setReminder } from '@/features/reminder/reminder';
import { setQuery } from '@/lib/queryCache';
import type { ApiErrorResponse } from '@/types/auth.types';
import { profileApi, type UserProfile } from '../api/profile.api';
import { buildBadges, isEarned, type Badge } from '../utils/badges';
import { GOAL_LABELS, describeTargetDate, formatMinutes } from '../utils/preferences';
import { formatNumber, getLevelProgress } from '../utils/profileProgress';

// Khớp với EXP_RULES ở backend (memory-be/src/config/progression.ts); đổi ở đó thì sửa cả ở đây
const EXP_WAYS = [
    ['Mỗi lá hoặc hình nhớ đúng', '+3'],
    ['Ván hoàn hảo', '+10'],
    ['Ván đầu tiên trong ngày', '+10'],
    ['Lập kỷ lục mới', '+20'],
] as const;

export function ProfileScreen() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safe} edges={['top']}>
                <ScrollView contentContainerStyle={styles.content}>
                    <AppText variant="title">Hồ sơ</AppText>
                    <Animated.View entering={enterUp(1)} style={styles.guest}>
                        <Sparkles color={colors.brandDeep} size={28} />
                        <AppText variant="heading">Lưu tiến độ của bạn</AppText>
                        <AppText variant="body">Đăng nhập để giữ EXP, kỷ lục, huy hiệu và chuỗi ngày trên mọi thiết bị.</AppText>
                        <Button title="Đăng nhập" onPress={() => router.push('/login')} />
                        <Button title="Tạo tài khoản" variant="secondary" onPress={() => router.push('/register')} />
                    </Animated.View>
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

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={profile.refreshing || catalog.refreshing}
                        onRefresh={() => {
                            profile.refresh();
                            catalog.refresh();
                        }}
                        tintColor={colors.brand}
                    />
                }
            >
                <BlockState request={profile.state} onRetry={reloadProfile}>
                    {(data) => {
                        const badges = games ? buildBadges(data, games) : null;
                        return (
                            <>
                                <Header profile={data} badges={badges} />
                                {badges ? (
                                    <Animated.View entering={enterUp(2)} style={{ gap: spacing.sm }}>
                                        <AppText style={styles.section}>Huy hiệu</AppText>
                                        <Badges badges={badges} />
                                    </Animated.View>
                                ) : null}
                                {games ? (
                                    <Animated.View entering={enterUp(3)} style={{ gap: spacing.sm }}>
                                        <AppText style={styles.section}>Kỷ lục từng trò</AppText>
                                        <Records games={games} />
                                    </Animated.View>
                                ) : (
                                    <BlockState request={catalog.state} onRetry={reloadCatalog}>{() => null}</BlockState>
                                )}
                                <Settings profile={data} onSaved={reloadProfile} />
                            </>
                        );
                    }}
                </BlockState>
            </ScrollView>
        </SafeAreaView>
    );
}

function Header({ profile, badges }: { profile: UserProfile; badges: Badge[] | null }) {
    const [help, setHelp] = useState(false);
    const progress = getLevelProgress(profile.level);
    const initials = profile.username.trim().split(/\s+/).slice(-2).map((word) => word.charAt(0).toUpperCase()).join('');

    return (
        <Animated.View entering={enterUp(0)} style={{ gap: spacing.md }}>
            <View style={styles.header}>
                <ProgressRing value={progress.percentage / 100} size={112} stroke={10} color={colors.sunDeep} track="#fff3cf">
                    <View style={styles.avatar}>
                        <AppText style={styles.avatarText}>{initials || 'M'}</AppText>
                    </View>
                </ProgressRing>
                <View style={styles.levelTag}>
                    <AppText style={styles.levelTagText}>Cấp {profile.level.level}</AppText>
                </View>
                <AppText variant="title" numberOfLines={1} style={{ textAlign: 'center' }}>{profile.username}</AppText>
                <AppText variant="small" style={{ textAlign: 'center' }}>
                    Còn {formatNumber(progress.remaining)} EXP lên cấp {progress.nextLevel}
                </AppText>
                <Pressable onPress={() => setHelp((open) => !open)} accessibilityRole="button" accessibilityState={{ expanded: help }} style={styles.helpToggle} hitSlop={8}>
                    <AppText style={styles.helpText}>Cách nhận EXP</AppText>
                    <ChevronDown color={colors.brand} size={16} style={{ transform: [{ rotate: help ? '180deg' : '0deg' }] }} />
                </Pressable>
                {help ? (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.help}>
                        {EXP_WAYS.map(([way, amount]) => (
                            <View key={way} style={styles.helpRow}>
                                <AppText variant="small" style={{ flex: 1, color: colors.ink }}>{way}</AppText>
                                <AppText style={styles.helpAmount}>{amount}</AppText>
                            </View>
                        ))}
                        <AppText variant="small">Ván chưa đạt vẫn nhận một nửa số EXP theo số đã nhớ đúng.</AppText>
                    </Animated.View>
                ) : null}
            </View>
            <View style={styles.pills}>
                <Pill icon={<Flame color="#e8590c" size={20} />} tint="#fff0e6" value={`${profile.streaks}`} label={`ngày · dài nhất ${profile.longestStreak}`} />
                <Pill icon={<Sparkles color={colors.sunDeep} size={20} />} tint="#fff3cf" value={formatNumber(profile.exp)} label="EXP" />
                <Pill icon={<Medal color={colors.brand} size={20} />} tint={colors.mint} value={badges ? `${badges.filter(isEarned).length}/${badges.length}` : '–'} label="huy hiệu" />
            </View>
        </Animated.View>
    );
}

function Pill({ icon, tint, value, label }: { icon: ReactNode; tint: string; value: string; label: string }) {
    return (
        <View style={[styles.pill, { backgroundColor: tint }]}>
            {icon}
            <AppText style={styles.pillValue}>{value}</AppText>
            <AppText style={styles.pillLabel} numberOfLines={2}>{label}</AppText>
        </View>
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
                        style={[styles.badge, earned && styles.badgeEarned]}
                        accessibilityLabel={`${badge.title}: ${earned ? 'đã đạt' : badge.unit(badge.current)}`}
                    >
                        <View style={[styles.badgeShape, !earned && styles.badgeLocked]}>
                            {earned ? <LiveShape art={badge.shape} motion={badge.motion} size={40} tappable /> : <badge.shape width={40} height={40} />}
                        </View>
                        <AppText style={styles.badgeTitle} numberOfLines={2}>{badge.title}</AppText>
                        <AppText style={styles.badgeProgress}>{earned ? 'Đã đạt' : badge.unit(badge.current)}</AppText>
                    </View>
                );
            })}
        </View>
    );
}

// Kỷ lục lấy từ số liệu backend giữ trọn đời (danh sách trò), không suy ra từ lịch sử gần đây
function Records({ games }: { games: GameCatalogItem[] }) {
    return (
        <View style={styles.group}>
            {games.map((game, i) => {
                const meta = GAME_META[game.gameName];
                const Icon = GAME_ICONS[game.gameName];
                const best = game.player?.bestLevel ?? null;
                return (
                    <View key={game.gameName} style={[styles.groupRow, i > 0 && styles.divider]}>
                        <View style={[styles.rowIcon, { backgroundColor: meta.color }]}>
                            <Icon color={colors.white} size={18} strokeWidth={2.4} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.rowTitle}>{meta.label}</AppText>
                            <AppText variant="small">Cấp {game.player?.unlockedLevel ?? 1}/{game.maxLevel} · {formatNumber(game.player?.played ?? 0)} ván</AppText>
                        </View>
                        <AppText style={[styles.best, !best && { color: colors.inkSoft }]}>{best ? `★ ${best}` : '–'}</AppText>
                    </View>
                );
            })}
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

// Danh sách cài đặt kiểu iOS: một thẻ, mỗi dòng một biểu tượng màu
function Settings({ profile, onSaved }: { profile: UserProfile; onSaved: () => void }) {
    const { user, updateUser, logout } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(profile.username);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { goals, dailyMinutes, targetDate, status } = profile.preferences;
    const goalLine =
        status === 'answered' && goals.length > 0
            ? [goals.map((goal) => GOAL_LABELS[goal]).join(', '), dailyMinutes ? formatMinutes(dailyMinutes) + '/ngày' : null].filter(Boolean).join(' · ')
            : 'Chưa đặt';

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
        <Animated.View entering={enterUp(4)} style={{ gap: spacing.sm }}>
            <AppText style={styles.section}>Cài đặt</AppText>
            <View style={styles.group}>
                <SettingRow icon={<Target color={colors.brand} size={18} />} tint={colors.mint} title="Mục tiêu luyện tập" value={goalLine} onPress={() => router.push('/goals')} />
                {targetDate && status === 'answered' ? (
                    <SettingRow icon={<CalendarDays color="#e8590c" size={18} />} tint="#fff0e6" title="Ngày thi" value={describeTargetDate(targetDate)} onPress={() => router.push('/goals')} divider />
                ) : null}
                <SettingRow icon={<BarChart3 color="#1c7ed6" size={18} />} tint={colors.sky} title="Tiến độ chi tiết" value="Biểu đồ, lịch và lịch sử ván chơi" onPress={() => router.navigate('/progress')} divider />
                <ReminderRow />
            </View>
            <View style={styles.group}>
                {editing ? (
                    <View style={styles.editBox}>
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
                    <SettingRow icon={<Pencil color="#d6336c" size={18} />} tint="#ffe8f0" title="Tên hiển thị" value={profile.username} onPress={() => setEditing(true)} />
                )}
                {user?.email ? <SettingRow icon={<Mail color="#0c8599" size={18} />} tint="#e3f6f8" title="Email đăng nhập" value={user.email} divider /> : null}
                <SettingRow
                    icon={<KeyRound color="#e8590c" size={18} />}
                    tint="#fff0e6"
                    title={user?.hasPassword === false ? 'Đặt mật khẩu' : 'Đổi mật khẩu'}
                    value={user?.hasPassword === false ? 'Bạn đang đăng nhập bằng Google' : undefined}
                    onPress={() => router.push('/change-password')}
                    divider
                />
            </View>
            <Pressable onPress={() => void onLogout()} disabled={loggingOut} accessibilityRole="button" style={[styles.group, styles.logout]}>
                <LogOut color={colors.danger} size={20} />
                <AppText style={styles.logoutText}>{loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}</AppText>
            </Pressable>
            <Pressable onPress={() => router.push('/delete-account')} accessibilityRole="link" hitSlop={8} style={styles.deleteLink}>
                <AppText variant="small" style={styles.deleteText}>Xoá tài khoản</AppText>
            </Pressable>
        </Animated.View>
    );
}

// Nhắc giữ chuỗi ngày: công tắc bật/tắt, bật thì chọn giờ nhắc
function ReminderRow() {
    const [hour, setHour] = useState(getReminderHour);
    const [busy, setBusy] = useState(false);

    const change = async (next: number | null) => {
        setBusy(true);
        try {
            const ok = await setReminder(next);
            setHour(ok ? next : null);
            if (!ok) Alert.alert('Chưa bật được nhắc nhở', 'Hãy cho phép Memio gửi thông báo trong Cài đặt của máy.');
        } catch {
            Alert.alert('Chưa bật được nhắc nhở', 'Vui lòng thử lại.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={styles.divider}>
            <View style={styles.groupRow}>
                <View style={[styles.rowIcon, { backgroundColor: '#fff3cf' }]}>
                    <Bell color={colors.sunDeep} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.rowTitle}>Nhắc luyện tập mỗi ngày</AppText>
                    <AppText variant="small">{hour === null ? 'Đang tắt' : `Lúc ${hour}:00 để giữ chuỗi ngày`}</AppText>
                </View>
                <Switch
                    value={hour !== null}
                    disabled={busy}
                    onValueChange={(on) => void change(on ? 19 : null)}
                    trackColor={{ true: colors.brand }}
                    accessibilityLabel="Nhắc luyện tập mỗi ngày"
                />
            </View>
            {hour !== null ? (
                <View style={styles.hours}>
                    <Chips
                        accessibilityLabel="Giờ nhắc"
                        options={REMINDER_HOURS.map((value) => ({ value, label: `${value}:00` }))}
                        value={hour}
                        onChange={(value) => void change(value)}
                    />
                </View>
            ) : null}
        </View>
    );
}

function SettingRow({ icon, tint, title, value, onPress, divider }: { icon: ReactNode; tint: string; title: string; value?: string; onPress?: () => void; divider?: boolean }) {
    const body = (
        <>
            <View style={[styles.rowIcon, { backgroundColor: tint }]}>{icon}</View>
            <View style={{ flex: 1 }}>
                <AppText style={styles.rowTitle}>{title}</AppText>
                {value ? <AppText variant="small" numberOfLines={1}>{value}</AppText> : null}
            </View>
            {onPress ? <ChevronRight color={colors.inkSoft} size={20} /> : null}
        </>
    );
    if (!onPress) return <View style={[styles.groupRow, divider && styles.divider]}>{body}</View>;
    return (
        <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.groupRow, divider && styles.divider, pressed && { backgroundColor: colors.wall }]}>
            {body}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
    guest: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius * 1.5, backgroundColor: colors.mint, borderBottomWidth: EDGE, borderBottomColor: '#a5d6b3' },
    header: { alignItems: 'center', gap: 6 },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontFamily: fonts.extrabold, fontSize: 30, color: colors.white },
    levelTag: { marginTop: -20, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.sun, borderBottomWidth: 3, borderBottomColor: colors.sunDeep },
    levelTagText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.ink },
    helpToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
    helpText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand },
    help: { alignSelf: 'stretch', gap: 6, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line },
    helpRow: { flexDirection: 'row', alignItems: 'center' },
    helpAmount: { fontFamily: fonts.extrabold, color: colors.sunDeep },
    pills: { flexDirection: 'row', gap: spacing.sm },
    pill: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, paddingHorizontal: 6, borderRadius: radius * 1.25 },
    pillValue: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
    pillLabel: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, color: colors.inkSoft, textAlign: 'center' },
    section: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.ink },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    badge: { width: '31%', flexGrow: 1, alignItems: 'center', gap: 2, padding: spacing.sm, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge },
    badgeEarned: { backgroundColor: '#fff8e1', borderColor: colors.sun, borderBottomColor: colors.sunDeep },
    badgeShape: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    badgeLocked: { opacity: 0.3 },
    badgeTitle: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: colors.ink, textAlign: 'center' },
    badgeProgress: { fontSize: 11, lineHeight: 14, color: colors.inkSoft, textAlign: 'center' },
    group: { borderRadius: radius * 1.25, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line, borderBottomWidth: EDGE, borderBottomColor: colors.edge, overflow: 'hidden' },
    groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 12, minHeight: 56 },
    divider: { borderTopWidth: 1, borderTopColor: colors.step },
    rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontFamily: fonts.bold, color: colors.ink },
    best: { fontFamily: fonts.extrabold, color: colors.sunDeep },
    editBox: { gap: spacing.sm, padding: spacing.md },
    inline: { flexDirection: 'row', gap: spacing.sm },
    logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 54 },
    logoutText: { fontFamily: fonts.extrabold, color: colors.danger },
    deleteLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center' },
    hours: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
    deleteText: { fontFamily: fonts.semibold, color: colors.inkSoft, textDecorationLine: 'underline' },
});
