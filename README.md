# 🧪 SciLab Playground

Phòng thí nghiệm mô phỏng **Hóa – Lý – Toán** chạy hoàn toàn trong trình duyệt: chọn thí nghiệm, kéo thanh thông số, xem mô phỏng động, đọc kết quả tính toán và lời giải thích.

## Tính năng

- **16 thí nghiệm** chia theo ba môn: 6 phản ứng hóa học (có chất giới hạn, khối lượng sản phẩm, nhiệt phản ứng), 7 bài vật lý (Newton, rơi tự do, ném xéo, con lắc, lò xo, Ohm, sóng cơ) và 6 bài toán (hàm bậc hai, hệ phương trình, tam giác, lượng giác, tăng trưởng hàm mũ, xác suất).
- **Mô phỏng canvas** có phát/tạm dừng, tốc độ 0.25×–4×, làm lại và xuất ảnh PNG.
- **Đồ thị SVG** nhiều chuỗi dữ liệu, xuất CSV để làm báo cáo.
- **Tìm kiếm không dấu**, lọc theo môn, danh sách yêu thích.
- **Chủ đề sáng/tối**, ghi nhận thông số vào localStorage và **chia sẻ bằng đường dẫn** `#s=<id>&<thông số>`.
- **Giải thích tự động** cho mọi thí nghiệm; nếu cấu hình API key thì có thêm nút hỏi AI.
- **Bộ test** kiểm chứng công thức và toàn bộ thí nghiệm ở giá trị mặc định lẫn hai biên.

## Chạy dự án

```bash
npm install
npm run dev      # mở http://localhost:5173
npm test         # chạy bộ test (node:test)
npm run build    # build ra dist/
npm run preview  # xem thử bản build
```

## Giải thích bằng AI (không bắt buộc)

Sao chép `.env.example` thành `.env` và điền:

```
VITE_CLAUDE_API_KEY=...
VITE_CLAUDE_API_URL=https://api.anthropic.com/v1/messages
VITE_CLAUDE_MODEL=claude-3-5-haiku-latest
```

Khi không có key, ứng dụng vẫn hoạt động đầy đủ và dùng lời giải thích tính sẵn trong mã.

## Cấu trúc

```
src/
  lib/         utils.js (toán, định dạng, CSV, RNG), draw.js (bảng màu + hàm vẽ canvas)
  scenarios/   chemistry.js, physics.js, math.js, index.js (registry + tìm kiếm)
  state/       useAppState.js (thông số, chủ đề, yêu thích, share link)
  components/  Sidebar, ControlPanel, CanvasStage, ChartPanel, InfoPanel
  api/         ai.js (giải thích bằng AI, có phương án dự phòng)
tests/         scenarios.test.js
```

## Thêm thí nghiệm mới

Thêm một object vào mảng scenario tương ứng:

```js
{
  id: "phys-vi-du",
  subject: "physics",
  title: "Tên thí nghiệm",
  subtitle: "Mô tả ngắn",
  formula: "F = ma",
  tags: ["cơ học"],
  theory: "Giải thích lý thuyết…",
  inputs: [{ key: "m", label: "Khối lượng", unit: "kg", min: 1, max: 10, step: 0.5, default: 2 }],
  compute: (v) => ({ metrics: [], series: [] }),
  draw: (scene) => {},
  explain: (v, r) => "",
}
```

Bộ test sẽ tự động kiểm tra thí nghiệm mới (thông số hợp lệ, compute chạy ở mọi biên, có metrics và series).

## Triển khai

`vite.config.js` dùng `base: "./"` nên thư mục `dist/` có thể đặt trực tiếp lên GitHub Pages, Netlify, Vercel hay bất kỳ static host nào.
