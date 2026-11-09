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
