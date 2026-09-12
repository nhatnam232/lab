import { useState } from "react"
import { fmt } from "../lib/utils.js"

export default function ControlPanel({ scenario, values, onChange, onReset, onRandom, shareUrl }) {
	const [copied, setCopied] = useState(false)

	const copyShare = async () => {
		const url = shareUrl()
		try {
			await navigator.clipboard.writeText(url)
		} catch {
			window.prompt("Sao chép đường dẫn này", url)
		}
		if (typeof window !== "undefined") window.location.hash = url.split("#")[1] ?? ""
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<section className="card space-y-4">
			<div className="flex items-center justify-between gap-2">
				<h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Thông số</h2>
				<div className="flex gap-1.5">
					<button type="button" className="btn px-2 py-1 text-xs" onClick={onRandom}>
						🎲 Ngẫu nhiên
					</button>
					<button type="button" className="btn px-2 py-1 text-xs" onClick={onReset}>
						↺ Mặc định
					</button>
					<button type="button" className="btn px-2 py-1 text-xs" onClick={copyShare}>
						{copied ? "✓ Đã sao chép" : "🔗 Chia sẻ"}
					</button>
				</div>
			</div>

			<div className="space-y-4">
				{scenario.inputs.map((field) => (
					<div key={field.key} className="space-y-1.5">
						<label className="field-label" htmlFor={`field-${field.key}`}>
							<span>
								{field.label}
								{field.unit ? <span className="ml-1 text-slate-400">({field.unit})</span> : null}
							</span>
							<input
								id={`field-${field.key}`}
								type="number"
								value={values[field.key]}
								min={field.min}
								max={field.max}
								step={field.step}
								onChange={(event) => onChange(field.key, event.target.value)}
								className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
							/>
						</label>
						<input
							type="range"
							value={values[field.key]}
							min={field.min}
							max={field.max}
							step={field.step}
							onChange={(event) => onChange(field.key, event.target.value)}
						/>
						<div className="flex justify-between text-[11px] text-slate-400">
							<span>{fmt(field.min)}</span>
							<span>{fmt(field.max)}</span>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
