import { useEffect, useRef, useState } from "react"
import GraphPanel from "./GraphPanel.jsx"
import { BLOCK_TYPES, clampParams, getBlockType } from "./blocks.js"
import { buildSeries, formulaText } from "./composer.js"
import { downloadBlob, fmt, toCsvMany, toNumber } from "../../lib/utils.js"

const MAX_BLOCKS = 12

/* ---------- o number kieu draft: giu chuoi dang go, chi commit khi parse duoc so ---------- */

function NumberDraft({ value, min, max, step, label, onCommit }) {
	const [draft, setDraft] = useState(() => String(value))

	/* Dong bo lai draft khi gia tri thay doi tu ben ngoai (random, slider, hash...) */
	useEffect(() => {
		if (toNumber(draft, Number.NaN) !== value) setDraft(String(value))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	const handleChange = (raw) => {
		setDraft(raw)
		const parsed = toNumber(raw, Number.NaN)
		if (Number.isFinite(parsed)) onCommit(parsed)
	}

	return (
		<input
			type="number"
			className="w-20 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right font-mono text-sm text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
			value={draft}
			min={min}
			max={max}
			step={step}
			aria-label={label}
			onChange={(event) => handleChange(event.target.value)}
			onBlur={() => setDraft(String(value))}
		/>
	)
}

/* ---------- mot hang tham so: ten + gia tri fmt + slider + o number ---------- */

function ParamRow({ blockLabel, param, value, onCommit }) {
	return (
		<div className="flex items-center gap-2">
			<span className="w-24 shrink-0 text-xs text-slate-600 dark:text-slate-300">{param.label}</span>
			<span className="w-12 shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">{fmt(value)}</span>
			<input
				type="range"
				className="min-w-20 flex-1"
				min={param.min}
				max={param.max}
				step={param.step}
				value={value}
				aria-label={`${param.label} của khối ${blockLabel}`}
				onChange={(event) => onCommit(toNumber(event.target.value, param.default))}
			/>
			<NumberDraft
				value={value}
				min={param.min}
				max={param.max}
				step={param.step}
				label={`${param.label} của khối ${blockLabel}`}
				onCommit={onCommit}
			/>
		</div>
	)
}

/* ---------- card mot khoi da them vao cong thuc ---------- */

function BlockCard({ block, index, total, onParam, onToggleSign, onMove, onRemove }) {
	const type = getBlockType(block.typeId)
	if (!type) return null
	const params = clampParams(type, block.params)
	return (
		<article className="card p-3">
			<div className="flex flex-wrap items-center gap-2">
				<button
					type="button"
					className={`btn h-9 w-9 shrink-0 px-0 font-mono text-base ${
						block.sign < 0
							? "border-amber-400 bg-amber-50 text-amber-600 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
							: ""
					}`}
					aria-pressed={block.sign < 0}
					title="Đổi dấu"
					onClick={() => onToggleSign(block.uid)}
				>
					{block.sign < 0 ? "−" : "+"}
				</button>
				<span className="font-mono text-lg font-semibold text-sky-600 dark:text-sky-300">
					{type.formula(params)}
				</span>
				<span className="text-xs text-slate-500 dark:text-slate-400">{type.name}</span>
				<div className="ml-auto flex items-center gap-1">
					<button
						type="button"
						className="btn px-2 py-1 text-xs"
						disabled={index === 0}
						title="Chuyển khối lên trên"
						onClick={() => onMove(block.uid, -1)}
					>
						↑
					</button>
					<button
						type="button"
						className="btn px-2 py-1 text-xs"
						disabled={index === total - 1}
						title="Chuyển khối xuống dưới"
						onClick={() => onMove(block.uid, 1)}
					>
						↓
					</button>
					<button
						type="button"
						className="btn px-2 py-1 text-xs hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-500 dark:hover:text-rose-300"
						title="Bỏ khối ra khỏi công thức"
						onClick={() => onRemove(block.uid)}
					>
						✕
					</button>
				</div>
			</div>
			<div className="mt-2 space-y-1.5">
				{type.params.map((param) => (
					<ParamRow
						key={param.key}
						blockLabel={type.label}
						param={param}
						value={params[param.key]}
						onCommit={(raw) => onParam(block.uid, param.key, raw)}
					/>
				))}
			</div>
		</article>
	)
}

/* ---------- man hinh chinh: palette + cong thuc + stack + mien ve + do thi ---------- */

export default function MathLab({ app }) {
	const {
		mathBlocks,
		addBlock,
		updateParam,
		toggleSign,
		removeBlock,
		moveBlock,
		clearBlocks,
		mathDomain,
		setMathDomainValue,
		playing,
		setPlaying,
		theme,
	} = app

	const [copied, setCopied] = useState(false)
	const copyTimer = useRef(null)

	/* Xoa timer flash khi tháo component */
	useEffect(() => () => clearTimeout(copyTimer.current), [])

	const full = mathBlocks.length >= MAX_BLOCKS

	/* Random tham so moi khoi trong khoang hop le, lan luot theo buoc step */
	const randomizeAll = () => {
		for (const block of mathBlocks) {
			const type = getBlockType(block.typeId)
			if (!type) continue
			for (const param of type.params) {
				const steps = Math.round((param.max - param.min) / param.step)
				const raw = param.min + Math.round(Math.random() * steps) * param.step
				updateParam(block.uid, param.key, Number(raw.toFixed(4)))
			}
		}
	}

	const copyUrl = async () => {
		const url = window.location.href
		try {
			if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url)
			else throw new Error("khong co clipboard api")
		} catch {
			const area = document.createElement("textarea")
			area.value = url
			area.style.position = "fixed"
			area.style.opacity = "0"
			document.body.appendChild(area)
			area.select()
			try {
				document.execCommand("copy")
			} catch {
				/* trinh duyet chan copy */
			}
			document.body.removeChild(area)
		}
		setCopied(true)
		clearTimeout(copyTimer.current)
		copyTimer.current = setTimeout(() => setCopied(false), 1600)
	}

	const exportCsv = () => {
		const csv = toCsvMany(buildSeries(mathBlocks, mathDomain[0], mathDomain[1], 240, true))
		downloadBlob(csv, "ham-so.csv", "text/csv;charset=utf-8")
	}

	return (
		<section aria-label="Xây hàm số" className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
			{/* Palette khoi ham — tren mobile nam sau do thi */}
			<aside className="order-2 xl:order-1 xl:sticky xl:top-20">
				<section className="card">
					<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Khối hàm</h2>
					<p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Bấm khối để thêm vào công thức</p>
					<div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-1">
						{BLOCK_TYPES.map((type) => (
							<button
								key={type.id}
								type="button"
								className="btn h-auto items-start justify-start gap-2 px-2.5 py-2 text-left"
								disabled={full}
								title={full ? "Tối đa 12 khối" : `Thêm khối ${type.name}`}
								onClick={() => addBlock(type.id)}
							>
								<span className="w-12 shrink-0 text-center font-mono text-base font-bold text-sky-600 dark:text-sky-300">
									{type.label}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-xs font-semibold">{type.name}</span>
									<span className="block truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
										{type.description}
									</span>
								</span>
							</button>
						))}
					</div>
					<p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
						Đang dùng {mathBlocks.length}/{MAX_BLOCKS} khối
					</p>
				</section>
			</aside>

			<div className="order-1 min-w-0 space-y-4 xl:order-2">
				{/* Cong thuc hien tai + hanh dong */}
				<section className="card" aria-label="Công thức hiện tại">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<p className="min-w-0 flex-1 break-words font-mono text-xl font-semibold text-sky-600 dark:text-sky-300 sm:text-2xl">
							y = {formulaText(mathBlocks)}
						</p>
						<span className="chip shrink-0">
							{mathBlocks.length}/{MAX_BLOCKS} khối
						</span>
					</div>
					<div className="mt-3 flex flex-wrap gap-1.5">
						<button
							type="button"
							className="btn"
							disabled={!mathBlocks.length}
							title="Ngẫu nhiên hoá tham số mọi khối"
							onClick={randomizeAll}
						>
							🎲 Ngẫu nhiên
						</button>
						<button
							type="button"
							className="btn hover:border-rose-400 hover:text-rose-500 dark:hover:border-rose-500 dark:hover:text-rose-300"
							disabled={!mathBlocks.length}
							onClick={clearBlocks}
						>
							🗑 Xóa hết
						</button>
						<button
							type="button"
							className="btn"
							title="Sao chép đường dẫn chia sẻ công thức hiện tại"
							onClick={copyUrl}
						>
							{copied ? "✓ Đã sao chép" : "🔗 Chia sẻ"}
						</button>
						<button
							type="button"
							className="btn"
							disabled={!mathBlocks.length}
							title="Tải bảng giá trị hàm và đạo hàm (CSV)"
							onClick={exportCsv}
						>
							⬇️ CSV
						</button>
					</div>
				</section>

				{/* Stack khoi da them */}
				<section aria-label="Các khối trong công thức" className="space-y-2">
					{mathBlocks.length === 0 ? (
						<p className="card text-sm text-slate-500 dark:text-slate-400">
							Chưa có khối nào — bấm một khối hàm để thêm vào công thức.
						</p>
					) : (
						mathBlocks.map((block, index) => (
							<BlockCard
								key={block.uid}
								block={block}
								index={index}
								total={mathBlocks.length}
								onParam={updateParam}
								onToggleSign={toggleSign}
								onMove={moveBlock}
								onRemove={removeBlock}
							/>
						))
					)}
				</section>

				{/* Mien ve */}
				<section className="card" aria-label="Miền vẽ">
					<div className="flex flex-wrap items-baseline justify-between gap-2">
						<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Miền vẽ</h2>
						<p className="font-mono text-xs text-slate-500 dark:text-slate-400">
							x ∈ [{fmt(mathDomain[0])}; {fmt(mathDomain[1])}]
						</p>
					</div>
					<div className="mt-3 space-y-2">
						<div className="flex items-center gap-2">
							<span className="w-12 shrink-0 text-xs text-slate-600 dark:text-slate-300">x-min</span>
							<input
								type="range"
								className="min-w-20 flex-1"
								min={-50}
								max={0}
								step={0.5}
								value={mathDomain[0]}
								aria-label="Giới hạn dưới của miền vẽ"
								onChange={(event) => setMathDomainValue(0, toNumber(event.target.value, mathDomain[0]))}
							/>
							<NumberDraft
								value={mathDomain[0]}
								min={-50}
								max={0}
								step={0.5}
								label="Giới hạn dưới của miền vẽ"
								onCommit={(raw) => setMathDomainValue(0, raw)}
							/>
						</div>
						<div className="flex items-center gap-2">
							<span className="w-12 shrink-0 text-xs text-slate-600 dark:text-slate-300">x-max</span>
							<input
								type="range"
								className="min-w-20 flex-1"
								min={0.5}
								max={50}
								step={0.5}
								value={mathDomain[1]}
								aria-label="Giới hạn trên của miền vẽ"
								onChange={(event) => setMathDomainValue(1, toNumber(event.target.value, mathDomain[1]))}
							/>
							<NumberDraft
								value={mathDomain[1]}
								min={0.5}
								max={50}
								step={0.5}
								label="Giới hạn trên của miền vẽ"
								onCommit={(raw) => setMathDomainValue(1, raw)}
							/>
						</div>
					</div>
				</section>

				{/* Do thi */}
				<GraphPanel
					blocks={mathBlocks}
					domain={mathDomain}
					playing={playing}
					setPlaying={setPlaying}
					theme={theme}
				/>
			</div>
		</section>
	)
}
