import { useEffect, useState } from "react"
import { explainWithAi, hasAiKey } from "../api/ai.js"

export default function InfoPanel({ scenario, values, result }) {
	const [explanation, setExplanation] = useState("")
	const [source, setSource] = useState("offline")
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (result.error) {
			setExplanation("")
			return
		}
		setExplanation(scenario.explain(values, result))
		setSource("offline")
	}, [scenario, values, result])

	const askAi = async () => {
		setLoading(true)
		const response = await explainWithAi(scenario, values, result)
		setExplanation(response.text)
		setSource(response.source)
		setLoading(false)
	}

	return (
		<div className="space-y-4">
			<section className="card space-y-3">
				<h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kết quả</h2>
				{result.error ? (
					<p className="text-sm text-red-500">{result.error}</p>
				) : (
					<dl className="grid gap-2 sm:grid-cols-2">
						{result.metrics.map((item) => (
							<div
								key={item.label}
								className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
							>
								<dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
								<dd className="text-base font-semibold text-slate-800 dark:text-slate-100">
									{item.value}
									{item.unit ? <span className="ml-1 text-xs font-normal text-slate-400">{item.unit}</span> : null}
								</dd>
								{item.hint ? <p className="text-[11px] text-slate-400">{item.hint}</p> : null}
							</div>
						))}
					</dl>
				)}
			</section>

			<section className="card space-y-2">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Giải thích</h2>
					<div className="flex items-center gap-2">
						<span className="chip">{source === "ai" ? "AI" : "Lời giải sẵn"}</span>
						{hasAiKey ? (
							<button type="button" className="btn px-2 py-1 text-xs" onClick={askAi} disabled={loading || !!result.error}>
								{loading ? "Đang hỏi AI..." : "✨ Hỏi AI"}
							</button>
						) : null}
					</div>
				</div>
				<p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
					{explanation || "Chỉnh thông số hợp lệ để xem lời giải thích."}
				</p>
				{!hasAiKey ? (
					<p className="text-[11px] text-slate-400">
						Thêm VITE_CLAUDE_API_KEY vào file .env để bật phần giải thích bằng AI.
					</p>
				) : null}
			</section>

			<section className="card space-y-2">
				<h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lý thuyết</h2>
				<p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{scenario.theory}</p>
				{scenario.safety ? (
					<p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
						⚠️ {scenario.safety}
					</p>
				) : null}
				<div className="flex flex-wrap gap-1.5 pt-1">
					{(scenario.tags ?? []).map((tag) => (
						<span key={tag} className="chip">
							#{tag}
						</span>
					))}
				</div>
			</section>
		</div>
	)
}
