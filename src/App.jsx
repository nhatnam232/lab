import { useEffect, useState } from "react"
import Header from "./components/Header.jsx"
import ErrorBoundary from "./components/ErrorBoundary.jsx"
import HelpModal from "./components/HelpModal.jsx"
import CreditsModal from "./components/CreditsModal.jsx"
import ChemLab from "./lab/chem/ChemLab.jsx"
import MathLab from "./lab/math/MathLab.jsx"
import { useLabState } from "./state/useLabState.js"

export default function App() {
	const app = useLabState()
	const [helpOpen, setHelpOpen] = useState(false)
	const [creditsOpen, setCreditsOpen] = useState(false)

	useEffect(() => {
		const onKey = (event) => {
			if (event.key === "Escape") {
				setHelpOpen(false)
				setCreditsOpen(false)
				return
			}
			const target = event.target
			if (target?.closest?.("input, textarea, select, [contenteditable]")) return
			if (event.key === " ") {
				if (target?.closest?.("button")) return
				event.preventDefault()
				app.setPlaying(!app.playing)
			} else if (event.key === "r" || event.key === "R") {
				window.dispatchEvent(new CustomEvent("scilab:reset-time"))
			} else if (event.key === "1") {
				app.setMode("chem")
			} else if (event.key === "2") {
				app.setMode("math")
			} else if (event.key === "/") {
				event.preventDefault()
				document.querySelector("[data-search]")?.focus()
			} else if (event.key === "?") {
				setHelpOpen(true)
			}
		}
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [app])

	return (
		<div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
			<a
				href="#main"
				className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-sky-600 focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
			>
				Bỏ qua tới nội dung
			</a>
			<Header app={app} onHelp={() => setHelpOpen(true)} onCredits={() => setCreditsOpen(true)} />
			<main id="main" className="mx-auto max-w-7xl px-4 py-4" tabIndex={-1}>
				<ErrorBoundary key={app.mode}>
					{app.mode === "chem" ? <ChemLab app={app} /> : <MathLab app={app} />}
				</ErrorBoundary>
			</main>
			<footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-500 dark:text-slate-400">
				<p>
					Phím tắt: <kbd className="kbd">Space</kbd> chạy/dừng · <kbd className="kbd">R</kbd> làm lại ·{" "}
					<kbd className="kbd">1</kbd>/<kbd className="kbd">2</kbd> đổi chế độ · <kbd className="kbd">/</kbd> tìm
					kiếm · <kbd className="kbd">?</kbd> trợ giúp
				</p>
				<p className="mt-1">
					Mô phỏng giáo dục — luôn tuân thủ hướng dẫn an toàn khi làm thí nghiệm thật. Ảnh chất: Wikimedia
					Commons (xem <button type="button" className="underline" onClick={() => setCreditsOpen(true)}>nguồn ảnh</button>).
				</p>
			</footer>
			{helpOpen ? <HelpModal onClose={() => setHelpOpen(false)} /> : null}
			{creditsOpen ? <CreditsModal onClose={() => setCreditsOpen(false)} /> : null}
		</div>
	)
}
