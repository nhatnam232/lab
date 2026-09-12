export const PALETTES = {
	dark: {
		bg: "#0f172a",
		grid: "#1e293b",
		text: "#e2e8f0",
		muted: "#94a3b8",
		accent: "#38bdf8",
		accent2: "#a3e635",
		warn: "#fbbf24",
		danger: "#f87171",
	},
	light: {
		bg: "#f1f5f9",
		grid: "#cbd5e1",
		text: "#0f172a",
		muted: "#475569",
		accent: "#0284c7",
		accent2: "#4d7c0f",
		warn: "#b45309",
		danger: "#dc2626",
	},
}

export function clear(scene) {
	const { ctx, W, H, palette } = scene
	ctx.fillStyle = palette.bg
	ctx.fillRect(0, 0, W, H)
	ctx.strokeStyle = palette.grid
	ctx.lineWidth = 1
	for (let x = 40; x < W; x += 40) {
		ctx.beginPath()
		ctx.moveTo(x, 0)
		ctx.lineTo(x, H)
		ctx.stroke()
	}
	for (let y = 40; y < H; y += 40) {
		ctx.beginPath()
		ctx.moveTo(0, y)
		ctx.lineTo(W, y)
		ctx.stroke()
	}
}

export function label(scene, text, x, y, options = {}) {
	const { ctx, palette } = scene
	ctx.save()
	ctx.fillStyle = options.color || palette.text
	ctx.font = options.font || "13px ui-sans-serif, system-ui, sans-serif"
	ctx.textAlign = options.align || "left"
	ctx.textBaseline = options.baseline || "top"
	ctx.fillText(text, x, y)
	ctx.restore()
}

export function hud(scene, lines) {
	lines.forEach((line, index) => {
		label(scene, line, 14, 14 + index * 18, {
			color: index === 0 ? scene.palette.text : scene.palette.muted,
		})
	})
}

export function ground(scene, y) {
	const { ctx, W, palette } = scene
	ctx.strokeStyle = palette.muted
	ctx.lineWidth = 2
	ctx.beginPath()
	ctx.moveTo(0, y)
	ctx.lineTo(W, y)
	ctx.stroke()
}

export function arrow(scene, x1, y1, x2, y2, color) {
	const { ctx } = scene
	const angle = Math.atan2(y2 - y1, x2 - x1)
	ctx.save()
	ctx.strokeStyle = color
	ctx.fillStyle = color
	ctx.lineWidth = 3
	ctx.beginPath()
	ctx.moveTo(x1, y1)
	ctx.lineTo(x2, y2)
	ctx.stroke()
	ctx.beginPath()
	ctx.moveTo(x2, y2)
	ctx.lineTo(x2 - 10 * Math.cos(angle - 0.4), y2 - 10 * Math.sin(angle - 0.4))
	ctx.lineTo(x2 - 10 * Math.cos(angle + 0.4), y2 - 10 * Math.sin(angle + 0.4))
	ctx.closePath()
	ctx.fill()
	ctx.restore()
}

export function ball(scene, x, y, r, color) {
	const { ctx } = scene
	ctx.save()
	ctx.fillStyle = color
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2)
	ctx.fill()
	ctx.restore()
}

export function bubble(scene, x, y, r, color) {
	const { ctx } = scene
	ctx.save()
	ctx.strokeStyle = color
	ctx.lineWidth = 2
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2)
	ctx.stroke()
	ctx.restore()
}

/** Ve mot duong cong tu danh sach diem trong khong gian canvas. */
export function path(scene, points, color, width = 2) {
	if (!points.length) return
	const { ctx } = scene
	ctx.save()
	ctx.strokeStyle = color
	ctx.lineWidth = width
	ctx.beginPath()
	ctx.moveTo(points[0].x, points[0].y)
	for (const point of points.slice(1)) ctx.lineTo(point.x, point.y)
	ctx.stroke()
	ctx.restore()
}
