import { ShieldCheck } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { AuthHeader } from '@/features/auth/components/AuthParts';

// Chính sách quyền riêng tư (App Store/Google Play yêu cầu, nhất là app có trẻ em dùng).
// Nội dung viết theo đúng những gì code đang lưu (memory-be/src/models, services); đổi cách lưu dữ liệu thì sửa cả ở đây.
const SECTIONS: { title: string; items: string[] }[] = [
    {
        title: 'Memio lưu những gì',
        items: [
            'Tài khoản: tên hiển thị, email và mật khẩu. Mật khẩu được mã hoá một chiều, không ai đọc được, kể cả Memio.',
            'Đăng nhập bằng Google: email, tên và ảnh đại diện do Google cung cấp.',
            'Kết quả luyện tập: các ván đã chơi (số đúng, thời gian, cấp độ), EXP, chuỗi ngày, kỷ lục và huy hiệu.',
            'Mục tiêu luyện tập nếu bạn chọn: lý do luyện tập, số phút mỗi ngày, ngày thi.',
            'Email phụ huynh nếu tài khoản được liên kết với phụ huynh.',
        ],
    },
    {
        title: 'Memio không làm',
        items: [
            'Không hỏi họ tên thật, ngày sinh, trường học hay địa chỉ.',
            'Không có quảng cáo, không dùng công cụ theo dõi hay phân tích của bên thứ ba.',
            'Không bán hay chia sẻ dữ liệu cho bên khác.',
        ],
    },
    {
        title: 'Ai nhìn thấy gì',
        items: [
            'Bảng xếp hạng thử thách ngày hiện tên hiển thị và kết quả của bạn cho người chơi khác. Hãy đặt tên hiển thị không phải tên thật nếu muốn.',
            'Phụ huynh đã liên kết xem được tiến độ luyện tập của con.',
        ],
    },
    {
        title: 'Trên máy của bạn',
        items: [
            'Phiên đăng nhập được giữ trong kho bảo mật của máy (Keychain trên iOS, Keystore trên Android).',
            'Nhắc giữ chuỗi ngày là thông báo hẹn giờ ngay trên máy, không gửi qua máy chủ. Tắt được trong Hồ sơ.',
            'Chơi không đăng nhập: tiến độ khách chỉ giữ tạm 24 giờ kể từ ván gần nhất rồi tự xoá.',
        ],
    },
    {
        title: 'Quyền của bạn',
        items: [
            'Sửa tên hiển thị, mục tiêu và mật khẩu trong Hồ sơ.',
            'Xoá tài khoản trong Hồ sơ: tài khoản cùng mọi kết quả luyện tập bị xoá vĩnh viễn khỏi máy chủ.',
        ],
    },
];

export function PrivacyScreen() {
    return (
        <Screen edges={['bottom']}>
            <AuthHeader
                title="Quyền riêng tư"
                line="Memio chỉ lưu những gì cần để bạn luyện tập và giữ tiến độ."
                icon={<ShieldCheck color={colors.brand} size={48} />}
            />
            {SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                    <AppText style={styles.title} accessibilityRole="header">{section.title}</AppText>
                    {section.items.map((item) => (
                        <View key={item} style={styles.item}>
                            <View style={styles.bullet} />
                            <AppText variant="body" style={{ flex: 1 }}>{item}</AppText>
                        </View>
                    ))}
                </View>
            ))}
        </Screen>
    );
}

const styles = StyleSheet.create({
    section: { gap: spacing.sm, padding: spacing.md, borderRadius: radius * 1.25, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.line },
    title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink },
    item: { flexDirection: 'row', gap: spacing.sm },
    bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: colors.brand },
});
