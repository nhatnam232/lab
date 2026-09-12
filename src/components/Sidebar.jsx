import { SUBJECTS } from "../scenarios/index.js"

export default function Sidebar({
	list,
	scenarioId,
	onSelect,
	subject,
	onSubject,
	query,
	onQuery,
	favorites,
	onToggleFavorite,
}) {
	const favoriteItems = list.filter((item) => favorites.includes(item.id))
	const others = list.filter((item) => !favorites.includes(item.id))

	const renderItem = (item) => (
		<li key={item.id}>
			<div
				className={`group flex items-start gap-2 rounded-xl border px-3 py-2 transition ${
					item.id === scenarioId
						? "border-sky-500 bg-sky-50 dark:bg-sky-500/10"
						: "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-800/60"
				}`}
			>
				<button type="button" onClick={() => onSelect(item.id)} className="flex-1 text-left">
					<span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
					<span className="block text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</span>
				</button>
				<button
					type="button"
					onClick={() => onToggleFavorite(item.id)}
					title={favorites.includes(item.id) ? "Bỏ yêu thích" : "Thêm yêu thích"}
					className="mt-0.5 text-base leading-none opacity-60 transition hover:opacity-100"
				>
					{favorites.includes(item.id) ? "★" : "☆"}
				</button>
			</div>
		</li>
	)

	return (
		<aside className="card flex h-full flex-col gap-3 overflow-hidden">
			<input
				type="search"
				value={query}
				onChange={(event) => onQuery(event.target.value)}
				placeholder="Tìm thí nghiệm, công thức..."
				className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
			/>

			<div className="flex flex-wrap gap-1.5">
				<button
					type="button"
					onClick={() => onSubject(null)}
					className={`btn px-2.5 py-1 text-xs ${subject === null ? "btn-primary" : ""}`}
				>
					Tất cả
				</button>
				{SUBJECTS.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={() => onSubject(subject === item.id ? null : item.id)}
						className={`btn px-2.5 py-1 text-xs ${subject === item.id ? "btn-primary" : ""}`}
					>
						<span>{item.icon}</span>
						{item.label}
					</button>
				))}
			</div>

			<div className="-mr-2 flex-1 overflow-y-auto pr-2">
				{list.length === 0 ? (
					<p className="px-1 py-6 text-sm text-slate-500 dark:text-slate-400">
						Không tìm thấy thí nghiệm nào phù hợp.
					</p>
				) : (
					<>
						{favoriteItems.length > 0 && (
							<>
								<p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Yêu thích</p>
								<ul className="mb-3 space-y-1">{favoriteItems.map(renderItem)}</ul>
							</>
						)}
						<p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
							{list.length} thí nghiệm
						</p>
						<ul className="space-y-1">{others.map(renderItem)}</ul>
					</>
				)}
			</div>
		</aside>
	)
}
