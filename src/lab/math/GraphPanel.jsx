import { useEffect, useMemo, useRef, useState } from "react"
import { buildSeries, compose, evaluateAt, numericDerivative, simpsonIntegral } from "./composer.js"
import { clamp, fmt } from "../../lib/utils.js"

const W = 640
const H = 320
const PAD = 34
const SWEEP_SECONDS = 8
const MAIN_COLOR = "#38bdf8"
const DERIVATIVE_COLOR = "#f472b6"
const CURSOR_COLOR = "#fbbf24"

/** Tim diem co x gan nhat trong day mau. */
function nearestIndex(points, x) {
	let best = 0
	for (let i = 1; i < points.length; i += 1) {
		if (Math.abs(points[i].x - x) < Math.abs(points[best].x - x)) best = i
	}
	return best
}

/**
 * Tach day diem thanh nhieu doan polyline tai khoang gian doan (1/x tai x=0):
 * khi hai diem lien tiep cach xa nhau qua 70% chieu cao vung ve, coi nhu
 * duong cong bi dut — tranh net thang xuyen qua tiem can.
 */
function toSegments(points, xMap, yMap, plotHeight) {
	const jump = plotHeight * 0.7
	const segments = []
	let current = []
	for (const point of points) {
		if (current.length && Math.abs(yMap(point.y) - yMap(current[current.length - 1].y)) > jump) {
			segments.push(current)
			current = []
		}
		current.push(point)
	}
	if (current.length) segments.push(current)
	return segments
		.filter((segment) => segment.length > 1)
		.map((segment) => segment.map((point) => `${xMap(point.x).toFixed(1)},${yMap(point.y).toFixed(1)}`).join(" "))
}

/**
 * Do thi ham tong: truc + luoi + diem doc hover (chuot va ban phim),
 * con tro chay quet theo x, bang gia tri tai vi tri con tro.
 */
export default function GraphPanel({ blocks, domain, playing, setPlaying, theme }) {
	const [showDerivative, setShowDerivative] = useState(false)
	const [hoverIndex, setHoverIndex] = useState(null)
	const [t, setT] = useState(0)
	const svgRef = useRef(null)

	const reducedMotion = useMemo(
		() =>
			typeof window !== "undefined" &&
			!!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches,
		[],
	)

	const seriesList = useMemo(
		() => (blocks.length ? buildSeries(blocks, domain[0], domain[1], 240, showDerivative) : []),
		[blocks, domain, showDerivative],
	)
	const main = seriesList[0]?.data ?? []
	const derivative = showDerivative ? seriesList[1]?.data ?? [] : []

	const { fn } = useMemo(() => compose(blocks), [blocks])
	const integral = useMemo(
		() => (blocks.length ? simpsonIntegral(fn, domain[0], domain[1]) : Number.NaN),
		[blocks.length, fn, domain],
	)

	/* Don vi truc y tu dong theo min/max du lieu, chen them 8% hai dau. */
	const yScale = useMemo(() => {
		const ys = [...main, ...derivative].map((point) => point.y).filter(Number.isFinite)
		if (!ys.length) return { min: -1, max: 1 }
		let min = Math.min(...ys)
		let max = Math.max(...ys)
		if (max - min < 1e-9) {
			min -= 1
			max += 1
		}
		const pad = (max - min) * 0.08
		return { min: min - pad, max: max + pad }
	}, [main, derivative])

	const xSpan = domain[1] - domain[0] || 1
	const toPx = (x) => PAD + ((x - domain[0]) / xSpan) * (W - PAD * 2)
	const toPy = (y) => H - PAD - ((y - yScale.min) / (yScale.max - yScale.min || 1)) * (H - PAD * 2)

	const mainSegments = useMemo(
		() => toSegments(main, toPx, toPy, H - PAD * 2),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[main, yScale, domain],
	)
	const derivativeSegments = useMemo(
		() => toSegments(derivative, toPx, toPy, H - PAD * 2),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[derivative, yScale, domain],
	)

	/* Con tro chay: vong rAF rieng, clamp delta de tab an ko nhay; chi chay khi playing.
	   Tich luy thoi gian va cap nhat state ~12 lan/giay de giam re-render. */
	useEffect(() => {
		if (!playing || reducedMotion || !blocks.length) return
		let last = performance.now()
		let acc = 0
		let raf = requestAnimationFrame(function step(now) {
			const delta = Math.min(0.1, (now - last) / 1000)
			last = now
			acc += delta
			if (acc >= 0.08) {
				const advance = acc
				acc = 0
				setT((prev) => (prev + advance / SWEEP_SECONDS) % 1)
			}
			raf = requestAnimationFrame(step)
		})
		return () => cancelAnimationFrame(raf)
	}, [playing, reducedMotion, blocks.length])

	/* Nghe lenh reset toan cuc (phim R hoac nut ↺). */
	useEffect(() => {
		const onReset = () => setT(0)
		window.addEventListener("scilab:reset-time", onReset)
		return () => window.removeEventListener("scilab:reset-time", onReset)
	}, [])

	const cursorX = domain[0] + t * xSpan
	const cursorY = fn(cursorX)
	const cursorPx = toPx(cursorX)
	const cursorDotY = Number.isFinite(cursorY) ? clamp(toPy(cursorY), PAD, H - PAD) : null

	const reading = blocks.length ? evaluateAt(blocks, cursorX) : null
	const slope = blocks.length ? numericDerivative(fn, cursorX) : Number.NaN

	const hover = hoverIndex !== null && main.length ? main[clamp(hoverIndex, 0, main.length - 1)] : null
	const hoverPx = hover ? toPx(hover.x) : 0
	const hoverPy = hover ? clamp(toPy(hover.y), PAD, H - PAD) : 0
	const leftPct = (hoverPx / W) * 100
	const topPct = clamp((hoverPy / H) * 100, 12, 88)
	const flip = leftPct > 70

	const xTicks = Array.from({ length: 7 }, (_, i) => domain[0] + (xSpan * i) / 6)
	const yTicks = Array.from({ length: 6 }, (_, i) => yScale.min + ((yScale.max - yScale.min) * i) / 5)

	const gridColor = theme === "dark" ? "#1e293b" : "#e2e8f0"
	const axisColor = theme === "dark" ? "#64748b" : "#94a3b8"
	const dotRing = theme === "dark" ? "#0f172a" : "#ffffff"
	const yAxisPx = clamp(toPx(0), PAD, W - PAD)
	const xAxisPy = clamp(toPy(0), PAD, H - PAD)

	const handlePointerMove = (event) => {
		if (!main.length || !svgRef.current) return
		const rect = svgRef.current.getBoundingClientRect()
		if (!rect.width) return
		const px = ((event.clientX - rect.left) / rect.width) * W
		const xData = domain[0] + ((px - PAD) / (W - PAD * 2)) * xSpan
		setHoverIndex(nearestIndex(main, xData))
	}

	const handleKeyDown = (event) => {
		if (!main.length) return
		if (event.key === "Escape") {
			setHoverIndex(null)
			return
		}
		if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
		event.preventDefault()
		const current = hoverIndex ?? nearestIndex(main, cursorX)
		const next =
			event.key === "Home"
				? 0
				: event.key === "End"
					? main.length - 1
					: clamp(current + (event.key === "ArrowRight" ? 1 : -1), 0, main.length - 1)
		setHoverIndex(next)
	}

	/* Chua co khoi nao: trang thai trong, khong ve do thi. */
	if (!blocks.length) {
		return (
			<section className="card flex min-h-48 flex-col items-center justify-center gap-1 text-center">
				<p className="text-3xl">📐</p>
				<p className="text-sm text-slate-500 dark:text-slate-400">
					Bấm khối hàm bên trái để bắt đầu — thử sin + x² !
				</p>
			</section>
		)
	}

	return (
		<section className="card" aria-label="Đồ thị hàm tổng">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Đồ thị hàm tổng</h2>
				<div className="flex items-center gap-1.5">
					<button
						type="button"
						className={`chip cursor-pointer select-none ${
							showDerivative ? "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300" : ""
						}`}
						aria-pressed={showDerivative}
						title="Bật / tắt đường đạo hàm y′"
						onClick={() => setShowDerivative((prev) => !prev)}
					>
						y′ đạo hàm
					</button>
					<button
						type="button"
						className="btn px-2.5 py-1.5"
						aria-pressed={playing}
						title={playing ? "Tạm dừng con trỏ (Space)" : "Chạy con trỏ (Space)"}
						onClick={() => setPlaying(!playing)}
					>
						{playing ? "⏸" : "▶"}
					</button>
					<button
						type="button"
						className="btn px-2.5 py-1.5"
						title="Đưa con trỏ về đầu miền (R)"
						onClick={() => window.dispatchEvent(new CustomEvent("scilab:reset-time"))}
					>
						↺
					</button>
				</div>
			</div>

			<div className="relative mt-3">
				<svg
					ref={svgRef}
					viewBox={`0 0 ${W} ${H}`}
					className="w-full touch-none select-none rounded-xl border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-950"
					tabIndex={0}
					role="img"
					aria-label={`Đồ thị hàm tổng trên miền x từ ${fmt(domain[0])} đến ${fmt(
						domain[1],
					)}; rê chuột hoặc dùng mũi tên trái/phải để đọc giá trị`}
					onPointerMove={handlePointerMove}
					onPointerLeave={() => setHoverIndex(null)}
					onPointerCancel={() => setHoverIndex(null)}
					onKeyDown={handleKeyDown}
				>
					{/* luoi nen */}
					<g stroke={gridColor} strokeWidth={1}>
						{xTicks.map((tick) => (
							<line key={`gx-${tick}`} x1={toPx(tick)} y1={PAD} x2={toPx(tick)} y2={H - PAD} />
						))}
						{yTicks.map((tick) => (
							<line key={`gy-${tick}`} x1={PAD} y1={toPy(tick)} x2={W - PAD} y2={toPy(tick)} />
						))}
					</g>
					{/* truc toa do (ke ve tai 0 neu trong khung, nguoc lai nam o bien) */}
					<g stroke={axisColor} strokeWidth={1.5}>
						<line x1={PAD} y1={xAxisPy} x2={W - PAD} y2={xAxisPy} />
						<line x1={yAxisPx} y1={PAD} x2={yAxisPx} y2={H - PAD} />
					</g>
					{/* nhan so tren truc */}
					<g className="text-slate-400" fill="currentColor" fontSize={11}>
						{xTicks.map((tick) => (
							<text key={`tx-${tick}`} x={toPx(tick)} y={H - PAD + 16} textAnchor="middle">
								{fmt(tick)}
							</text>
						))}
						{yTicks.map((tick) => (
							<text key={`ty-${tick}`} x={PAD - 6} y={toPy(tick) + 4} textAnchor="end">
								{fmt(tick)}
							</text>
						))}
					</g>
					{/* dao ham y' — net manh mau hong, tach doan tai khoang gian doan */}
					{showDerivative
						? derivativeSegments.map((points, index) => (
								<polyline
									key={`d-${index}`}
									points={points}
									fill="none"
									stroke={DERIVATIVE_COLOR}
									strokeWidth={1.5}
									strokeLinejoin="round"
								/>
							))
						: null}
					{/* ham tong — nhieu doan, dut tai tiem can (1/x) */}
					{mainSegments.map((points, index) => (
						<polyline
							key={`m-${index}`}
							points={points}
							fill="none"
							stroke={MAIN_COLOR}
							strokeWidth={2.5}
							strokeLinejoin="round"
							strokeLinecap="round"
						/>
					))}
					{/* con tro chay quet x-min -> x-max khoang 8 giay */}
					<line x1={cursorPx} y1={PAD} x2={cursorPx} y2={H - PAD} stroke={CURSOR_COLOR} strokeWidth={1.5} />
					{cursorDotY === null ? null : (
						<circle
							cx={cursorPx}
							cy={cursorDotY}
							r={4.5}
							fill={CURSOR_COLOR}
							stroke={dotRing}
							strokeWidth={1.5}
						/>
					)}
					{/* crosshair hover */}
					{hover ? (
						<g>
							<line
								className="text-slate-400"
								x1={hoverPx}
								y1={PAD}
								x2={hoverPx}
								y2={H - PAD}
								stroke="currentColor"
								strokeWidth={1}
								strokeDasharray="4 4"
							/>
							<circle cx={hoverPx} cy={hoverPy} r={5} fill={MAIN_COLOR} stroke={dotRing} strokeWidth={1.5} />
						</g>
					) : null}
				</svg>
				{/* phan doc gia tri cho may doc man hinh */}
				<span className="sr-only" aria-live="polite">
					{hover ? `x = ${fmt(hover.x)}, y = ${fmt(hover.y)}` : ""}
				</span>
				{hover ? (
					<div
						className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white/95 px-2 py-1 font-mono text-xs shadow-md dark:border-slate-700 dark:bg-slate-900/95"
						style={{
							left: `${leftPct}%`,
							top: `${topPct}%`,
							transform: flip ? "translate(calc(-100% - 8px), -50%)" : "translate(8px, -50%)",
						}}
					>
						<p>x = {fmt(hover.x)}</p>
						<p className="text-sky-600 dark:text-sky-300">y = {fmt(hover.y)}</p>
					</div>
				) : null}
			</div>

			{/* Bang gia tri tai con tro — khong aria-live (cap nhat lien tuc khi con tro chay) */}
			<div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<caption className="sr-only">Giá trị từng khối tại vị trí con trỏ</caption>
						<thead>
							<tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
								<th scope="col" className="py-1 pr-3 font-medium">
									Khối
								</th>
								<th scope="col" className="py-1 font-medium">
									Giá trị tại x = {fmt(cursorX)}
								</th>
							</tr>
						</thead>
						<tbody>
							{reading.contributions.map((row, index) => (
								<tr key={index} className="border-b border-slate-100 dark:border-slate-800/60">
									<td className="py-1 pr-3 font-mono text-xs">
										<span className={row.sign < 0 ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"}>
											{row.sign < 0 ? "−" : "+"}
										</span>{" "}
										{row.label}
									</td>
									<td className="py-1 font-mono text-xs">{row.value === null ? "—" : fmt(row.value)}</td>
								</tr>
							))}
						</tbody>
						<tfoot>
							<tr>
								<td className="py-1 pr-3 text-xs font-semibold">Tổng y</td>
								<td className="py-1 font-mono text-sm font-semibold text-sky-600 dark:text-sky-300">
									{reading.total === null ? "—" : fmt(reading.total)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
				<div className="flex flex-wrap items-start gap-1.5 sm:flex-col sm:items-end">
					<span className="chip">Con trỏ: x = {fmt(cursorX)}</span>
					<span className="chip" title="Tích phân xác định trên miền vẽ (Simpson)">
						∫ = {fmt(integral)}
					</span>
					<span className="chip" title="Đạo hàm tại vị trí con trỏ">
						y′ = {fmt(slope)}
					</span>
				</div>
			</div>
		</section>
	)
}
