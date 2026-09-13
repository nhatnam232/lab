# 🧪 SciLab Studio

Tự tạo thí nghiệm ngay trong trình duyệt — **không có thí nghiệm đóng hộp**: bạn chọn chất, cộng các khối hàm số và xem mô phỏng diễn ra phía dưới.

## Hai chế độ

- **⚗️ Phòng thí nghiệm Hóa** — bảng 22 chất có **ảnh chụp thật** (kim loại, khí, axit, muối…). Chọn chất cho vào cốc, chỉnh số mol: hệ thống tự nhận các phản ứng khả thi từ cơ sở 10 phản ứng (tìm chất giới hạn, sản phẩm, chất dư, nhiệt phản ứng), gợi ý "còn thiếu chất nào" và giải **từng bước**. Mô phỏng canvas vẽ ảnh thật các chất trong cốc kèm hiệu ứng bọt khí, lửa, đổi màu.
- **📐 Xây hàm số** — 13 khối hàm (sin, cos, x², x³, √x, |x|, 1/x, eˣ, ln x, chuông Gauss, sigmoit, hằng số, bậc nhất). Bấm để thêm vào công thức, mỗi khối có dấu **+/−** và tham số riêng: `y = ±f₁(x) ± f₂(x) ± …` cập nhật tức thì trên đồ thị. Đồ thị có crosshair đọc giá trị (chuột + bàn phím), con trỏ chạy động, đạo hàm, tích phân Simpson và bảng đóng góp của từng khối.

## Tính năng chung

- Phím tắt: `Space` chạy/dừng · `R` làm lại · `1`/`2` đổi chế độ · `/` tìm kiếm · `?` trợ giúp.
- Chủ đề sáng/tối (nhớ lựa chọn, không nháy khi tải lại), tôn trọng `prefers-reduced-motion`.
- Chia sẻ bằng đường dẫn: `#m=chem&mx=h2:2,o2:1` hoặc `#m=math&b=sin:-1:2,1,0.5;x2:1:1` — dán link vào tab đang mở vẫn áp dụng được.
- Cấu hình tự lưu vào `localStorage` (khóa `scilab:studio:v3`) — không cần tài khoản, không backend.
- Giải thích bằng AI (tùy chọn) khi cấu hình `VITE_CLAUDE_API_KEY`.
- Accessibility: skip-link, focus-visible, aria-pressed/aria-live, đồ thị duyệt được bằng phím mũi tên.
- Xuất CSV, xuất PNG mô phỏng, ErrorBoundary chống trắng trang.

## Ảnh chất

Ảnh chụp thật tải từ **Wikimedia Commons** theo giấy phép mở của từng tác giả — xem đầy đủ trong app (nút **📷 Ảnh** ở header).

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # node:test — engine hóa học, composer hàm số, share/hash
npm run build    # dist/
npm run preview
```

## Cấu trúc

```
src/
  lib/            utils.js (fmt vi-VN, prettyFormula, sampling), draw.js (palette canvas)
  lab/chem/       substances.js (22 chất), reactions.js (10 phản ứng),
                  engine.js (nhận diện + tính toán + từng bước), ChemLab.jsx, chemScene.js
  lab/math/       blocks.js (13 khối hàm), composer.js (cộng hàm, đạo hàm, tích phân),
                  MathLab.jsx, GraphPanel.jsx
  state/          useLabState.js (2 chế độ, localStorage, share hash 2 chiều)
  components/     Header, Modal, HelpModal, CreditsModal, ErrorBoundary
public/substances/  ảnh chất + manifest.json
tests/            lab.test.js
```

## Thêm phản ứng / khối hàm mới

- Phản ứng: thêm object vào `REACTIONS` trong `src/lab/chem/reactions.js` (chat tham chiếu theo `id` trong `SUBSTANCES`) — bộ test tự kiểm tra tính nhất quán.
- Khối hàm: thêm object vào `BLOCK_TYPES` trong `src/lab/math/blocks.js` (có `params`, `fn(params) => x => y`, `formula(params)` hiển thị).

## Triển khai

`vite.config.js` dùng `base: "./"` — thư mục `dist/` đặt được lên GitHub Pages, Netlify, Vercel hay bất kỳ static host nào. CI (`.github/workflows/ci.yml`) chạy test + build cho mỗi commit/PR vào main.
