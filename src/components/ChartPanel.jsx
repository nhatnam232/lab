import { useState } from "react"
import { downloadBlob, fmt, toCsv } from "../lib/utils.js"

const COLORS = ["#38bdf8", "#a3e635", "#f472b6", "#fbbf24", "#f97316", "#34d399", "#94a3b8", "#60a5fa"]
const W = 640
const H = 260
const PAD = { left: 52, right: 16, top: 16, bottom: 34 }

export default function ChartPanel({ scenarioId, series }) {
	const [active, setActive] = useState(0)
	const index = Math.min(active, Math.max(0, series.length - 1))
	const serie = series[index]

	if (!serie || serie.data.length === 0) {
		return (
			<section className="card">
				<p className="text-sm text-slate-500 dark:text-slate-400">Thí nghiệm này chưa có dữ liệu để vẽ đồ thị.</p>
			</section>
		)
	}

	const xs = serie.data.map((point) => point.x)
	const ys = serie.data.map((point) => point.y)
	const minX = Math.min(...xs)
	const maxX = Math.max(...xs)
	const minY = Math.min(...ys, 0)
	const maxY = Math.max(...ys, 0)
	const spanX = maxX - minX || 1
	const spanY = maxY - minY || 1
	const color = serie.color ?? COLORS[index % COLORS.length]

	const mapX = (x) => PAD.left + ((x - minX) / spanX) * (W - PAD.left - PAD.right)
	const mapY = (y) => H - PAD.bottom - ((y - minY) / spanY) * (H - PAD.top - PAD.bottom)
	const line = serie.data.map((point) => `${mapX(point.x).toFixed(2)},${mapY(point.y).toFixed(2)}`).join(" ")
	const ticksY = [0, 0.25, 0.5, 0.75, 1].map((ratio) => minY + ratio * spanY)
	const ticksX = [0, 0.5, 1].map((ratio) => minX + ratio * spanX)

	return (
		<section className="card space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap gap-1.5">
					{series.map((item, itemIndex) => (
						<button
							key={item.label}
							type="button"
							onClick={() => setActive(itemIndex)}
							className={`btn px-2.5 py-1 text-xs ${itemIndex === index ? "btn-primary" : ""}`}
						>
							{item.label}
						</button>
					))}
				</div>
				<button
					type="button"
					className="btn px-2 py-1 text-xs"
					onClick={() => downloadBlob(toCsv(serie), `${scenarioId}-${index + 1}.csv`, "text/csv;charset=utf-8")}
				>
					⬇️ CSV
				</button>
			</div>

			<svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={serie.label}>
				{ticksY.map((value) => (
					<g key={`y-${value}`}>
						<line
							x1={PAD.left}
							x2={W - PAD.right}
							y1={mapY(value)}
							y2={mapY(value)}
							stroke="currentColor"
							strokeWidth="1"
							className="text-slate-200 dark:text-slate-800"
						/>
						<text
							x={PAD.left - 8}
							y={mapY(value) + 4}
							textAnchor="end"
							fontSize="10"
							fill="currentColor"
							className="text-slate-400"
						>
							{fmt(value, 2)}
						</text>
					</g>
				))}
				{ticksX.map((value) => (
					<text
						key={`x-${value}`}
						x={mapX(value)}
						y={H - PAD.bottom + 16}
						textAnchor="middle"
						fontSize="10"
						fill="currentColor"
						className="text-slate-400"
					>
						{fmt(value, 2)}
					</text>
				))}
				<polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
				<text
					x={W - PAD.right}
					y={H - 6}
					textAnchor="end"
					fontSize="10"
					fill="currentColor"
					className="text-slate-400"
				>
					{serie.xLabel}
				</text>
				<text x={6} y={12} fontSize="10" fill="currentColor" className="text-slate-400">
					{serie.yLabel}
				</text>
			</svg>
		</section>
	)
}
