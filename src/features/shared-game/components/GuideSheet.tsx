import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { formatSeconds } from '../utils/formatTime';
import { GameSheet, SheetTip } from './GameSheet';

interface GuideSheetProps {
    visible: boolean;
    onClose: () => void;
    itemUnit: string;       // "lá bài", "hình", "từ"
    recallSec: number;
    passPercent: number;
    // Ghi nhớ từ: gõ lại từng từ thay vì chọn trong bộ
    typing?: boolean;
}

// Cách chơi (bản web: GameGuideModal), viết theo thao tác chạm thay cho phím tắt
export function GuideSheet({ visible, onClose, itemUnit, recallSec, passPercent, typing = false }: GuideSheetProps) {
    const steps = [
        {
            title: 'Ghi nhớ',
            text: `Xem lần lượt từng ${itemUnit}: chạm vào ${itemUnit} hoặc nút › để xem tiếp, ‹ để quay lại. Dải nhỏ bên dưới cho bạn nhảy tới vị trí bất kỳ. Nhớ xong thì bấm "Đã nhớ xong"; hết giờ, ván tự chuyển sang phần nhớ lại.`,
        },
        typing
            ? {
                  title: 'Nhớ lại',
                  text: `Gõ lại từng ${itemUnit} vào ô theo đúng thứ tự, bấm "Tiếp" trên bàn phím để sang ô sau. Bạn có ${formatSeconds(recallSec)} cho phần này.`,
              }
            : {
                  title: 'Nhớ lại',
                  text: `Chọn ${itemUnit} trong bộ bên dưới, nó sẽ vào ô viền vàng. Muốn điền ô khác thì chạm vào ô trống đó trước; chạm vào ô đã điền để gỡ ra. Bạn có ${formatSeconds(recallSec)} cho phần này.`,
              },
        {
            title: 'Nộp bài',
            text: `Bấm "Nộp bài". Mỗi vị trí đúng được tính một điểm. Đúng từ ${passPercent}% là đạt; đạt điều kiện của cấp thì mở khoá cấp tiếp theo.`,
        },
    ];

    return (
        <GameSheet visible={visible} onClose={onClose} title="Cách chơi" subtitle={`Nhớ thứ tự các ${itemUnit}, rồi xếp lại cho đúng`}>
            {steps.map((step, i) => (
                <View key={step.title} style={styles.step}>
                    <View style={styles.no}>
                        <AppText style={styles.noText}>{i + 1}</AppText>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText style={styles.title}>{step.title}</AppText>
                        <AppText variant="body">{step.text}</AppText>
                    </View>
                </View>
            ))}
            <SheetTip>
                độ chính xác quan trọng hơn tốc độ. Thử{' '}
                <AppText
                    variant="small"
                    style={styles.link}
                    onPress={() => {
                        onClose();
                        router.push('/methods/story-linking');
                    }}
                >
                    nối các {itemUnit} thành câu chuyện
                </AppText>{' '}
                để nhớ dãy dài.
            </SheetTip>
        </GameSheet>
    );
}

const styles = StyleSheet.create({
    step: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line },
    no: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
    noText: { fontFamily: fonts.extrabold, fontSize: 14 },
    title: { fontFamily: fonts.bold, color: colors.ink },
    link: { fontFamily: fonts.bold, color: colors.brand, textDecorationLine: 'underline' },
});
