# Parent và phòng gia đình trên mobile

## Cập nhật phiên tiếp tục 2026-11-09

Người dùng đã cho phép tiếp tục UI theo component/theme/motion hiện có, thay cho việc chờ hai skill. P2–P6 đã có code và kiểm thử logic tương ứng; trạng thái nghiệm thu vẫn **đang làm** vì P7 chưa thử được trên thiết bị/SMTP thật. Không thay đổi backend hoặc web.

- App routes: `/parent`, `/parent/pending`, `/parent/verify`, `/parent/profile`, `/parent/child-profile`, `/parent/password`, `/parent/forgot-password`, `/parent/reset-password`, `/parent-link`, `/family-room`, `/family-room/[code]`.
- Entry của con nằm trong Hồ sơ sau đăng nhập; Parent có điều hướng riêng, không truy cập game solo/profile user.
- Cấu hình phòng không gửi `recallSec` khi catalog không có customTimeRange, vì backend không cho đổi thời gian nhớ lại trong trường hợp đó.
- Kiểm tra hiện tại: typecheck, app test 87/87, Android/iOS export, lint Hooks sạch. Backend Parent 8/8 trên database thử riêng. Chi tiết giới hạn và lệnh Git ở journal.

Ngày khảo sát: 2026-11-09. Tên thực tế: `Memio-web`, `Memio-app`, `Memio-be` là ba repository độc lập; thư mục cha không có Git. Đường dẫn dưới đây tương đối với thư mục cha Memio, trừ đường dẫn bắt đầu `src/` (thuộc app).

## Phạm vi đã xác minh

| Tính năng/luồng | Web và bằng chứng | Backend/API và bằng chứng | App lúc khảo sát / công việc |
|---|---|---|---|
| Đăng nhập, refresh Parent | `Memio-web/src/app/ParentRoute.tsx`, `RootLayout.tsx`; phân biệt role và emailVerified | `/auth/login`, `/auth/refresh`; `Memio-be/src/services/user.service.ts`, `controller/auth.controller.ts`: mobile có token trong body | `src/types/auth.types.ts` đã có role/isEmailVerified; `src/app/login.tsx` luôn về `/`; cần điều hướng và guard |
| Đăng ký liên kết từ con | `Memio-web/src/features/parent/components/ParentLinkCard.tsx`, trang `/profile`; trạng thái none/pending/verified | GET `/parent/link`, POST `/parent/register`, `/parent/resend`; `services/parent.service.ts`: childId từ phiên, email khác con, mỗi con một Parent | Chưa có màn/card; adapter đã thêm, UI chờ skill |
| Xác minh email | `ParentVerifyPage.tsx`: inspect rồi confirm chủ động | POST `/parent/verify/inspect`, `/parent/verify/confirm`; token 24 giờ, cooldown 60 giây, tối đa 5 lần/30 phút | Chưa có; email hiện trỏ web; cần màn native nhận token và xử lý web-to-app có chủ đích, không tự sửa domain |
| Parent chưa xác minh | `ParentPendingPage.tsx`, `ParentRoute.tsx` | `middlewares/authMiddleware.ts`: verifiedParentRoute chặn 403 | Cần pending screen, refresh trạng thái, đổi mật khẩu/đăng xuất |
| Tổng quan và hồ sơ con | `ParentDashboardPage.tsx`, `ParentChildProfilePage.tsx`, `ParentGameProgress.tsx` | GET `/parent/overview`, `/parent/games`; `services/parentReport.service.ts` lấy đúng childUserId | Chưa có; tái dùng AppText, Panel, ProgressRing, badges/profile utils; cần kiểm tra kiểu payload thực tế |
| Báo cáo ngày/tuần, gợi ý | `ParentDashboardPage.tsx`, `api/parent.api.ts` | GET `/parent/report?period=day|week&date=YYYY-MM-DD`; chỉ ván hoàn thành; so cùng khoảng thời gian kỳ trước, cần >=3 ván mỗi kỳ để nhận xét xu hướng | Chưa có; adapter giữ nguyên period/date, UI cần bộ chọn ngày và trạng thái trống |
| Nhóm tuổi | Chọn 6-8, 9-12, 13-15 hoặc chưa khai báo | PATCH `/parent/age-group`; `models/parent.ts`, `services/parent.service.ts` | Chưa có; adapter cho phép null, backend vẫn validate |
| Tài khoản Parent, điểm và mật khẩu | `ParentProfilePage.tsx`, PasswordRecoveryPage | PATCH `/parent/password`, POST `/parent/password-reset/{forgot,validate,confirm}`, GET `/family-rooms/points`; backend thu hồi phiên sau đổi mật khẩu | Chưa có; adapter recovery riêng; tái dùng form/schema hiện có, không dùng API user cho Parent |
| Tạo/vào phòng | `FamilyRoomLobbyPage.tsx`: Parent chọn 5 trò, level/custom nếu cho phép, thời gian và vòng; con nhập mã | POST `/family-rooms`, `/:code/join`; `services/familyRoom.service.ts`: chỉ con liên kết, mã 8 ký tự, room chờ 24h; độ khó theo unlock con | Chưa có; cần lobby theo role, cấu hình từ catalog, không hardcode luật |
| Chơi đồng bộ | `FamilyRoomPage.tsx`: waiting, memorizing, recalling, waiting_for_other, round_result, completed/cancelled | GET `/:code`; POST `/:code/{ready,start,recall,submit,next,finish}`; revision, serverNow và deadline trong view; backend quyết định phase/đáp án được lộ | Chưa có; tái dùng MemorizeStage/RecallBoard/PhotoTile sau kiểm tra kiểu; polling foreground, cleanup, chặn request chồng, chống response cũ |
| Kết quả và điểm đồng hành | `FamilyRoomPage.tsx`, `ParentProfilePage.tsx` | `familyRoom.service.ts`: số đúng rồi thời gian; đủ mọi vòng và cả hai tham gia => 10 điểm/room, chặn trùng bằng unique index | Chưa có; hiện kết quả backend; không cộng EXP/mở khóa từ UI |
| Quyền truy cập | `FamilyRoomRoute.tsx`, `ProtectedRoute.tsx` | `routes/parentRoute.ts`, `routes/familyRoomRoute.ts`, `middlewares/authMiddleware.ts` | Cần guard toàn cục cho Parent khỏi màn user và guard riêng cho room; ẩn entry với guest |

## Kết luận khảo sát và điều chưa xác minh

- App: Expo 58, React Native 0.88, expo-router Stack/Tabs, Zustand, axios; token SecureStore; UI theme/motion/Reanimated sẵn có. Không cần thư viện mới để bắt đầu.
- Backend hiện đã có bearer authentication cho Parent và response mobile; chưa tìm thấy thiếu sót buộc phải sửa backend. Không sửa backend trong phần nền tảng.
- Liên kết hiện là một-một; không chuyển sang lời mời email hoặc nhiều con trong phạm vi port.
- Email xác minh/reset hiện đưa về web. Hoàn tất trên web rồi quay app refresh/đăng nhập là khả thi theo code; mở thẳng app từ email chưa được tích hợp/xác minh.
- Chưa chạy hai thiết bị, chưa xác minh backend/SMTP đang hoạt động; không coi code hoặc adapter test là bằng chứng tích hợp.
- Không có AGENTS.md trong cây dự án được tìm. Đã đọc CLAUDE.md, HANDOFF.md, README.md của app. Hai skill theo CLAUDE.md chưa có; phiên đầu người dùng dừng UI, phiên tiếp tục đã cho phép dùng quy ước app hiện có. Quyết định mới thay thế điểm dừng cũ cho tác vụ này.

## Kế hoạch theo phụ thuộc

### P1 — Nền tảng API (hoàn thành phạm vi adapter)
- Mục tiêu: typed adapter dùng axios/session có sẵn cho Parent, rooms, recovery; không tạo transport mới.
- File: `src/features/parent/api/{parent,rooms,passwordReset}.api.ts`, `test/parent-api.test.mjs`.
- API: toàn bộ endpoint ở bảng; phụ thuộc auth client sẵn có. Không thêm UI/đổi hành vi đăng nhập.
- Hoàn thành: typecheck và suite test qua; token trong body; lỗi 401/403/409/429 không bị che; đáp án string giữ số 0 và null.
- Rủi ro: adapter test dùng transport giả để kiểm hợp đồng, không chứng minh quyền phía server hay mạng thật.

### P2 — Auth/guard và recovery (đã triển khai code; chờ nghiệm thu thiết bị)
- File dự kiến: `src/app/_layout.tsx`, `(tabs)/_layout.tsx`, `login.tsx`, route Parent; tái dùng `features/auth/components`.
- Phạm vi: Parent verified về tổng quan; pending về chờ xác minh; guest không vào room; Parent không vào game solo/profile user, kể cả deep link/back stack.
- API: auth login/refresh/logout; parent password/recovery. Phụ thuộc P1; người dùng đã cho phép dùng quy ước UI hiện có.
- Hoàn thành: cold launch/refresh/logout/back/deep link đúng role; reset Parent dùng endpoint riêng; đổi mật khẩu xóa token local; lỗi mạng không tự mất phiên.
- Kiểm tra: unit routing policy, account isolation, export hai nền tảng; tích hợp guest/user/pending/verified. Chú ý modal dismissal và stale cached user.

### P3 — Liên kết và xác minh (đã triển khai code; chờ nghiệm thu thiết bị)
- File dự kiến: card trong `features/profile/components/ProfileScreen.tsx`, màn `src/app/parent/verify.tsx`, `pending.tsx`, module Parent.
- Phạm vi/API: none -> register -> pending -> resend -> inspect/confirm -> verified; childId luôn từ phiên. Phụ thuộc P2.
- Hoàn thành: duplicate submit bị chặn; SMTP lỗi sau khi tạo account phải refresh trạng thái, không mời tạo trùng; retry/cooldown; email lỗi/hết hạn/đã dùng có recovery.
- Kiểm tra: backend thật với hai tài khoản, gửi mail và quay lại app; không tự động verify chỉ khi mở link; không lưu token vào journal/log.

### P4 — Dashboard/hồ sơ/báo cáo Parent (đã triển khai code; chờ nghiệm thu thiết bị)
- File dự kiến: `src/app/parent/{index,child-profile,profile}.tsx`, screens/hooks Parent.
- API: overview/games/report/age-group/points. Phụ thuộc P2.
- Hoàn thành: số liệu từ API, lọc ngày/tuần, empty/error/retry, level/badges/records, nhóm tuổi, điểm và lịch sử; response cũ không ghi đè bộ lọc mới; logout xóa cache.
- Kiểm tra: chưa có activity, ngày tương lai, lỗi quyền/email pending, đổi account, font lớn/màn nhỏ; dùng theme/motion và reduced motion.

### P5 — Lobby (đã triển khai code; chờ nghiệm thu thiết bị)
- File dự kiến: `src/app/family-room/index.tsx`, lobby screen, entry từ profile/training chỉ khi login.
- API: games/create/join. Phụ thuộc P2-P3.
- Hoàn thành: 5 trò, level <= unlock của con, custom chỉ khi catalog cho phép, thời gian/vòng hợp lệ, mã phòng sai/không thuộc con được báo rõ; nút chống tạo trùng.
- Kiểm tra: con khác không vào dù biết mã, guest/pending không tạo, lỗi 409/404/mất mạng, bàn phím và QR/link chỉ khi có yêu cầu riêng.

### P6 — Phòng chơi và kết quả (đã triển khai code; chờ nghiệm thu thiết bị)
- File dự kiến: `src/app/family-room/[code].tsx`, room hook/state và bảng nhập theo trò; reuse game components khi phù hợp.
- API: get/ready/start/recall/submit/next/finish/points. Phụ thuộc P5.
- Hoàn thành: đầy đủ 5 trò và mọi phase; giữ số 0 đầu; không trộn đáp án vòng trước; kết quả/điểm từ server; Parent bắt đầu/next/finish; foreground refetch, polling cleanup và revision ordering; lưu nháp theo account/room/round nếu cần phục hồi, không lưu đáp án gốc.
- Kiểm tra: hai thiết bị/web-app, background/reopen, đồng hồ lệch, nộp hai lần, kết quả HTTP đến ngược thứ tự, hết giờ/mất mạng, người kia chờ/rời, room cancelled/completed. Không báo thành công khi server chưa xác nhận.

### P7 — Tích hợp và bàn giao (đang làm; kiểm thử thiết bị chưa thực hiện được)
- Chạy typecheck/test, lint nếu tool có sẵn (không tự cài), Expo export android/ios, expo-doctor theo CLAUDE.md; kiểm UI trên thiết bị sẵn có.
- Cập nhật README/HANDOFF và journal khi tính năng có thể dùng được. Nêu rõ mọi kiểm tra không chạy được.
- Không stage/commit/push. Mỗi phần hoàn thành đưa lệnh Git theo root thực, file cụ thể; package-lock có sẵn không đưa vào.

## Checklist nghiệm thu trên thiết bị còn lại

- [ ] Cold launch/refresh: guest, con, Parent pending và verified; back/deep link không lộ màn sai quyền.
- [ ] Từ tài khoản con đăng ký Parent, xác minh qua email thật, gửi lại email/hết hạn và SMTP lỗi; chuyển sang Parent trên thiết bị khác.
- [ ] Báo cáo không dữ liệu, ngày/tuần, bộ lọc đổi nhanh; tuổi, thành tích và điểm đúng dữ liệu backend.
- [ ] Hai thiết bị (hoặc app + web) chạy card/image/number/facename/word; bắt đầu sớm nhớ lại, nộp đủ/thiếu, timeout, nhiều vòng và kết thúc sớm.
- [ ] Background/mất mạng rồi mở lại, phục hồi nháp, lệch đồng hồ, nộp lặp, account khác không đọc được dữ liệu.
- [ ] Bàn phím Android/iOS, màn nhỏ/font lớn, ảnh tải chậm, giảm chuyển động, cuộn và nút nộp.
- [ ] Đổi/reset mật khẩu Parent, thu hồi phiên; lỗi token không hợp lệ/hết hạn.
