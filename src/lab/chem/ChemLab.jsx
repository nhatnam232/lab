import { useEffect, useMemo, useRef, useState } from "react"
import { analyzeMix } from "./engine.js"
import { CATEGORIES, getSubstance, massOf, withImages } from "./substances.js"
import { createChemScene } from "./chemScene.js"
import { clamp, downloadBlob, fmt, prettyFormula, toCsv, toNumber } from "../../lib/utils.js"

const LOOP_SECONDS = 6
const AI_ENABLED = Boolean(import.meta.env.VITE_CLAUDE_API_KEY)

/* ---------- tien ich ---------- */

const CATEGORY_LABELS = new Map(CATEGORIES.map((item) => [item.id, item.label]))

/** Bo dau tieng Viet de tim kiem khong dau (đ -> d, ơ/ư -> o/u...). */
function normalize(text) {
	return String(text ?? "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.replace(/Đ/g, "D")
		.toLowerCase()
}

const spriteCount = (moles) => clamp(Math.round(toNumber(moles, 1)), 1, 10)

/** Dung khung hinh (du lieu thuan) cho chemScene ve canvas. */
function buildFrame(analysis, mix, theme, byId) {
	const reaction = analysis.selected
	const result = analysis.result
	const reactantIds = new Set(reaction?.reactants.map((item) => item.id) ?? [])

	const sprites = Object.entries(mix)
		.map(([id, moles]) => {
			const substance = byId.get(id)
			if (!substance) return null
			return {
				id,
				img: substance.img,
				color: substance.color,
				count: spriteCount(moles),
				role: reactantIds.has(id) ? "reactant" : "extra",
			}
		})
		.filter(Boolean)

	const products = (reaction?.products ?? []).map((item) => {
		const substance = byId.get(item.id)
		const produced = result?.produced.find((entry) => entry.id === item.id)
		return {
			id: item.id,
			img: substance?.img ?? null,
			color: substance?.color ?? "#94a3b8",
			count: spriteCount(produced?.moles ?? 0),
		}
	})

	const hudLines = []
	if (reaction && result) {
		hudLines.push(result.equation)
		hudLines.push(
			`Chất giới hạn: ${result.totalInput === 0 ? "—" : getSubstance(result.limiting)?.name ?? result.limiting}`,
		)
		hudLines.push(
			result.totalInput === 0
				? "Nhiệt: —"
				: `Nhiệt: ${result.heat >= 0 ? "+" : "−"}${fmt(Math.abs(result.heat))} kJ (${result.heat >= 0 ? "tỏa" : "thu"} nhiệt)`,
		)
	} else if (sprites.length) {
		hudLines.push(
			analysis.suggestions.length
				? "Chưa ghép đủ phản ứng — xem gợi ý bên dưới"
				: "Chưa có phản ứng với các chất này — thử thêm chất khác",
		)
	} else {
		hudLines.push("Cốc trống")
	}

	return {
		theme,
		hudLines,
		hint: sprites.length || reaction ? "" : "Cho chất vào cốc để mô phỏng phản ứng",
		effects: reaction?.effects ?? [],
		sprites,
		products,
		solution: reaction
			? {
					to: byId.get(reaction.products[0]?.id)?.color ?? "#94a3b8",
					shift: (reaction.effects ?? []).includes("color"),
				}
			: null,
	}
}

function canvasAriaLabel(analysis, mixCount) {
	const { result } = analysis
	if (!result) {
		return mixCount ? "Cốc chứa chất nhưng chưa ghép đủ phản ứng" : "Cốc trống, chưa có chất"
	}
	const limiting = result.totalInput === 0 ? "chưa xác định" : getSubstance(result.limiting)?.name ?? result.limiting
	const heat = result.totalInput === 0
		? "chưa tính được nhiệt"
		: `${result.heat >= 0 ? "tỏa" : "thu"} ${fmt(Math.abs(result.heat))} kJ`
	return `Mô phỏng phản ứng ${result.equation}; chất giới hạn ${limiting}; ${heat}`
}

/* ---------- tro ly AI (chi hien khi co key) + loi giai tu tao ---------- */

function localSummary(result) {
	if (result.totalInput === 0) return "Cốc chưa có chất nên chưa xảy ra phản ứng — hãy thêm chất rồi thử lại."
	const limitingName = getSubstance(result.limiting)?.name ?? result.limiting ?? "—"
	const products = result.produced
		.map((item) => `${item.name} ${fmt(item.moles)} mol (≈ ${fmt(massOf(item.id, item.moles))} g)`)
		.join(", ")
	return `Phương trình: ${result.equation}. Chất giới hạn là ${limitingName} nên phản ứng chạy được ${fmt(
		result.extent,
	)} mol, tạo ra ${products || "không có sản phẩm"}. Phản ứng ${
		result.heat >= 0 ? `tỏa ${fmt(Math.abs(result.heat))} kJ` : `thu ${fmt(Math.abs(result.heat))} kJ`
	}.`
}

function buildPrompt(result) {
	const input = result.consumed.map((item) => `${item.formula}: ${fmt(item.moles)} mol`).join("; ")
	const products = result.produced.map((item) => `${item.formula}: ${fmt(item.moles)} mol`).join("; ")
	const limiting = getSubstance(result.limiting)?.name ?? result.limiting
	return [
		`Phương trình: ${result.equation}.`,
		`Chất đầu: ${input}.`,
		`Chất giới hạn: ${limiting}. Độ tiến trình: ${fmt(result.extent)} mol.`,
		`Sản phẩm: ${products}.`,
		`Nhiệt phản ứng: ${result.heat >= 0 ? "+" : "−"}${fmt(Math.abs(result.heat))} kJ.`,
		"",
		"Bạn là trợ lý hóa học. Hãy giải thích kết quả trên cho học sinh Việt Nam trong tối đa 4 câu, tiếng Việt, giọng thân thiện, không dùng markdown.",
	].join("\n")
}

async function askClaude(prompt) {
	const response = await fetch(import.meta.env.VITE_CLAUDE_API_URL ?? "https://api.anthropic.com/v1/messages", {
		method: "POST",
		headers: {
			"content-type": "application/json",
			"x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
			"anthropic-version": "2023-06-01",
			"anthropic-dangerous-direct-browser-access": "true",
		},
		body: JSON.stringify({
			model: import.meta.env.VITE_CLAUDE_MODEL ?? "claude-3-5-haiku-latest",
			max_tokens: 400,
			messages: [{ role: "user", content: prompt }],
		}),
	})
	if (!response.ok) throw new Error(`HTTP ${response.status}`)
	const data = await response.json()
	const text = (Array.isArray(data?.content) ? data.content : [])
		.map((block) => block?.text ?? "")
		.join(" ")
		.trim()
	if (!text) throw new Error("Phan hoi trong")
	return text
}

/* ---------- anh chat: anh that neu co, nguoc lai o mau + cong thuc ---------- */

function SubThumb({ substance, size = 56 }) {
	const box = size <= 32 ? "h-8 w-8" : "h-14 w-14"
	if (substance.img) {
		return (
			<img
				src={substance.img}
				alt={substance.name}
				loading="lazy"
				width={size}
				height={size}
				className={`${box} shrink-0 rounded-xl object-cover`}
			/>
		)
	}
	return (
		<div
			aria-hidden="true"
			style={{ backgroundColor: substance.color }}
			className={`${box} flex shrink-0 items-center justify-center rounded-xl`}
		>
			<span className="rounded bg-white/75 px-1 font-mono text-[10px] font-bold text-slate-900">
				{prettyFormula(substance.formula)}
			</span>
		</div>
	)
}

/* ---------- o number kieu draft: giu chuoi dang go, khong bi snap giua chung ---------- */

function MolesField({ value, label, onCommit }) {
	const [draft, setDraft] = useState(() => String(value))
	const focusedRef = useRef(false)

	/* Chi dong bo lai draft khi dang khong focus (slider, ngau nhien, hash...) */
	useEffect(() => {
		if (!focusedRef.current) setDraft(String(value))
	}, [value])

	const handleChange = (raw) => {
		setDraft(raw)
		const parsed = toNumber(raw, Number.NaN)
		if (Number.isFinite(parsed)) onCommit(parsed)
	}

	const settle = () => {
		focusedRef.current = false
		setDraft(String(value))
	}

	return (
		<input
			type="number"
			className="w-16 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-mono text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
			value={draft}
			min={0.1}
			max={10}
			step={0.1}
			inputMode="decimal"
			aria-label={label}
			onChange={(event) => handleChange(event.target.value)}
			onFocus={() => {
				focusedRef.current = true
			}}
			onBlur={settle}
			onKeyDown={(event) => {
				if (event.key === "Enter") settle()
			}}
		/>
	)
}

/* ---------- mot hang chat trong coc: anh + slider + o number + gram ---------- */

function MixRow({ substance, moles, onMoles, onRemove }) {
	return (
		<li className="flex items-center gap-3 rounded-xl border border-slate-200 p-2 dark:border-slate-800">
			<SubThumb substance={substance} size={32} />
			<div className="min-w-0 flex-1">
				<div className="flex items-baseline justify-between gap-2">
					<p className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
						{substance.name}{" "}
						<span className="font-mono text-xs text-slate-500 dark:text-slate-400">
							{prettyFormula(substance.formula)}
						</span>
					</p>
					<button
						type="button"
						className="btn shrink-0 px-2 py-1 text-xs hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-500 dark:hover:text-rose-300"
						title={`Bỏ ${substance.name} ra khỏi cốc`}
						aria-label={`Bỏ ${substance.name} ra khỏi cốc`}
						onClick={onRemove}
					>
						✕
					</button>
				</div>
				<div className="mt-1.5 flex flex-wrap items-center gap-2">
					<input
						type="range"
						className="min-w-[120px] flex-1"
						min={0.1}
						max={10}
						step={0.1}
						value={moles}
						aria-label={`Số mol ${substance.name}`}
						onChange={(event) => onMoles(toNumber(event.target.value, moles))}
					/>
					<MolesField value={moles} label={`Số mol ${substance.name}`} onCommit={onMoles} />
					<span
						className="w-20 shrink-0 text-right font-mono text-xs text-slate-500 dark:text-slate-400"
						title="Khối lượng tương đương"
					>
						≈ {fmt(massOf(substance.id, moles))} g
					</span>
				</div>
			</div>
		</li>
	)
}

/* ---------- o metric ket qua ---------- */

function Metric({ label, value, unit = "", hint = "" }) {
	return (
		<div className="rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-slate-800 dark:bg-slate-900/40">
			<p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
			<p className="mt-0.5 break-words text-lg font-semibold text-slate-900 dark:text-slate-50">
				{value}
				{unit ? ` ${unit}` : ""}
			</p>
			{hint ? <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
		</div>
	)
}

/* ---------- do thi nho SVG cua result.series: 2 tab, hover doc gia tri, tai CSV ---------- */

const CHART_W = 320
const CHART_H = 168
/* Cap mau da kiem dinh doi san sang/toi (sky-600 / amber-700). */
const CHART_COLORS = ["#0284c7", "#b45309"]

function ProgressChart({ seriesList }) {
	const [tab, setTab] = useState(0)
	const [hoverIndex, setHoverIndex] = useState(null)
	const index = clamp(tab, 0, Math.max(0, seriesList.length - 1))
	const serie = seriesList[index]
	if (!serie) return null

	const data = serie.data
	const xs = data.map((point) => point.x)
	const ys = data.map((point) => point.y)
	const minX = Math.min(...xs)
	const maxX = Math.max(...xs)
	let minY = Math.min(...ys)
	let maxY = Math.max(...ys)
	if (maxY - minY < 1e-9) {
		minY -= 1
		maxY += 1
	}
	const padL = 46
	const padR = 12
	const padT = 16
	const padB = 26
	const toX = (x) => padL + ((x - minX) / (maxX - minX || 1)) * (CHART_W - padL - padR)
	const toY = (y) => CHART_H - padB - ((y - minY) / (maxY - minY || 1)) * (CHART_H - padT - padB)
	const points = data.map((point) => `${toX(point.x).toFixed(1)},${toY(point.y).toFixed(1)}`).join(" ")
	const color = CHART_COLORS[index % CHART_COLORS.length]
	const hover = hoverIndex !== null ? data[clamp(hoverIndex, 0, data.length - 1)] : null
	const leftPct = hover ? (toX(hover.x) / CHART_W) * 100 : 0
	const topPct = hover ? clamp((toY(hover.y) / CHART_H) * 100, 12, 88) : 0
	const flip = leftPct > 70

	const handlePointerMove = (event) => {
		const rect = event.currentTarget.getBoundingClientRect()
		if (!rect.width) return
		const px = ((event.clientX - rect.left) / rect.width) * CHART_W
		let best = 0
		for (let i = 1; i < data.length; i += 1) {
			if (Math.abs(toX(data[i].x) - px) < Math.abs(toX(data[best].x) - px)) best = i
		}
		setHoverIndex(best)
	}

	/* Ban phim: mui ten di chuyen diem doc, Home/End nhay hai dau. */
	const handleKeyDown = (event) => {
		if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return
		event.preventDefault()
		if (event.key === "Escape") {
			setHoverIndex(null)
			return
		}
		const current = hoverIndex ?? Math.floor(data.length / 2)
		const next =
			event.key === "Home"
				? 0
				: event.key === "End"
					? data.length - 1
					: clamp(current + (event.key === "ArrowRight" ? 1 : -1), 0, data.length - 1)
		setHoverIndex(next)
	}

	return (
		<section className="card" aria-label="Đồ thị tiến trình phản ứng">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">📈 Đồ thị tiến trình</h2>
				<div className="flex flex-wrap items-center gap-1.5">
					{seriesList.map((item, itemIndex) => (
						<button
							key={item.label}
							type="button"
							className={`chip cursor-pointer select-none ${itemIndex === index ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : ""}`}
							aria-pressed={itemIndex === index}
							title={item.label}
							onClick={() => {
								setTab(itemIndex)
								setHoverIndex(null)
							}}
						>
							{itemIndex === 0 ? "Sản phẩm" : "Nhiệt"}
						</button>
					))}
					<button
						type="button"
						className="btn px-2 py-1 text-xs"
						title={`Tải dữ liệu "${serie.label}" (CSV)`}
						onClick={() =>
							downloadBlob(toCsv(serie), `scilab-do-thi-${index + 1}.csv`, "text/csv;charset=utf-8")
						}
					>
						⬇️ CSV
					</button>
				</div>
			</div>
			<div className="relative mt-3">
				<svg
					viewBox={`0 0 ${CHART_W} ${CHART_H}`}
					role="img"
					tabIndex={0}
					aria-label={`${serie.label}: ${serie.yLabel} theo ${serie.xLabel}, từ ${fmt(minY)} đến ${fmt(maxY)}; dùng mũi tên trái/phải để đọc giá trị`}
					className="block w-full touch-none select-none rounded-xl border border-slate-200 bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-800 dark:bg-slate-950"
					onPointerMove={handlePointerMove}
					onPointerLeave={() => setHoverIndex(null)}
					onPointerCancel={() => setHoverIndex(null)}
					onKeyDown={handleKeyDown}
				>
					{/* luoi nen tinh kem */}
					{[0, 0.5, 1].map((ratio) => (
						<line
							key={ratio}
							className="text-slate-200 dark:text-slate-800"
							stroke="currentColor"
							strokeWidth={1}
							x1={padL}
							y1={toY(minY + (maxY - minY) * ratio)}
							x2={CHART_W - padR}
							y2={toY(minY + (maxY - minY) * ratio)}
						/>
					))}
					{/* nhan truc dung mau chu thong thuong */}
					<g className="fill-slate-500 dark:fill-slate-400" fontSize={10}>
						<text x={padL - 6} y={toY(maxY) + 4} textAnchor="end">
							{fmt(maxY)}
						</text>
						<text x={padL - 6} y={toY(minY) + 4} textAnchor="end">
							{fmt(minY)}
						</text>
						<text x={padL} y={CHART_H - 8}>
							{fmt(minX)}
						</text>
						<text x={(padL + CHART_W - padR) / 2} y={CHART_H - 8} textAnchor="middle">
							{serie.xLabel}
						</text>
						<text x={CHART_W - padR} y={CHART_H - 8} textAnchor="end">
							{fmt(maxX)}
						</text>
						<text x={padL} y={11} className="fill-slate-400">
							{serie.yLabel}
						</text>
					</g>
					<polyline
						points={points}
						fill="none"
						stroke={color}
						strokeWidth={2}
						strokeLinejoin="round"
						strokeLinecap="round"
					/>
					{hover ? (
						<g>
							<line
								className="text-slate-400"
								x1={toX(hover.x)}
								y1={padT}
								x2={toX(hover.x)}
								y2={CHART_H - padB}
								stroke="currentColor"
								strokeWidth={1}
								strokeDasharray="4 4"
							/>
							<circle
								cx={toX(hover.x)}
								cy={toY(hover.y)}
								r={4}
								fill={color}
								stroke="currentColor"
								className="text-white dark:text-slate-950"
								strokeWidth={1.5}
							/>
						</g>
					) : null}
				</svg>
				<span className="sr-only" aria-live="polite">
					{hover ? `${serie.xLabel} ${fmt(hover.x)}, ${serie.yLabel} ${fmt(hover.y)}` : ""}
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
						<p>
							{serie.xLabel} {fmt(hover.x)}
						</p>
						<p>
							{serie.yLabel} {fmt(hover.y)}
						</p>
					</div>
				) : null}
			</div>
		</section>
	)
}

/* ---------- man hinh chinh: palette chat + mo phong + chon phan ung + coc + ket qua ---------- */

export default function ChemLab({ app }) {
	const {
		chemMix,
		addSubstance,
		setMoles,
		removeSubstance,
		clearMix,
		selectedReactionId,
		selectReaction,
		playing,
		setPlaying,
		theme,
	} = app

	const [query, setQuery] = useState("")
	const [category, setCategory] = useState(null)
	const [copied, setCopied] = useState(false)
	const [aiText, setAiText] = useState("")
	const [aiNote, setAiNote] = useState("")
	const [aiLoading, setAiLoading] = useState(false)

	const canvasRef = useRef(null)
	const timeRef = useRef(0)
	const playingRef = useRef(playing)
	const frameRef = useRef(null)
	const dirtyRef = useRef(true)
	const copyTimer = useRef(null)

	const catalog = useMemo(() => withImages(), [])
	const byId = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog])
	const analysis = useMemo(() => analyzeMix(chemMix, selectedReactionId), [chemMix, selectedReactionId])
	const result = analysis.result
	const mixEntries = Object.entries(chemMix)

	const frame = useMemo(() => buildFrame(analysis, chemMix, theme, byId), [analysis, chemMix, theme, byId])
	frameRef.current = frame
	playingRef.current = playing

	/* Danh dau ve lai khi du lieu khung hinh doi — cho phep dung rAF ve that khi
	   tam dung (playing=false) ma khong mat 60 lan ve/giay. */
	useEffect(() => {
		dirtyRef.current = true
	}, [frame, playing])

	/* Vong rAF: clamp delta de tab an khong nhay, chi cong thoi gian khi playing,
	   dung yen o t=0 neu nguoi dung bat prefers-reduced-motion nhung van ve. */
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const scene = createChemScene(canvas)
		const reduced =
			typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
		const onReset = () => {
			timeRef.current = 0
			dirtyRef.current = true
		}
		window.addEventListener("scilab:reset-time", onReset)
		let raf = 0
		let last = performance.now()
		const step = (now) => {
			const delta = Math.min(0.1, (now - last) / 1000)
			last = now
			if (playingRef.current && !reduced) timeRef.current += delta
			if (playingRef.current || dirtyRef.current) {
				dirtyRef.current = false
				scene.setFrame({
					...frameRef.current,
					t: timeRef.current,
					progress: (timeRef.current % LOOP_SECONDS) / LOOP_SECONDS,
				})
			}
			raf = requestAnimationFrame(step)
		}
		raf = requestAnimationFrame(step)
		return () => {
			cancelAnimationFrame(raf)
			window.removeEventListener("scilab:reset-time", onReset)
			scene.destroy()
		}
	}, [])

	/* Xoa loi giai AI va timer flash khi thao component / doi phan ung */
	useEffect(() => {
		setAiText("")
		setAiNote("")
	}, [analysis.selected?.id, chemMix])

	useEffect(() => () => clearTimeout(copyTimer.current), [])

	/* ---------- hanh dong ---------- */

	const randomizeMoles = () => {
		for (const id of Object.keys(chemMix)) {
			setMoles(id, Number((Math.random() * 9.9 + 0.1).toFixed(1)))
		}
	}

	const copyUrl = async () => {
		const url = window.location.href
		try {
			if (!navigator.clipboard?.writeText) throw new Error("khong co clipboard api")
			await navigator.clipboard.writeText(url)
			setCopied(true)
			clearTimeout(copyTimer.current)
			copyTimer.current = setTimeout(() => setCopied(false), 2000)
		} catch {
			window.prompt("Sao chép đường dẫn chia sẻ thí nghiệm:", url)
		}
	}

	const exportPng = () => {
		const canvas = canvasRef.current
		if (!canvas) return
		try {
			const link = document.createElement("a")
			link.download = "scilab-phong-thi-nghiem.png"
			link.href = canvas.toDataURL("image/png")
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
		} catch {
			/* trinh duyet chan tai anh - bo qua */
		}
	}

	const askAi = async () => {
		if (!result || aiLoading) return
		setAiLoading(true)
		setAiNote("")
		try {
			setAiText(await askClaude(buildPrompt(result)))
		} catch {
			setAiText(localSummary(result))
			setAiNote("Không gọi được trợ lý AI — hiển thị lời giải tự tạo.")
		} finally {
			setAiLoading(false)
		}
	}

	/* ---------- loc palette ---------- */

	const normalizedQuery = normalize(query).trim()
	const visible = catalog.filter((item) => {
		if (category && item.category !== category) return false
		if (!normalizedQuery) return true
		const haystack = [item.name, item.formula, item.description, CATEGORY_LABELS.get(item.category) ?? ""]
			.map(normalize)
			.join(" ")
		return haystack.includes(normalizedQuery)
	})

	return (
		<section aria-label="Phòng thí nghiệm Hóa" className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
			{/* Palette chat — tren mobile nam sau canvas */}
			<aside className="order-2 xl:order-1 xl:sticky xl:top-20">
				<section className="card" aria-label="Bảng chất hóa học">
					<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">🧫 Bảng chất</h2>
					<input
						type="search"
						data-search
						value={query}
						placeholder="Tìm chất (tên, công thức, mô tả…)"
						aria-label="Tìm chất theo tên, công thức hoặc mô tả"
						onChange={(event) => setQuery(event.target.value)}
						className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
					/>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{CATEGORIES.map((item) => {
							const active = category === item.id
							return (
								<button
									key={item.id}
									type="button"
									aria-pressed={active}
									className={`chip cursor-pointer select-none ${active ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : ""}`}
									title={active ? `Bỏ lọc nhóm ${item.label}` : `Chỉ hiện nhóm ${item.label}`}
									onClick={() => setCategory(active ? null : item.id)}
								>
									{item.icon} {item.label}
								</button>
							)
						})}
					</div>
					<p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
						Đang hiện {visible.length}/{catalog.length} chất
					</p>
					<div className="mt-1 space-y-2 xl:max-h-[calc(100vh-330px)] xl:overflow-y-auto xl:pr-1">
						{visible.map((item) => {
							const inMix = Boolean(chemMix[item.id])
							return (
								<article
									key={item.id}
									className={`flex items-center gap-3 rounded-xl border p-2 ${
										inMix
											? "border-sky-400 dark:border-sky-600"
											: "border-slate-200 dark:border-slate-800"
									}`}
								>
									<SubThumb substance={item} />
									<div className="min-w-0 flex-1">
										<p className="font-mono text-sm font-semibold text-sky-700 dark:text-sky-300">
											{prettyFormula(item.formula)}
										</p>
										<p className="truncate text-xs font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
										<p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
									</div>
									{inMix ? (
										<span
											role="img"
											aria-label={`Đã có ${item.name} trong cốc`}
											title={`Đã có ${item.name} trong cốc`}
											className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300"
										>
											✓
										</span>
									) : (
										<button
											type="button"
											className="btn h-8 w-8 shrink-0 px-0 text-base"
											title={`Thêm ${item.name} vào cốc`}
											aria-label={`Thêm ${item.name} vào cốc`}
											onClick={() => addSubstance(item.id, 1)}
										>
											+
										</button>
									)}
								</article>
							)
						})}
						{!visible.length ? (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								Không tìm thấy chất nào khớp “{query}”.
							</p>
						) : null}
					</div>
				</section>
			</aside>

			<div className="order-1 min-w-0 space-y-4 xl:order-2">
				{/* Canvas mo phong */}
				<section className="card" aria-label="Mô phỏng cốc phản ứng">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">🎬 Mô phỏng</h2>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								className="btn px-2.5 py-1.5"
								aria-pressed={playing}
								title={playing ? "Tạm dừng mô phỏng (Space)" : "Chạy mô phỏng (Space)"}
								onClick={() => setPlaying(!playing)}
							>
								{playing ? "⏸" : "▶"}
							</button>
							<button
								type="button"
								className="btn px-2.5 py-1.5"
								title="Chạy lại phản ứng từ đầu (R)"
								onClick={() => window.dispatchEvent(new CustomEvent("scilab:reset-time"))}
							>
								↺ Làm lại
							</button>
							<button type="button" className="btn px-2.5 py-1.5" title="Tải ảnh mô phỏng (PNG)" onClick={exportPng}>
								🖼️ PNG
							</button>
						</div>
					</div>
					<canvas
						ref={canvasRef}
						role="img"
						aria-label={canvasAriaLabel(analysis, mixEntries.length)}
						className="mt-3 block h-[360px] w-full touch-none select-none rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
					/>
					<p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
						Phản ứng lặp lại mỗi {LOOP_SECONDS} giây — ảnh chất tham gia mờ dần khi bị tiêu thụ, sản phẩm hiện
						dần trong cốc.
					</p>
				</section>

				{/* Bo chon phan ung */}
				<section className="card" aria-label="Chọn phản ứng">
					<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">⚗️ Phản ứng</h2>
					{mixEntries.length === 0 ? (
						<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
							Chọn chất từ bảng chất để bắt đầu — bấm “+” trên một chất để cho vào cốc.
						</p>
					) : (
						<div className="mt-2 space-y-3">
							{analysis.candidates.length > 1 ? (
								<div className="flex flex-wrap gap-1.5">
									{analysis.candidates.map((reaction) => {
										const active = reaction.id === analysis.selected?.id
										return (
											<button
												key={reaction.id}
												type="button"
												aria-pressed={active}
												className={`chip cursor-pointer select-none text-left ${
													active ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : ""
												}`}
												title={`Chạy phản ứng ${prettyFormula(reaction.equation)}`}
												onClick={() => selectReaction(reaction.id)}
											>
												<span className="font-mono">{prettyFormula(reaction.equation)}</span> · {reaction.conditions}
											</button>
										)
									})}
								</div>
							) : null}
							{analysis.selected ? (
								<p className="break-words font-mono text-sm text-slate-700 dark:text-slate-200">
									{result.equation} <span className="chip ml-1 align-middle">{analysis.selected.conditions}</span>
								</p>
							) : (
								<p className="text-sm text-slate-500 dark:text-slate-400">Chưa ghép đủ chất cho một phản ứng.</p>
							)}
							{analysis.suggestions.length ? (
								<ul className="space-y-1">
									{analysis.suggestions.map(({ reaction, missingId }) => (
										<li key={`${reaction.id}-${missingId}`}>
											<button
												type="button"
												className="btn h-auto w-full items-start justify-start px-2.5 py-1.5 text-left text-xs"
												title={`Thêm ${getSubstance(missingId)?.name ?? missingId} vào cốc`}
												onClick={() => addSubstance(missingId, 1)}
											>
												💡 Thêm <strong>{getSubstance(missingId)?.name ?? missingId}</strong> để:{" "}
												<span className="font-mono">{prettyFormula(reaction.equation)}</span>
											</button>
										</li>
									))}
								</ul>
							) : null}
						</div>
					)}
				</section>

				{/* Coc: danh sach chat da chon */}
				<section className="card" aria-label="Cốc thí nghiệm">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
							🥤 Cốc <span className="chip ml-1 align-middle">{mixEntries.length} chất</span>
						</h2>
						<div className="flex flex-wrap gap-1.5">
							<button
								type="button"
								className="btn"
								disabled={!mixEntries.length}
								title="Ngẫu nhiên hoá số mol từng chất"
								onClick={randomizeMoles}
							>
								🎲 Ngẫu nhiên
							</button>
							<button
								type="button"
								className="btn hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-500 dark:hover:text-rose-300"
								disabled={!mixEntries.length}
								onClick={clearMix}
							>
								🗑 Xóa hết
							</button>
							<button
								type="button"
								className="btn"
								title="Sao chép đường dẫn chia sẻ thí nghiệm hiện tại"
								onClick={copyUrl}
							>
								{copied ? "✓ Đã sao chép" : "🔗 Chia sẻ"}
							</button>
						</div>
					</div>
					{mixEntries.length === 0 ? (
						<p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
							Cốc đang trống — bấm “+” vào một chất ở bảng bên trái để cho vào cốc.
						</p>
					) : (
						<ul className="mt-3 space-y-2">
							{mixEntries.map(([id, moles]) => {
								const substance = byId.get(id)
								if (!substance) return null
								return (
									<MixRow
										key={id}
										substance={substance}
										moles={moles}
										onMoles={(raw) => setMoles(id, raw)}
										onRemove={() => removeSubstance(id)}
									/>
								)
							})}
						</ul>
					)}
				</section>

				{/* Ket qua chi tiet — chi luoi metric la aria-live, khong bao tram ca cot */}
				{result ? (
					<div className="space-y-4">
						<section className="card" aria-label="Kết quả phản ứng">
							<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">📊 Kết quả</h2>
							<p className="mt-1 break-words font-mono text-lg font-semibold text-sky-600 dark:text-sky-300">
								{result.equation}
							</p>
							<div aria-live="polite" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
								<Metric
									label="Chất giới hạn"
									value={result.totalInput === 0 ? "—" : getSubstance(result.limiting)?.name ?? "—"}
									hint="Phản ứng dừng theo chất này"
								/>
								<Metric label="Độ tiến trình" value={fmt(result.extent)} unit="mol" />
								{result.produced.map((item) => (
									<Metric
										key={item.id}
										label={`Sản phẩm: ${item.name}`}
										value={fmt(item.moles)}
										unit="mol"
										hint={`≈ ${fmt(massOf(item.id, item.moles))} g`}
									/>
								))}
								{result.consumed
									.filter((item) => item.leftover > 1e-9)
									.map((item) => (
										<Metric
											key={`du-${item.id}`}
											label={`Còn dư: ${item.name}`}
											value={fmt(item.leftover)}
											unit="mol"
											hint={`≈ ${fmt(massOf(item.id, item.leftover))} g`}
										/>
									))}
								<Metric
									label="Nhiệt phản ứng"
									value={
										result.totalInput === 0
											? "—"
											: `${result.heat >= 0 ? "+" : "−"}${fmt(Math.abs(result.heat))}`
									}
									unit={result.totalInput === 0 ? "" : "kJ"}
									hint={
										result.totalInput === 0
											? ""
											: `${result.heat >= 0 ? "tỏa nhiệt" : "thu nhiệt"} · ΔH° 25 °C`
									}
								/>
								{result.environment ? (
									<Metric label="Môi trường sau phản ứng" value={result.environment.label} hint={`pH ${result.environment.ph}`} />
								) : null}
							</div>
							{AI_ENABLED ? (
								<div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
									<div className="flex flex-wrap items-center gap-2">
										<button
											type="button"
											className="btn btn-primary"
											disabled={aiLoading}
											title="Hỏi trợ lý AI giải thích kết quả"
											onClick={askAi}
										>
											{aiLoading ? "Đang hỏi…" : "✨ Hỏi AI"}
										</button>
										<span className="text-[11px] text-slate-500 dark:text-slate-400">
											Giải thích kết quả bằng vài câu thân thiện
										</span>
									</div>
									{aiText ? (
										<p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{aiText}</p>
									) : null}
									{aiNote ? (
										<p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{aiNote}</p>
									) : null}
								</div>
							) : null}
						</section>

						<section className="card" aria-label="Từng bước giải">
							<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">📝 Từng bước giải</h2>
							<ol className="mt-3 list-decimal space-y-3 pl-5">
								{result.steps.map((step, index) => (
									<li key={index}>
										<strong className="text-sm font-semibold text-slate-800 dark:text-slate-100">{step.title}</strong>
										<div className="mt-1 space-y-0.5 text-sm text-slate-600 dark:text-slate-300">
											{step.lines.map((line, lineIndex) => (
												<p key={lineIndex} className="break-words">
													{line}
												</p>
											))}
										</div>
									</li>
								))}
							</ol>
						</section>

						<section className="card" aria-label="Lý thuyết">
							<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">📚 Lý thuyết</h2>
							<p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
								{analysis.selected.note}
							</p>
							<p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
								Điều kiện: {analysis.selected.conditions}
							</p>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{analysis.selected.tags.map((tag) => (
									<span key={tag} className="chip">
										{tag}
									</span>
								))}
							</div>
						</section>

						<ProgressChart seriesList={result.series} />
					</div>
				) : null}
			</div>
		</section>
	)
}
