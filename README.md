# SciLab Playground

Interactive "Fill & See" learning lab cho học sinh cấp 2–3 và sinh viên. Điền tham số vào equation panel và xem kết quả mô phỏng real-time cho ba môn: Hóa học, Vật lý, Toán học.

## Chạy dự án

```bash
npm install
npm run dev
```

Mở http://localhost:5173.

## Cấu trúc

- `src/App.jsx` — layout chính + chuyển đổi module
- `src/components/EquationPanel.jsx` — các ô input
- `src/components/SimulationCanvas.jsx` — engine animation (Canvas API + Recharts)
- `src/components/InfoPanel.jsx` — hiển thị kết quả & giải thích AI
- `src/modules/chemistry.js` — định nghĩa phản ứng hóa học
- `src/modules/physics.js` — công thức & mô phỏng vật lý
- `src/modules/math.js` — hàm số, hình học, xác suất
- `src/api/claude.js` — gọi Claude API để giải thích bằng ngôn ngữ tự nhiên (có fallback offline)

## Module đã hỗ trợ

**Hóa học:** H₂ + O₂ → H₂O, NaCl → ion hóa, Fe + O₂ → gỉ sét, HCl + NaOH → trung hòa, C + O₂ → cháy.

**Vật lý:** Định luật II Newton (F = ma), rơi tự do, con lắc đơn.

**Toán học:** Hàm số bậc hai (parabol), tam giác từ 3 cạnh, xác suất tung đồng xu.

Mỗi module file được thiết kế để dễ dàng thêm kịch bản mới (sóng âm, mạch điện, chuỗi số...).

## Giải thích bằng AI

Đặt biến môi trường trong `.env`:

```
VITE_CLAUDE_API_KEY=sk-ant-...
```

Nếu không có API key, ứng dụng dùng giải thích cục bộ (offline) được viết sẵn cho từng kịch bản.

> Lưu ý: gọi thẳng Claude API từ trình duyệt chỉ phù hợp cho demo. Khi triển khai thật, hãy proxy request qua backend của bạn để không lộ API key.
