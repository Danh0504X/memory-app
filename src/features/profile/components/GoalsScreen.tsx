import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { BlockState } from '@/components/ui/Panel';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { PROFILE_KEY, useProfile } from '@/features/dashboard/hooks/useOverview';
import { setQuery } from '@/lib/queryCache';
import type { ApiErrorResponse } from '@/types/auth.types';
import { DAILY_MINUTES_OPTIONS, TRAINING_GOALS, profileApi, type UserProfile } from '../api/profile.api';
import {
    GOAL_HINTS,
    GOAL_LABELS,
    MINUTES_HINTS,
    describeTargetDate,
    formatMinutes,
    targetDateRange,
    toDraft,
    toInput,
    type PreferencesDraft,
} from '../utils/preferences';

// "YYYY-MM-DD" ↔ Date theo giờ máy: người dùng chọn một ngày trên lịch, không phải một thời điểm
const keyToDate = (key: string) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
const dateToKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function GoalsScreen() {
    const profile = useProfile();
    return (
        <Screen edges={['bottom']}>
            <BlockState request={profile.state} onRetry={profile.reload}>
                {(data) => <GoalsForm profile={data} />}
            </BlockState>
        </Screen>
    );
}

function GoalsForm({ profile }: { profile: UserProfile }) {
    const [draft, setDraft] = useState<PreferencesDraft>(() => toDraft(profile.preferences));
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const range = targetDateRange();
    const hasExam = draft.goals.includes('exam');

    const toggleGoal = (goal: PreferencesDraft['goals'][number]) => {
        setError(null);
        setDraft((current) => ({
            ...current,
            goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal],
        }));
    };

    const pickDate = (date: Date | undefined) => {
        if (date) setDraft((current) => ({ ...current, targetDate: dateToKey(date) }));
    };
    const openAndroidPicker = () =>
        DateTimePickerAndroid.open({
            value: draft.targetDate ? keyToDate(draft.targetDate) : keyToDate(range.min),
            mode: 'date',
            minimumDate: keyToDate(range.min),
            maximumDate: keyToDate(range.max),
            onChange: (event, date) => {
                if (event.type === 'set') pickDate(date);
            },
        });

    const save = async () => {
        if (draft.goals.length === 0) {
            setError('Chọn ít nhất một mục tiêu.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const { data } = await profileApi.savePreferences(toInput(draft));
            setQuery(PROFILE_KEY, data.profile);
            router.back();
        } catch (saveError) {
            setError((saveError as ApiErrorResponse).message || 'Không lưu được mục tiêu. Vui lòng thử lại.');
            setSaving(false);
        }
    };

    return (
        <>
            <AppText variant="lead">Memio dùng mục tiêu để gợi ý trò nên chơi và số ván mỗi ngày.</AppText>

            <AppText variant="heading">Bạn luyện trí nhớ để làm gì?</AppText>
            <AppText variant="small">Chọn một hoặc nhiều.</AppText>
            <View style={{ gap: spacing.sm }}>
                {TRAINING_GOALS.map((goal) => {
                    const selected = draft.goals.includes(goal);
                    return (
                        <Pressable
                            key={goal}
                            onPress={() => toggleGoal(goal)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            style={[styles.option, selected && styles.optionSelected]}
                        >
                            <View style={[styles.box, selected && styles.boxSelected]}>{selected ? <Check color={colors.white} size={14} /> : null}</View>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.optionTitle}>{GOAL_LABELS[goal]}</AppText>
                                <AppText variant="small">{GOAL_HINTS[goal]}</AppText>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <AppText variant="heading">Mỗi ngày bạn dành bao lâu?</AppText>
            <View style={styles.minutes}>
                {DAILY_MINUTES_OPTIONS.map((minutes) => {
                    const selected = draft.dailyMinutes === minutes;
                    return (
                        <Pressable
                            key={minutes}
                            onPress={() => setDraft((current) => ({ ...current, dailyMinutes: minutes }))}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            style={[styles.minute, selected && styles.optionSelected]}
                        >
                            <AppText style={styles.optionTitle}>{formatMinutes(minutes)}</AppText>
                            <AppText variant="small">{MINUTES_HINTS[minutes]}</AppText>
                        </Pressable>
                    );
                })}
            </View>

            {hasExam ? (
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="heading">Ngày thi (không bắt buộc)</AppText>
                    <AppText variant="small">{draft.targetDate ? describeTargetDate(draft.targetDate) : 'Chưa chọn ngày thi.'}</AppText>
                    {Platform.OS === 'ios' ? (
                        <DateTimePicker
                            value={draft.targetDate ? keyToDate(draft.targetDate) : keyToDate(range.min)}
                            mode="date"
                            display="compact"
                            minimumDate={keyToDate(range.min)}
                            maximumDate={keyToDate(range.max)}
                            onChange={(_event, date) => pickDate(date)}
                            locale="vi-VN"
                            style={{ alignSelf: 'flex-start' }}
                        />
                    ) : (
                        <Button title={draft.targetDate ? 'Đổi ngày thi' : 'Chọn ngày thi'} variant="secondary" onPress={openAndroidPicker} />
                    )}
                    {draft.targetDate ? (
                        <Button title="Bỏ ngày thi" variant="secondary" onPress={() => setDraft((current) => ({ ...current, targetDate: '' }))} />
                    ) : null}
                </View>
            ) : null}

            {error ? <AppText variant="small" style={{ color: colors.danger }} accessibilityRole="alert">{error}</AppText> : null}
            <Button title="Lưu mục tiêu" loading={saving} onPress={() => void save()} />
        </>
    );
}

const styles = StyleSheet.create({
    option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white },
    optionSelected: { borderColor: colors.brand, backgroundColor: colors.mint },
    box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.mint, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
    boxSelected: { backgroundColor: colors.brand, borderColor: colors.brand },
    optionTitle: { fontFamily: fonts.semibold, color: colors.ink },
    minutes: { flexDirection: 'row', gap: spacing.sm },
    minute: { flex: 1, alignItems: 'center', gap: 2, padding: spacing.md, borderRadius: radius, borderWidth: 1.5, borderColor: colors.step, backgroundColor: colors.white },
});
