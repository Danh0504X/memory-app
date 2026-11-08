# Memio App (React Native + Expo SDK 58)

## Khi làm giao diện

- Luôn nạp cả hai skill trước khi viết code giao diện: `ponytail` (thay đổi nhỏ nhất, không thừa) và `design-taste-frontend` (gu thiết kế; đọc `references/motion.md`).
- Taste skill viết cho website: chỉ lấy nguyên tắc (đường cong, thời lượng, stagger, màn vào, reduced motion), hiện thực bằng `react-native-reanimated`. Không chạy các script trình duyệt của skill.
- Mọi màn phải có chuyển động mượt và hình minh hoạ động; tôn trọng "Giảm chuyển động" của hệ điều hành (`useReducedMotion`).
- Token chuyển động dùng chung ở `src/constants/motion.ts`.

## Lệnh

- `npm run typecheck`, `npm test`, `npx expo-doctor`; thêm gói native bằng `npx expo install`.
- Không tự commit: chỉ đưa lệnh git để người dùng tự chạy.
