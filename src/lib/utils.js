export const GRAVITY = 9.81

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function toNumber(value, fallback = 0) {
	const parsed =
		typeof value === "number"
			? value
			: Number.parseFloat(String(value ?? "").replace(",", "."))
	return Number.isFinite(parsed) ? parsed : fallback
}

const VI_NUMBER = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 })

/** Dinh dang so kieu Viet Nam (dau phay thap phan); so rat to/nho thi dung mu 10. */
export function fmt(value, digits = 3) {
	if (value === null || value === undefined || !Number.isFinite(value)) return "—"
	if (value === 0) return "0"
	const abs = Math.abs(value)
	if (abs >= 1e6 || abs < 1e-4) return value.toExponential(2).replace(".", ",")
	if (digits === 3) return VI_NUMBER.format(value)
	return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value)
}

export function linspace(from, to, count) {
	const n = Math.max(2, Math.round(count))
	return Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1))
}

export function series(label, data, options = {}) {
	return {
		label,
		data,
		xLabel: options.xLabel ?? "x",
		yLabel: options.yLabel ?? label,
		color: options.color,
	}
}

export function metric(label, value, unit = "", hint = "") {
	return { label, value, unit, hint }
}

export function toCsv(serie) {
	const header = `${serie.xLabel},${serie.yLabel}`
	const rows = serie.data.map((point) => `${point.x},${point.y}`)
	return [header, ...rows].join("\n")
}

/** Nhieu serie cung truc hoanh x thanh mot file CSV (cot x chung + moi serie mot cot y). */
export function toCsvMany(seriesList) {
	const xs = [...new Set(seriesList.flatMap((serie) => serie.data.map((point) => point.x)))].sort(
		(a, b) => a - b,
	)
	const lookup = (serie) => {
		const map = new Map(serie.data.map((point) => [point.x, point.y]))
		return (x) => (map.has(x) ? map.get(x) : "")
	}
	const header = ["x", ...seriesList.map((serie) => serie.yLabel)].join(",")
	const rows = xs.map((x) => [x, ...seriesList.map((serie) => lookup(serie)(x))].join(","))
	return [header, ...rows].join("\n")
}

export function downloadBlob(content, filename, mime = "text/plain;charset=utf-8") {
	if (typeof document === "undefined") return
	const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	document.body.removeChild(link)
	setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Bo sinh so ngau nhien tuyen tinh, cung seed cho cung ket qua. */
export function makeRng(seed) {
	let state = Math.abs(Math.trunc(seed)) % 4294967296 || 1
	return () => {
		state = (state * 1664525 + 1013904223) % 4294967296
		return state / 4294967296
	}
}

const SUBSCRIPTS = { 0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉" }

export const subscriptDigits = (text) => String(text).replace(/\d/g, (d) => SUBSCRIPTS[d])

/** Hien thi cong thuc dep: chi so dung sau chu cai thanh subscript (2H2O -> 2H₂O). */
export function prettyFormula(formula) {
	return String(formula ?? "")
		.replace(/([A-Za-z)])(\d+)/g, (_, letter, digits) => letter + subscriptDigits(digits))
		.replace(/->/g, "→")
}

export const isFinitePoint = (point) =>
	point !== null && point !== undefined && Number.isFinite(point.x) && Number.isFinite(point.y)

/** Sinh day diem (x, y) cho do thi, bo diem khong hop le (x=0 cua 1/x...). */
export function samplePoints(fn, from, to, count = 200) {
	const xs = linspace(from, to, count)
	const points = []
	for (const x of xs) {
		let y
		try {
			y = fn(x)
		} catch {
			y = Number.NaN
		}
		if (Number.isFinite(y)) points.push({ x: Number(x.toFixed(6)), y: Number(y.toFixed(6)) })
	}
	return points
}
