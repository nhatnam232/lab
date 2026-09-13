const MODES = [
	{ id: "chem", label: "Phòng thí nghiệm Hóa", icon: "⚗️" },
	{ id: "math", label: "Xây hàm số", icon: "📐" },
]

export default function Header({ app, onHelp, onCredits }) {
	return (
		<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div>
					<h1 className="text-lg font-bold">🧪 SciLab Studio</h1>
					<p className="text-xs text-slate-500 dark:text-slate-400">
						Tự tạo thí nghiệm của bạn — chọn chất, cộng hàm số, xem mô phỏng
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<div role="group" aria-label="Chế độ" className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
						{MODES.map((mode) => (
							<button
								key={mode.id}
								type="button"
								aria-pressed={app.mode === mode.id}
								title={`${mode.label} (phím ${mode.id === "chem" ? "1" : "2"})`}
								onClick={() => app.setMode(mode.id)}
								className={`px-3 py-1.5 text-sm font-medium ${
									app.mode === mode.id
										? "bg-sky-600 text-white"
										: "bg-white text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300"
								}`}
							>
								<span>{mode.icon}</span> {mode.label}
							</button>
						))}
					</div>
					<button type="button" className="btn px-2 py-1.5 text-xs" onClick={onCredits} title="Nguồn ảnh nguyên tố">
						📷 Ảnh
					</button>
					<button type="button" className="btn px-2 py-1.5 text-xs" onClick={onHelp} title="Trợ giúp (phím ?)">
						? Trợ giúp
					</button>
					<button type="button" className="btn" onClick={app.toggleTheme} title="Đổi chủ đề sáng/tối">
						{app.theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
					</button>
				</div>
			</div>
		</header>
	)
}
