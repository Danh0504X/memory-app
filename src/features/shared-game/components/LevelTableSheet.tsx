import { Check, Lock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { GameSheet, SheetTip } from './GameSheet';

interface LevelTableSheetProps {
    visible: boolean;
    onClose: () => void;
    gameTitle: string;
    itemUnit: string;
    // Luật từ backend (GET /api/games): số lượng mỗi cấp, điểm cần đạt nếu có, cách mở cấp
    levels: { level: number; itemCount: number; requiredScore?: number }[];
    unlockedLevel: number;
    unlockOn: 'pass' | 'perfect';
}

// Bảng cấp độ (bản web: LevelTableModal / WordsLevelsModal): đánh dấu cấp đã qua, đang chơi, chưa mở
export function LevelTableSheet({ visible, onClose, gameTitle, itemUnit, levels, unlockedLevel, unlockOn }: LevelTableSheetProps) {
    const showRequired = levels.some((item) => item.requiredScore !== undefined);
    return (
        <GameSheet visible={visible} onClose={onClose} title="Bảng cấp độ" subtitle={gameTitle}>
            <AppText variant="body">
                Ai cũng bắt đầu từ cấp 1. Mỗi cấp có nhiều {itemUnit} hơn cấp trước.{' '}
                {unlockOn === 'perfect'
                    ? `Nhớ đúng tất cả ở cấp cao nhất đã mở để mở khoá cấp tiếp theo.`
                    : `Đạt điểm yêu cầu ở cấp cao nhất đã mở để mở khoá cấp tiếp theo.`}
            </AppText>
            <View style={styles.table}>
                <View style={[styles.row, styles.headRow]}>
                    <AppText variant="small" style={[styles.cell, styles.headText]}>Cấp</AppText>
                    <AppText variant="small" style={[styles.cell, styles.headText, styles.state]}>Trạng thái</AppText>
                    <AppText variant="small" style={[styles.cell, styles.headText, styles.num]}>Số {itemUnit}</AppText>
                    {showRequired ? <AppText variant="small" style={[styles.cell, styles.headText, styles.num]}>Cần đạt</AppText> : null}
                </View>
                {levels.map(({ level, itemCount, requiredScore }) => {
                    const state = level > unlockedLevel ? 'locked' : level === unlockedLevel ? 'current' : 'done';
                    return (
                        <View
                            key={level}
                            style={[styles.row, state === 'current' && styles.current, state === 'locked' && styles.locked]}
                            accessible
                            accessibilityLabel={`Cấp ${level}, ${state === 'done' ? 'đã qua' : state === 'current' ? 'đang chơi' : 'chưa mở'}, ${itemCount} ${itemUnit}${requiredScore !== undefined ? `, cần ${requiredScore} điểm` : ''}`}
                        >
                            <AppText style={[styles.cell, styles.level]}>Cấp {level}</AppText>
                            <View style={[styles.cell, styles.state, styles.stateRow]}>
                                {state === 'done' ? <Check color={colors.brand} size={16} /> : null}
                                {state === 'locked' ? <Lock color={colors.inkSoft} size={14} /> : null}
                                <AppText variant="small" style={state === 'current' ? styles.currentText : null}>
                                    {state === 'done' ? 'Đã qua' : state === 'current' ? 'Đang chơi' : 'Chưa mở'}
                                </AppText>
                            </View>
                            <AppText style={[styles.cell, styles.num]}>{itemCount}</AppText>
                            {showRequired ? <AppText style={[styles.cell, styles.num]}>{requiredScore ?? '–'}</AppText> : null}
                        </View>
                    );
                })}
            </View>
            <SheetTip>nối các {itemUnit} thành một câu chuyện ngắn theo đúng thứ tự, bạn sẽ nhớ lâu hơn.</SheetTip>
        </GameSheet>
    );
}

const styles = StyleSheet.create({
    table: { borderRadius: radius, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.white, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: spacing.sm, borderTopWidth: 1, borderColor: colors.step },
    headRow: { borderTopWidth: 0, backgroundColor: colors.wall },
    headText: { fontFamily: fonts.bold, color: colors.ink },
    current: { backgroundColor: colors.mint },
    locked: { opacity: 0.55 },
    cell: { flex: 1 },
    state: { flex: 1.4 },
    stateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    num: { flex: 0.9, textAlign: 'right' },
    level: { fontFamily: fonts.semibold },
    currentText: { fontFamily: fonts.bold, color: colors.brandDeep },
});
