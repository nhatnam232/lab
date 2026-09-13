import { useEffect, useRef } from "react"

/**
 * Modal co so: backdrop, dong bang Esc, role dialog, giu focus trong hop thoai
 * (focus trap) va tra focus ve phan tu da mo modal khi dong.
 */
export default function Modal({ title, onClose, children }) {
	const closeRef = useRef(null)
	const dialogRef = useRef(null)
	const restoreRef = useRef(null)

	useEffect(() => {
		restoreRef.current = document.activeElement
		closeRef.current?.focus()

		const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
		const onKeyDown = (event) => {
			if (event.key !== "Tab") return
			const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE)
			if (!focusables?.length) return
			const first = focusables[0]
			const last = focusables[focusables.length - 1]
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault()
				last.focus()
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault()
				first.focus()
			}
		}
		document.addEventListener("keydown", onKeyDown)
		return () => {
			document.removeEventListener("keydown", onKeyDown)
			restoreRef.current?.focus?.()
		}
	}, [])

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
			onClick={onClose}
		>
			<div
				ref={dialogRef}
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
