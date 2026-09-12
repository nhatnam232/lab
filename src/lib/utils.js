export const GRAVITY = 9.81

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function toNumber(value, fallback = 0) {
	const parsed =
		typeof value === "number"
			? value
			: Number.parseFloat(String(value ?? "").replace(",", "."))
	return Number.isFinite(parsed) ? parsed : fallback
}

export function fmt(value, digits = 3) {
	if (value === null || value === undefined || !Number.isFinite(value)) return "—"
	if (value === 0) return "0"
	const abs = Math.abs(value)
	if (abs >= 1e6 || abs < 1e-4) return value.toExponential(2)
	return String(Number(value.toFixed(digits)))
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

export function randomBetween(min, max, step = 0.1) {
	const raw = min + Math.random() * (max - min)
	const snapped = Math.round(raw / step) * step
	return Number(clamp(snapped, min, max).toFixed(4))
}
