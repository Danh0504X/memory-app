# Giao ca: Memio App (cập nhật 09/11/2026)

Tài liệu cho người làm tiếp app React Native `memory-app`. Đọc cùng `README.md` (cách chạy, cấu trúc) và
`CLAUDE.md` (quy ước khi code).

## 1. Bối cảnh

- `memory-app` là bản chuyển từ web `memory-web` (React + Vite) sang **Expo SDK 58 / React Native 0.88 / expo-router**.
  Repo clone từ web nên giữ lịch sử commit của web (remote `web` = tua9/memory-web, `origin` = Danh0504X/memory-app).
- App **dùng chung backend** `memory-be` với web. App gửi header `X-Client: mobile` → backend trả token trong body
  (không dùng cookie); khách gửi `X-Guest-Id`. Chi tiết: `memory-be/docs/mobile-client.md`.
- Giao diện **không chép web**: phong cách riêng "vui, nhiều màu" (mỗi trò một màu, thẻ/nút dày có gờ dưới,
  vòng tiến độ, ít chữ). Không dùng màu tím.

## 2. Trạng thái Git (kiểm tra trước khi làm)

| Repo | Nhánh | Trạng thái |
|---|---|---|
| memory-app | `NewMobileApp` | Mọi thay đổi đã commit. **Nhánh chưa có upstream: có thể chưa được push lên origin.** |
| memory-be | `feat/training-preferences` | Sạch, nhưng **đi trước origin 2 commit chưa push**: `0473187` (hỗ trợ client mobile) và `4f7bf7b` (không gửi đáp án từ trong recall options). App **không chạy được với backend thiếu 2 commit này**. |

**Việc đầu tiên:** hỏi chủ dự án xem đã push 2 nhánh trên chưa. Người dùng tự commit/push; quy ước ở mục 6.

## 3. Đã xong

**Chức năng:** đủ mọi trang của web:

- **5 trò:** Thẻ bài, Hình ảnh, Gương mặt & Tên, Ghi nhớ từ, Ghi nhớ số.
- **Hôm nay:** khi chưa đăng nhập, tab này là trang chủ cho khách.
- **Thử thách ngày, Phương pháp:** ba trang hướng dẫn có trò thử, cùng ba bài thực hành.
- **Hồ sơ, Mục tiêu, Tiến độ:** Tiến độ có toàn bộ lịch sử ván, lọc theo trò và tải thêm từng trang.
- **Tài khoản:** đăng nhập, đăng ký, quên/đặt/đổi mật khẩu.
- **Tab bar:** 5 mục.

**Thiết kế lại:** cả 4 đợt đều xong:

1. **Nền tảng:**
   - `theme.ts` (token màu, `EDGE`), `GAME_META` (`color` / `edge` / `tint` cho từng trò), `gameIcons.ts`.
   - `Button` và `Panel` dày; thêm `ProgressRing`, `GameTile`, `NavRow`.
2. **Các tab:** Hôm nay, Luyện tập, Thử thách, Phương pháp, Hồ sơ, Tiến độ.
3. **Màn chơi:**
   - `SetupParts`, dùng chung cho 3 màn cài đặt ván.
   - `LevelGrid` đổi thành dải cuộn ngang.
   - `Screen` có prop `footer` để nút "Bắt đầu" dính đáy.
   - `PlayLayout` có thanh trên màu của trò.
   - `RoundResult` có dải chúc mừng và vòng % chính xác.
   - Rung phản hồi (`expo-haptics`): khi bấm (`PressableScale`) và khi có kết quả.
4. **Màn còn lại:**
   - Trang chủ khách bản rút gọn.
   - `AuthParts` dùng chung cho các màn tài khoản; Mục tiêu.
   - Hướng dẫn phương pháp: đã bỏ phần tranh khắc gỗ và xoá luôn ảnh.
   - Bài thực hành.

**Kiểm tra lần cuối (09/11/2026):** đều đạt.

- `npx tsc --noEmit`: đạt.
- `node --test test/*.test.mjs`: 64/64.
- `npx expo export --platform android` và `--platform ios`: có bundle.
- `npx expo-doctor`: 20/20.

## 4. Chưa xong, cần làm tiếp (theo thứ tự ưu tiên)

### 4.1 Chạy thử trên máy thật / máy ảo: chưa làm, ưu tiên cao nhất
Toàn bộ thiết kế lại **mới qua typecheck và build, chưa ai nhìn thấy trên màn hình**. Những chỗ dễ lỗi:
- **`LevelGrid`:**
  - Dùng `marginHorizontal: -spacing.lg` để tràn ra mép màn, nên giả định màn cha có lề `spacing.lg`. Đúng với `Screen`, sai nếu đặt chỗ khác.
  - Dải tự cuộn tới cấp đang chọn khi mở màn; cần xem có bị giật không.
- **Thanh trạng thái:** `PlayLayout` đặt `<StatusBar style="light" />`. Cần kiểm tra khi thoát ván, thanh trạng thái có trở lại chữ tối không.
- **Bàn phím trên Android (edge-to-edge của SDK 58):** `Screen` và `PlayLayout` dùng `KeyboardAvoidingView` với `behavior` undefined trên Android. Cần xem bàn phím có che ô nhập tên/từ khi chơi Gương mặt & Tên, Ghi nhớ từ, nút "Nộp bài", nút ở màn Mục tiêu không. Nếu che: thử `behavior="padding"` cho cả Android, nhưng kiểm tra kỹ vì có thể bị đẩy hai lần (khoảng trống thừa).
- **Rung:** `PressableScale` rung **mỗi lần bấm**, kể cả khi chọn bài ở bàn nhớ lại. Nếu thấy quá nhiều, tắt rung cho khay bài trong `RecallBoard`.
- **Chữ to (Accessibility):** chữ có thể tràn ở `GameTile`, ô số liệu Hồ sơ/Tiến độ, dải 14 ngày (màn Hôm nay) và viên phần thưởng.
- **Pháo giấy:** `Confetti` nằm trong dải kết quả có `overflow: 'hidden'`; cần xem pháo giấy có bị cắt xấu không.
- **Dải chip cuộn ngang:** lọc lịch sử Tiến độ dùng `Chips` (có `flexWrap`) đặt trong `ScrollView` ngang; cần xem có xuống dòng không.

### 4.2 Lint: đã sửa (ESLint vẫn chưa cài)
- Repo có script `npm run lint` (`expo lint`) nhưng **chưa cài eslint**. Chạy `npx expo lint` sẽ tự cài `eslint` và `eslint-config-expo`, đồng thời tạo `eslint.config.js`. Lần trước đã gỡ lại vì chưa có ai quyết định dùng.
- 14 lỗi cũ đã sửa (11/2026): `useFocusChain` trả hàm xử lý sự kiện thay vì đọc ref lúc render; dấu `"` đổi thành “ ”.
  Chạy thử với eslint cài tạm: 0 lỗi, còn 4 cảnh báo cũ (import/first, array-type, axios.create).

### 4.3 Việc nhỏ đã nêu nhưng chưa làm
- Đã xong (11/2026): kéo để làm mới có vòng quay (`useRequest().refresh`), khung chờ `Skeleton` trong `BlockState`, ngày thi trong Hồ sơ.
- **Âm thanh** đúng/sai/hoàn hảo (tuỳ chọn, chưa quyết định).
- **Test giao diện:** chưa có. Logic mới chưa có test: dải 14 ngày nằm trong `TodayScreen.tsx`, chưa tách thành hàm.

### 4.4 Cần sửa backend (memory-be)
- **Xoá tài khoản:** đã xong (`DELETE /api/profile`, màn `/delete-account`).
- **Email đặt lại mật khẩu:** hiện chỉ có link web. Thêm `memio://reset-password?token=...`, hoặc universal link/app link. App đã có màn `/reset-password` nhận deep link `memio://`.
- **Nhắc giữ chuỗi ngày:** đã có bản cục bộ (`features/reminder/reminder.ts`, hẹn giờ hằng ngày). Muốn chỉ nhắc khi hôm nay chưa chơi thì cần push từ backend (lưu push token, lịch gửi).

### 4.5 Trước khi lên store
- **Đăng nhập Google native:** `@react-native-google-signin/google-signin`, cần development build. Backend đã nhận `idToken` và kiểm tra `aud`.
- **Sign in with Apple:** bắt buộc nếu có đăng nhập Google trên iOS.
- **Cấu hình phát hành:** biểu tượng app, màn khởi động, cấu hình EAS Build, trang chính sách quyền riêng tư.
  `app.json` hiện có `scheme: memio` và bundle/package là `com.memio.app`.

## 5. Bẫy đã gặp (đừng lặp lại)
- **`<Link asChild>` với style dạng mảng:** Slot của expo-router ném lỗi và làm crash tab Luyện tập. Điều hướng bằng `onPress` + `router.push` / `router.navigate`.
- **Typed routes:**
  - Route động cần `as Href`.
  - `methods/index.tsx` sinh kiểu `/methods/index`, nên phải dùng `(tabs)/methods.tsx`.
- **RN 0.88 bỏ `StyleSheet.absoluteFillObject`:** viết thẳng `top/right/bottom/left: 0`.
- **Ref:** `ScrollView` dùng kiểu `ScrollViewInstance`, `TextInput` dùng `TextInputInstance`.
- **Gói native:** cài bằng `npx expo install <gói>`, không dùng `npm install`.
- **SVG có thẻ `<ns0:path>`** (file do công cụ Python sinh): trình duyệt vẽ được nhưng `react-native-svg-transformer` bỏ qua, hình trống. Đã chuẩn hoá 24 file (11/2026); `test/svg-assets.test.mjs` chặn lỗi quay lại khi chép ảnh từ web.
- **Máy chủ Expo cũ chạy ngầm:** phục vụ bundle cũ và chặn máy chủ mới; tắt tiến trình node cũ trước khi dò lỗi.

## 6. Quy ước làm việc với chủ dự án
- **Không tự commit hay push.** Chỉ đưa lệnh để chủ dự án tự chạy, **mỗi tính năng một commit**. Lệnh phải chạy được ở mọi terminal:
  - Bắt đầu bằng `cd F:/project/memory-app`.
  - Mỗi lệnh một dòng, không dùng `\`, `&&`, `printf` hay heredoc.
  - Đường dẫn có ngoặc phải đặt trong ngoặc kép, ví dụ `"src/app/(tabs)/games.tsx"`.
- **Trước khi làm:** chạy `git status` / `git log`, đọc README và code web gốc của phần sắp làm.
- **Sau khi làm:** chạy typecheck, test, export android/ios, expo-doctor; cập nhật README (mục "Đã có", "Việc còn lại") và file này.
- **Làm giao diện:** dùng token trong `src/constants/theme.ts` và `motion.ts`, chuyển động bằng Reanimated, tôn trọng reduced motion. Không dùng màu tím.

## 7. Bản đồ file nhanh
| Cần sửa | File |
|---|---|
| Màu, font, gờ dày | `src/constants/theme.ts` |
| Màu/biểu tượng từng trò | `src/features/shared-game/registry.ts`, `gameIcons.ts` |
| Màn cài đặt ván | `shared-game/components/RoundSetup.tsx`, `SetupParts.tsx`; Ghi nhớ số: `numbers-game/components/NumbersSettings.tsx`; Gương mặt & Tên: `SettingsPhase` trong `FaceNameGame.tsx` |
| Khung khi chơi / kết quả | `shared-game/components/PlayLayout.tsx`, `RoundResult.tsx` |
| Màn tài khoản | `src/app/login.tsx`, `register.tsx`, `features/auth/components/*` (`AuthParts.tsx`) |
| Tabs | `src/app/(tabs)/_layout.tsx`; Hôm nay: `features/today/components/TodayScreen.tsx` |
