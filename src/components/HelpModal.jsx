import Modal from "./Modal.jsx"

const SHORTCUTS = [
	["Space", "Chạy / tạm dừng mô phỏng"],
	["R", "Làm lại mô phỏng từ đầu"],
	["1 / 2", "Chuyển giữa Phòng thí nghiệm Hóa ↔ Xây hàm số"],
	["/", "Nhảy vào ô tìm kiếm"],
	["?", "Mở bảng trợ giúp này"],
	["Esc", "Đóng hộp thoại"],
]

export default function HelpModal({ onClose }) {
	return (
		<Modal title="Trợ giúp" onClose={onClose}>
			<div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
				<section className="space-y-1.5">
					<h3 className="font-semibold text-slate-800 dark:text-slate-100">⚗️ Phòng thí nghiệm Hóa</h3>
					<ul className="list-disc space-y-1 pl-5">
						<li>Chọn chất từ bảng bên trái (có ảnh chụp thật) để cho vào cốc.</li>
						<li>Điều chỉnh số mol từng chất — hệ thống tự nhận các phản ứng khả thi.</li>
						<li>Nếu thí nghiệm có nhiều phản ứng, chọn một phản ứng để chạy và xem từng bước giải.</li>
						<li>Khi thiếu đúng một chất, app gợi ý &quot;Thêm X để phản ứng Y&quot;.</li>
					</ul>
				</section>
				<section className="space-y-1.5">
					<h3 className="font-semibold text-slate-800 dark:text-slate-100">📐 Xây hàm số</h3>
					<ul className="list-disc space-y-1 pl-5">
						<li>Bấm vào khối hàm (sin, x², eˣ…) để thêm vào công thức.</li>
						<li>Mỗi khối có dấu +/−, tham số riêng, có thể di chuyển hoặc bỏ ra.</li>
						<li>Đồ thị dưới cập nhật tức thì; rê chuột để đọc giá trị, bật đạo hàm để so sánh.</li>
					</ul>
				</section>
				<section className="space-y-2">
					<h3 className="font-semibold text-slate-800 dark:text-slate-100">Phím tắt</h3>
					<dl className="grid gap-1.5 sm:grid-cols-2">
						{SHORTCUTS.map(([key, description]) => (
							<div key={key} className="flex items-center gap-2">
								<dt>
									<kbd className="kbd">{key}</kbd>
								</dt>
								<dd className="text-xs">{description}</dd>
							</div>
						))}
					</dl>
				</section>
				<p className="text-xs text-slate-500 dark:text-slate-400">
					Mọi cấu hình được lưu trên máy bạn và chia sẻ được qua đường dẫn (nút Chia sẻ).
				</p>
			</div>
		</Modal>
	)
}
