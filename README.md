# Memio App

Ứng dụng di động (React Native + Expo SDK 58) luyện trí nhớ qua trò chơi. Repo này tách từ
[memory-web](https://github.com/tua9/memory-web) và giữ nguyên lịch sử commit của bản web.
App dùng chung backend [memory-be](https://github.com/tua9/memory-be) với web.

## Chạy app

```bash
npm install
cp .env.example .env      # sửa EXPO_PUBLIC_API_BASE_URL theo máy của bạn
npm start                 # rồi bấm a (Android) / i (iOS), hoặc quét QR bằng Expo Go
```

Backend phải đang chạy (`npm run dev` trong memory-be).

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm start` | Chạy Metro dev server |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm test` | Test logic (store, API adapter, utils) bằng `node --test` |
| `npx expo-doctor` | Kiểm tra cấu hình và phiên bản thư viện |
| `npx expo install <gói>` | Thêm thư viện đúng phiên bản SDK (đừng dùng `npm install` cho gói native) |

## Cấu trúc

```
src/
  app/            Route (expo-router): (tabs)/ Hôm nay · Luyện tập · Thử thách · Phương pháp · Hồ sơ; games/, methods/, practice/, login, register…
  components/ui/  Thành phần giao diện dùng chung (AppText, Button, Panel, NavRow, ProgressRing, TextField, Screen)
  constants/      Màu, font, khoảng cách, gờ nút (theme.ts) và chuyển động (motion.ts)
  features/       Logic theo tính năng, mang từ bản web: api, store (zustand), utils, types
  lib/            api-client (axios), session (token trong SecureStore), storage (expo-sqlite kv-store)
  assets/memio/   Ảnh SVG/JPG của Memio (import SVG thành component qua metro.config.js)
test/             Test logic, chạy bằng Node (thay module native bằng bản giả qua registerHooks)
```

## Khác bản web ở đâu

- **Đăng nhập:** app gửi header `X-Client: mobile`. Backend trả token trong body, không set cookie.
  App lưu token vào SecureStore và gửi lại bằng `Authorization: Bearer`. Khách nhận `guestId` và gửi lại qua `X-Guest-Id`.
  Chi tiết: `memory-be/docs/mobile-client.md`.
- **Lưu trữ:** `localStorage`/`sessionStorage` → `appStorage` (`src/lib/storage.ts`, đọc/ghi đồng bộ).
- **Điều hướng:** react-router → expo-router (route nằm trong `src/app`).
- **Sự kiện "đã xong một ván":** `window.dispatchEvent` → `onGameSessionRecorded` (`features/shared-game/events.ts`).
- **Đồng hồ ván chơi:** `visibilitychange` → `AppState` (tính lại theo deadline khi app trở lại).
- **Tải trước ảnh:** `new Image()` → `Image.prefetch` của expo-image.

## Giao diện

App không chép giao diện web mà theo phong cách riêng cho điện thoại, **"vui, nhiều màu"**:
mỗi trò một màu (`GAME_META` trong `features/shared-game/registry.ts`: `color`, `edge`, `tint`),
thẻ và nút "dày" có gờ dưới đậm hơn (`EDGE` trong `theme.ts`), ô trò chơi màu (`GameTile`),
vòng tiến độ (`ProgressRing`), hàng dẫn (`NavRow`), ít chữ. Không dùng màu tím.
Màn cài đặt ván dùng chung `SetupParts` (dải màu của trò, dải cấp cuộn ngang, nút Bắt đầu dính đáy qua `Screen footer`);
màn tài khoản dùng `AuthParts`. Chạm nút có rung nhẹ (`expo-haptics` trong `PressableScale`), màn kết quả rung báo đạt/chưa đạt.

## Đã có

- 5 trò chơi: Thẻ bài, Hình ảnh, Gương mặt & Tên, Ghi nhớ từ, Ghi nhớ số (`src/app/games/`).
- Hôm nay, Thử thách ngày (`/daily`), Hồ sơ, Mục tiêu luyện tập (`/goals`), Đổi mật khẩu, Tiến độ (`/progress`, có toàn bộ lịch sử ván lọc theo trò, tải thêm từng trang).
- Phương pháp (`/methods`) và ba trang hướng dẫn có trò chơi thử (`/methods/story-linking`, `/methods/number-shape`, `/methods/memory-palace`).
- Quên mật khẩu (`/forgot-password`) và Đặt mật khẩu mới (`/reset-password?token=...`, mở bằng deep link `memio://`).
- Trang chủ cho khách (tab Hôm nay khi chưa đăng nhập) và ba bài thực hành (`/practice/story`, `/practice/numbers`, `/practice/loci`).

## Việc còn lại

- Email đặt lại mật khẩu hiện chỉ có link web: thêm link `memio://reset-password?token=...` ở backend, hoặc universal link / app link (cần xác minh tên miền), để mở thẳng trong app.
- Đăng nhập Google (`@react-native-google-signin/google-signin`, cần development build), Sign in with Apple, xoá tài khoản.
- Thông báo nhắc giữ chuỗi ngày (push notification).
- Lỗi lint có từ trước (chạy `npx expo lint`, cần cài eslint): đọc ref lúc render trong `useFocusChain` (Gương mặt & Tên, Ghi nhớ từ) và dấu `"` chưa thoát trong chữ hướng dẫn.
