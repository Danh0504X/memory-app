import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface GameSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
}

// Bảng trượt lên (bản web: GameDialog). iOS hiện dạng pageSheet vuốt xuống để đóng; Android toàn màn hình, nút Back đóng.
export function GameSheet({ visible, onClose, title, subtitle, children }: GameSheetProps) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
                <View style={styles.head}>
                    {subtitle ? <AppText variant="small" style={styles.subtitle}>{subtitle}</AppText> : null}
                    <AppText variant="title" accessibilityRole="header">{title}</AppText>
                </View>
                <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
                <View style={styles.footer}>
                    <Button title="Đã hiểu" onPress={onClose} />
                </View>
            </SafeAreaView>
        </Modal>
    );
}

// Một dòng mẹo ở cuối bảng, in đậm chữ "Mẹo"
export function SheetTip({ children }: { children: ReactNode }) {
    return (
        <View style={styles.tip}>
            <AppText variant="small">
                <AppText variant="small" style={styles.tipLabel}>Mẹo: </AppText>
                {children}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    head: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: 2 },
    subtitle: { fontFamily: fonts.bold, color: colors.brandDeep },
    body: { padding: spacing.lg, gap: spacing.md },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    tip: { padding: spacing.md, borderRadius: radius, backgroundColor: '#fff8e1' },
    tipLabel: { fontFamily: fonts.bold, color: colors.ink },
});
