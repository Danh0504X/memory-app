import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { enterUp } from '@/constants/motion';
import { colors, spacing } from '@/constants/theme';

interface ScreenProps {
    children: ReactNode;
    // Màn có header của Stack thì header đã lo phần tai thỏ phía trên
    edges?: Edge[];
}

// Khung chung của mọi màn: nền Memio, tránh tai thỏ, cuộn được và đẩy nội dung lên khi bàn phím mở.
// Nội dung vào màn một lần khi mở (taste skill: mỗi màn có một lần "vào màn"), không chạy lại khi cuộn.
export function Screen({ children, edges = ['top'] }: ScreenProps) {
    return (
        <SafeAreaView style={styles.safe} edges={edges}>
            <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Animated.View entering={enterUp(0)} style={styles.inner}>
                        {children}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.wall },
    content: { padding: spacing.lg, flexGrow: 1 },
    inner: { gap: spacing.md, flexGrow: 1 },
});
