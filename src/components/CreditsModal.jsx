import Modal from "./Modal.jsx"
import { IMAGE_CREDITS, getSubstance } from "../lab/chem/substances.js"

/** Hien thi nguon anh (Wikimedia Commons) va giay phep tung chat. */
export default function CreditsModal({ onClose }) {
	const credits = IMAGE_CREDITS.filter((item) => item.id && item.file)
	return (
		<Modal title="Nguồn ảnh chất hóa học" onClose={onClose}>
			<p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
				Ảnh chụp thật được tải từ Wikimedia Commons, sử dụng theo giấy phép của từng tác giả. Bấm vào tên
				file để xem trang gốc.
			</p>
			<ul className="space-y-2">
				{credits.map((item) => {
					const substance = getSubstance(item.id)
					return (
						<li
							key={item.id}
							className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-800"
						>
							<img
								src={`${import.meta.env.BASE_URL}substances/${item.file}`}
								alt={substance?.name ?? item.id}
								loading="lazy"
								className="h-12 w-12 shrink-0 rounded-lg object-cover"
							/>
							<div className="min-w-0 flex-1 text-xs">
								<p className="font-medium text-slate-800 dark:text-slate-100">
									{substance?.name ?? item.id}
									{substance ? ` (${substance.formula})` : ""}
								</p>
								<p className="truncate text-slate-500 dark:text-slate-400">
									{item.url ? (
										<a href={item.url} target="_blank" rel="noreferrer" className="underline">
											{item.title}
										</a>
									) : (
										item.title
									)}{" "}
									— {item.artist}
								</p>
							</div>
							<span className="chip shrink-0">{item.license}</span>
						</li>
					)
				})}
			</ul>
		</Modal>
	)
}
