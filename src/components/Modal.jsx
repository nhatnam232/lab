import { useEffect, useRef } from "react"

/** Modal co so: backdrop, dong bang Esc, role dialog. */
export default function Modal({ title, onClose, children }) {
	const closeRef = useRef(null)

	useEffect(() => {
		closeRef.current?.focus()
	}, [])

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto"
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label={title}
			>
				<div className="mb-3 flex items-center justify-between gap-2">
					<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
					<button ref={closeRef} type="button" className="btn px-2 py-1 text-xs" onClick={onClose}>
						✕ Đóng
					</button>
				</div>
				{children}
			</div>
		</div>
	)
}
