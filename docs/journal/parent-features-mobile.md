# Nhật ký Parent mobile

## 2026-11-09 — Khảo sát và nền tảng API

### Mục tiêu và trạng thái
- P1 khảo sát/kế hoạch/API adapter: hoàn thành phạm vi độc lập, chưa kết nối UI.
- P2 auth/guard/recovery UI, P3 liên kết/xác minh, P4 dashboard: chưa làm; bị chặn phần UI theo lựa chọn người dùng.
- P5 lobby, P6 phòng chơi: chưa làm, phụ thuộc P2 và skill.
- P7 tích hợp: chưa làm; đã chạy kiểm tra nền tảng bên dưới.

### Công việc và quyết định
- Đọc yêu cầu đính kèm, README, CLAUDE.md, HANDOFF.md; kiểm tra ba repo, commit gần nhất và Git status.
- Xác minh web/backend: Parent một-một, đăng ký từ con, verify email, overview/report/catalog/age group, password reset riêng, room 5 trò và mọi phase, kiểm tra membership phía server, điểm 10/phiên đủ điều kiện.
- Lưu bảng đối chiếu và kế hoạch P1-P7 trước triển khai vào docs/plans/parent-features-mobile.md.
- Thêm ba API adapter dùng apiClient hiện có; kiểu CreateFamilyRoom phân biệt level/custom; result cho phép correct/usedMs null theo backend.
- Thêm 5 test hợp đồng: liên kết không tự gửi childId, lọc báo cáo/age null, mã phòng encode và giữ chuỗi số/blank, truyền lỗi, reset Parent dùng endpoint riêng/token trong body.
- Không đổi backend vì chưa xác minh thiếu sót cần thiết. Không đổi auth/route/UI hoặc luật chơi.
- Không có hai skill UI bắt buộc trong môi trường; đã hỏi và người dùng trả lời: “Dừng phần giao diện để bổ sung skill”. Không tiếp tục phần UI.

### File theo repository
Chỉ sửa/thêm trong Memio-app:
- docs/plans/parent-features-mobile.md
- docs/journal/parent-features-mobile.md
- src/features/parent/api/parent.api.ts
- src/features/parent/api/rooms.api.ts
- src/features/parent/api/passwordReset.api.ts
- test/parent-api.test.mjs
- README.md, HANDOFF.md (ghi trạng thái chưa có UI).

Thay đổi có trước: Memio-app/package-lock.json; Memio-web/src/components/layout/Header.tsx từ tác vụ navbar trước. Không chỉnh hoặc stage chúng trong phần này. Memio-be sạch lúc khảo sát. Không stage/commit/push.

### Kiểm tra
- npm run typecheck: đạt.
- npm test: 75/75 đạt (5 test mới). Cảnh báo MODULE_TYPELESS_PACKAGE_JSON có sẵn, không sửa cấu hình ngoài phạm vi.
- npx expo export --platform android --output-dir /tmp/memio-parent-android: đạt.
- npx expo export --platform ios --output-dir /tmp/memio-parent-ios: đạt.
- git diff --check: đạt trước cập nhật journal; kiểm lại khi kết thúc.
- Lint chưa chạy: eslint chưa có trong node_modules; không tự cài dependency/config.
- expo-doctor không chạy được: npx --no-install expo-doctor thoát 1 với ENOTFOUND registry.npmjs.org; tool chưa có cục bộ và môi trường không phân giải được registry. Không coi là đạt.
- Chưa thử backend/SMTP thật, thiết bị hay hai client; adapter test dùng transport mock để kiểm hợp đồng, không thay dữ liệu thật trong sản phẩm.

### Bước tiếp theo
1. Bổ sung ponytail và design-taste-frontend theo CLAUDE.md; đọc entrypoint và references/motion.md. Không tự cài skill không rõ nguồn.
2. Đọc lại plan/journal và Git hiện tại; giữ package-lock có sẵn.
3. Làm P2: định nghĩa policy Parent pending/verified, guard Stack/Tabs và deep link, sửa điều hướng login; thêm unit test policy trước khi làm P3.
4. Tiếp tục P3-P6 theo plan; chỉ báo chức năng hoạt động sau kiểm tra tích hợp thực tế.

### Lệnh Git cho phần nền tảng đã hoàn thành
Chạy từ repo Memio-app; không thêm package-lock hoặc thay đổi navbar web:

```bash
cd /Users/tt/SE/FA26/Project/Memio/Memio-app
git add docs/plans/parent-features-mobile.md docs/journal/parent-features-mobile.md src/features/parent/api/parent.api.ts src/features/parent/api/rooms.api.ts src/features/parent/api/passwordReset.api.ts test/parent-api.test.mjs README.md HANDOFF.md
git commit -m "feat(parent): add mobile API adapters and implementation plan"
```

## 2026-11-09 — Phiên tiếp tục: Parent và phòng gia đình native

### Mục tiêu, cho phép và trạng thái
- Đọc lại plan/journal, code auth/web/backend, Git status/log. Phần nền tảng trước đã được người dùng commit: `5926d58`. Chỉ `package-lock.json` có thay đổi có trước phiên này.
- Hai skill vẫn chưa có. Người dùng xác nhận: “Tiếp tục UI theo quy ước app hiện có”. Quyết định này thay điểm dừng UI của phiên trước cho tác vụ hiện tại.
- P1: đã hoàn thành phần nền tảng.
- P2–P6: đã triển khai code và qua kiểm tra tĩnh/logic; **đang làm về nghiệm thu**, chưa đạt tiêu chí thiết bị thật.
- P7: đang làm; blocked phần kiểm thử giao diện/SMTP/hai thiết bị vì môi trường chưa có công cụ dùng được. Không coi bundle hoặc service integration là bằng chứng UI đã hoạt động end-to-end.

### Đã thực hiện
1. Phân quyền: policy dùng chung theo role/emailVerified, redirect ở screenLayout để màn sai quyền không mount; cold launch/login/refresh dùng thông tin tài khoản hiện tại. Màn Parent/family có Stack riêng.
2. Liên kết: entry chỉ trong Hồ sơ member, register/status/resend, phục hồi trạng thái sau lỗi SMTP, không tự gửi childId; pending và xác minh chủ động. Có thể dán link web vào màn verify; không đổi backend/email domain.
3. Parent: overview, EXP/chuỗi ngày, progress/records/huy hiệu; báo cáo ngày/tuần và kỳ trước, gợi ý và hoạt động; nhóm tuổi; điểm và 50 phiên gần nhất; logout, password/recovery qua API Parent riêng, tái dùng schema/form có sẵn.
4. Phòng: lobby theo role, catalog/rules theo con, level/custom/time/vòng; nhập mã 8 ký tự đúng alphabet backend; create/join/ready/start/recall/submit/next/finish; cả năm trò, kết quả từng vòng/bảng điểm/hủy/hoàn thành.
5. Phục hồi: polling khi focus + foreground, dừng khi blur/unmount/background/terminal; bỏ response revision cũ, chống double action; đồng hồ theo serverNow, nháp theo account/code/round; giữ số 0 và blank, xóa draft khi kết quả/đổi vòng, không lưu đáp án gốc. Mạng lỗi giữ draft, cho đồng bộ và thử lại.
6. Tái dùng theme, Screen, Mascot/LiveShape, Button, Panel, Chips, ProgressBar, PlayingCard, PhotoTile, MemorizeStage, RecallBoard; không thêm dependency hoặc dữ liệu giả vào tính năng.

### Quyết định và giới hạn quan trọng
- Giữ liên kết một-một, không đổi sang mô hình lời mời/nhiều con.
- Không gửi recallSec ở chế độ custom khi catalog không có customTimeRange: backend từ chối trường này (ví dụ card). Không sửa luật backend để chiều payload web.
- Rời màn hình không đồng nghĩa hủy phòng; UI thông báo đồng hồ tiếp tục và cho quay lại bằng mã. Chỉ Parent kết thúc phòng; không thêm API rời phòng không tồn tại.
- Khi hết thời gian, backend tự quyết định phase/kết quả (với bài chưa nộp backend có thể chấm toàn ô trống); app không tự cộng điểm/EXP hay khẳng định nộp thành công.
- Email vẫn mở web như trước. Xác minh/reset trên web rồi quay app được hỗ trợ; deep link native có route nhưng chưa tích hợp universal link/email native tự mở.

### Kiểm tra thực hiện
- App: npm run typecheck đạt; npm test **87/87**. Thêm 5 test access và 7 test RoomSession, cộng với 5 test adapter phiên trước.
- Lint: không tự cài ESLint vào repo; dùng ESLint 8 + TypeScript parser/react-hooks có sẵn trong cache npm với config tạm `/tmp/memio-parent-eslint.cjs`; rules-of-hooks/exhaustive-deps không có lỗi hoặc cảnh báo ở file thay đổi. Đây là kiểm tra Hooks có giới hạn, không thay cho full lint Expo.
- Export Android và iOS: đạt; artifact tại `/tmp/memio-parent-final-android`, `/tmp/memio-parent-final-ios`. Lần chạy lại cuối sau thay đổi source cuối cùng: cả hai nền tảng thoát 0.
- Backend: chạy test/parentFeatures.test.ts và test/parent.integration.test.ts trên MongoDB riêng cổng 27191, database `memio_parent_mobile_test`, dbpath `/tmp/memio-parent-test-db`: **8/8 đạt**, gồm permissions, verification, shared login/refresh, report và room cả 5 trò. Không dùng database ứng dụng; đã dừng mongod sau test.
- Backend mobileClient.test.ts: **13/14 đạt**. Lỗi có sẵn ở test Google client ID: expected `Google client ID must be configured`, thực tế `Google sign in is not configured`. Backend không sửa; token body/cookie/mobile guest tests đạt. Không mở rộng sửa lỗi Google ngoài phạm vi.
- Expo Doctor từ cache: **18/20**. Hai check schema/React Native Directory không truy cập được API mạng (ENOTFOUND exp.host/fetch failed). Không khẳng định Doctor đạt đầy đủ.
- Expo web dev server chạy được tại 8093 nhưng CUA báo `The browser access host is unavailable`; không quan sát được UI. Đã dừng dev server sau thử.
- Không có simctl trong xcrun và không có adb: chưa chạy được native simulator/device. SMTP thật, hai thiết bị, bàn phím, font lớn và layout chưa nghiệm thu.
- git diff --check đạt. Chưa stage/commit/push; backend và web không sửa trong phiên.

### File thay đổi — Memio-app
- `HANDOFF.md`
- `README.md`
- `docs/journal/parent-features-mobile.md`
- `docs/plans/parent-features-mobile.md`
- `src/app/_layout.tsx`
- `src/app/family-room/[code].tsx`
- `src/app/family-room/_layout.tsx`
- `src/app/family-room/index.tsx`
- `src/app/login.tsx`
- `src/app/parent-link.tsx`
- `src/app/parent/_layout.tsx`
- `src/app/parent/child-profile.tsx`
- `src/app/parent/forgot-password.tsx`
- `src/app/parent/index.tsx`
- `src/app/parent/password.tsx`
- `src/app/parent/pending.tsx`
- `src/app/parent/profile.tsx`
- `src/app/parent/reset-password.tsx`
- `src/app/parent/verify.tsx`
- `src/features/auth/components/ForgotPasswordScreen.tsx`
- `src/features/auth/components/ResetPasswordScreen.tsx`
- `src/features/parent/api/parent.api.ts`
- `src/features/parent/api/rooms.api.ts`
- `src/features/parent/components/FamilyLobbyScreen.tsx`
- `src/features/parent/components/FamilyRoomScreen.tsx`
- `src/features/parent/components/ParentAccountScreens.tsx`
- `src/features/parent/components/ParentDashboardScreen.tsx`
- `src/features/parent/components/ParentLinkScreen.tsx`
- `src/features/parent/components/ParentParts.tsx`
- `src/features/parent/hooks/useFamilyRoom.ts`
- `src/features/parent/hooks/useParentResource.ts`
- `src/features/parent/utils/access.ts`
- `src/features/parent/utils/roomSession.ts`
- `src/features/profile/components/ChangePasswordScreen.tsx`
- `src/features/profile/components/ProfileScreen.tsx`
- `test/family-room-session.test.mjs`
- `test/parent-access.test.mjs`

### Bước tiếp theo cụ thể
1. Trên máy có Expo Go/development build, đặt EXPO_PUBLIC_API_BASE_URL theo IP LAN của backend, chạy `npm start` và mở trên hai thiết bị hoặc app + web. Không dùng localhost của điện thoại để gọi máy tính.
2. Làm checklist P7 trong plan: con đăng ký Parent, email thật, pending/verified, back/deep link, report, password/recovery, đủ 5 trò, background/mất mạng/reopen và kết quả/điểm. Xem và sửa layout thực tế trước khi đánh dấu P2–P7 hoàn thành.
3. Chạy lại Expo Doctor với mạng; ghi rõ lỗi Google mobile-client hiện có, chỉ sửa khi được mở rộng phạm vi hoặc cần thiết.
4. Đọc lại Git/diff trước khi commit. Không thêm package-lock.json của người dùng.

### Gợi ý Git — phần triển khai Parent/phòng gia đình sau commit nền tảng
Không tự chạy lệnh stage/commit. Danh sách dưới chỉ gồm file thuộc phần việc, không có package-lock hoặc repo web/backend:

```bash
cd /Users/tt/SE/FA26/Project/Memio/Memio-app
git add "HANDOFF.md"
git add "README.md"
git add "docs/journal/parent-features-mobile.md"
git add "docs/plans/parent-features-mobile.md"
git add "src/app/_layout.tsx"
git add "src/app/family-room/[code].tsx"
git add "src/app/family-room/_layout.tsx"
git add "src/app/family-room/index.tsx"
git add "src/app/login.tsx"
git add "src/app/parent-link.tsx"
git add "src/app/parent/_layout.tsx"
git add "src/app/parent/child-profile.tsx"
git add "src/app/parent/forgot-password.tsx"
git add "src/app/parent/index.tsx"
git add "src/app/parent/password.tsx"
git add "src/app/parent/pending.tsx"
git add "src/app/parent/profile.tsx"
git add "src/app/parent/reset-password.tsx"
git add "src/app/parent/verify.tsx"
git add "src/features/auth/components/ForgotPasswordScreen.tsx"
git add "src/features/auth/components/ResetPasswordScreen.tsx"
git add "src/features/parent/api/parent.api.ts"
git add "src/features/parent/api/rooms.api.ts"
git add "src/features/parent/components/FamilyLobbyScreen.tsx"
git add "src/features/parent/components/FamilyRoomScreen.tsx"
git add "src/features/parent/components/ParentAccountScreens.tsx"
git add "src/features/parent/components/ParentDashboardScreen.tsx"
git add "src/features/parent/components/ParentLinkScreen.tsx"
git add "src/features/parent/components/ParentParts.tsx"
git add "src/features/parent/hooks/useFamilyRoom.ts"
git add "src/features/parent/hooks/useParentResource.ts"
git add "src/features/parent/utils/access.ts"
git add "src/features/parent/utils/roomSession.ts"
git add "src/features/profile/components/ChangePasswordScreen.tsx"
git add "src/features/profile/components/ProfileScreen.tsx"
git add "test/family-room-session.test.mjs"
git add "test/parent-access.test.mjs"
git commit -m "feat(parent): port parent features and family rooms to mobile"
```

## 2026-11-09 — Tạo commit theo yêu cầu người dùng

- Người dùng yêu cầu “giúp tôi tạo các commit phù hợp”, cho phép stage/commit trong phiên này, thay cho hướng dẫn chỉ gợi ý lệnh trước đó.
- Đã kiểm tra Git/diff; typecheck đạt, 87/87 tests app đạt, diff --check đạt.
- Commit code và test: `f2285ed` — `feat(parent): add parent screens and family rooms to mobile` (33 file). Giữ code chung Parent/phòng gia đình trong cùng commit vì chia nhỏ sẽ làm thiếu route/component phụ thuộc.
- Commit tài liệu riêng: `docs(parent): update mobile implementation and handoff status`, gồm README.md, HANDOFF.md, kế hoạch và nhật ký này.
- Giữ nguyên package-lock.json chưa commit; không thay đổi repository web/backend và không push.
- Nghiệm thu thiết bị, SMTP và hai client vẫn chưa hoàn tất; xem checklist P7. Commit không có nghĩa các kiểm tra còn lại đã đạt.
