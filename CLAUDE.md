# Memio App (React Native + Expo SDK 58)

## Khi làm giao diện

- Luôn nạp cả hai skill trước khi viết code giao diện: `ponytail` (thay đổi nhỏ nhất, không thừa) và `design-taste-frontend` (gu thiết kế; đọc `references/motion.md`).
- Taste skill viết cho website: chỉ lấy nguyên tắc (đường cong, thời lượng, stagger, màn vào, reduced motion), hiện thực bằng `react-native-reanimated`. Không chạy các script trình duyệt của skill.
- Mọi màn phải có chuyển động mượt và hình minh hoạ động; tôn trọng "Giảm chuyển động" của hệ điều hành (`useReducedMotion`).
- Token chuyển động dùng chung ở `src/constants/motion.ts`.

## Quy trình mỗi lần làm

- Trước: `git status` / `git log` để biết đã commit tới đâu; đọc README.md (mục "Đã có", "Việc còn lại"); đọc code web gốc của phần sắp làm (repo memory-web) để giữ đúng nội dung và luật.
- Sau: `npm run typecheck`, `npm test`, `npx expo export --platform android` và `--platform ios`, `npx expo-doctor`; cập nhật README.md (và file này nếu đổi quy ước).
- Commit: không tự commit. Đưa lệnh **bash** (người dùng chạy trong Git Bash), **mỗi tính năng một commit**, `git add` đúng file của tính năng đó.

## Lệnh

- `npm run typecheck`, `npm test`, `npx expo-doctor`; thêm gói native bằng `npx expo install`.
