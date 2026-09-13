import { PALETTES, arrow, bubble, clear, hud, label } from "../../lib/draw.js"
import { clamp } from "../../lib/utils.js"

/**
 * Man hinh mo phong hoa tren canvas: coc thuy tinh o giua, anh chat that bay
 * quanh coc, san pham hien dan trong dung dich theo vong tien trinh (~6 giay),
 * kem hieu ung theo reaction.effects (gas, flame, glow, warm, color, heat, dissolve).
 *
 * Component chiu trach nhiem vong lap rAF va truyen "frame" (du lieu thuan):
 *   {
 *     t, progress, theme,
 *     hudLines: string[],          // dong HUD goc tren trai
 *     hint: string,                // cau nhac giua canvas khi coc trong
 *     effects: string[],
 *     sprites: [{ id, img, color, count, role: "reactant" | "extra" }],
 *     products: [{ id, img, color, count }],
 *     solution: { to: "#hex", shift: boolean } | null,
 *   }
 * File nay khong dung React de test va tai su dung duoc doc lap.
 */

/* ---------- cache anh chat: preload mot lan, dung chung giua cac canvas ---------- */

const imageCache = new Map()

function loadImage(src) {
	if (!src) return null
	let entry = imageCache.get(src)
	if (!entry) {
		const image = new Image()
		entry = { image, ok: false }
		image.onload = () => {
			entry.ok = true
		}
		image.onerror = () => {
			entry.ok = false
		}
		image.src = src
		imageCache.set(src, entry)
	}
	return entry.ok ? entry.image : null
}

/* ---------- bo sinh "ngau nhien" xac dinh: cung (seed, index, salt) cho cung gia tri ---------- */

function seedOf(text) {
	let seed = 0
	for (const ch of String(text)) seed = (seed * 31 + ch.codePointAt(0)) >>> 0
	return seed
}

function rand01(seed, index, salt = 0) {
	let h = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(salt + 7, 0x85ebca6b)) >>> 0
	h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0
	h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0
	return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/* ---------- tien ich mau ---------- */

function hexToRgb(hex) {
	const value = String(hex ?? "#94a3b8").replace("#", "")
	const full = value.length === 3 ? value.replace(/./g, (ch) => ch + ch) : value
	const num = Number.parseInt(full, 16)
	if (!Number.isFinite(num)) return [148, 163, 184]
	return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function mixRgb(from, to, ratio) {
	return from.map((value, index) => Math.round(value + (to[index] - value) * ratio))
}

const cssRgb = (rgb) => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`

/** Trung binh mau cac chat tham gia, pha loang voi trang de gan mau dung dich. */
function solutionBase(colors) {
	const list = colors.length ? colors : ["#94a3b8"]
	const sum = [0, 0, 0]
	for (const color of list) {
		const rgb = hexToRgb(color)
		sum[0] += rgb[0]
		sum[1] += rgb[1]
		sum[2] += rgb[2]
	}
	return sum.map((value) => Math.round(value / list.length + (255 - value / list.length) * 0.45))
}

const smooth = (progress) => progress * progress * (3 - 2 * progress)

export function createChemScene(canvas) {
	const ctx = canvas.getContext("2d")
	const scene = { ctx, W: 0, H: 0, palette: PALETTES.dark }
	let lastFrame = null

	function resize() {
		const dpr = Math.min(2, window.devicePixelRatio || 1)
		scene.W = canvas.clientWidth || 600
		scene.H = canvas.clientHeight || 360
		canvas.width = Math.round(scene.W * dpr)
		canvas.height = Math.round(scene.H * dpr)
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
	}

	function setFrame(frame) {
		if (!frame) return
		lastFrame = frame
		if (canvas.clientWidth !== scene.W || canvas.clientHeight !== scene.H) resize()
		scene.palette = PALETTES[frame.theme] ?? PALETTES.dark
		draw(frame)
	}

	function destroy() {
		if (observer) observer.disconnect()
		lastFrame = null
	}

	const observer =
		typeof ResizeObserver !== "undefined"
			? new ResizeObserver(() => {
					if (lastFrame) setFrame(lastFrame)
				})
			: null
	if (observer) observer.observe(canvas)

	/* ---------- hinh hoc ---------- */

	/** Duong chu nhat bo 4 goc (tu viet de chay moi trinh duyet). */
	function roundedPath(x, y, w, h, r) {
		const radius = Math.min(r, w / 2, h / 2)
		ctx.beginPath()
		ctx.moveTo(x + radius, y)
		ctx.lineTo(x + w - radius, y)
		ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
		ctx.lineTo(x + w, y + h - radius)
		ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
		ctx.lineTo(x + radius, y + h)
		ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
		ctx.lineTo(x, y + radius)
		ctx.quadraticCurveTo(x, y, x + radius, y)
		ctx.closePath()
	}

	/** Mot chat duoc ve la hinh tron: anh that neu load xong, nguoc lai to mau chat. */
	function drawSprite(sprite, x, y, size, alpha) {
		if (size <= 1 || alpha <= 0.02) return
		const r = size / 2
		ctx.save()
		ctx.globalAlpha = clamp(alpha, 0, 1)
		ctx.beginPath()
		ctx.arc(x, y, r, 0, Math.PI * 2)
		ctx.clip()
		const image = loadImage(sprite.img)
		if (image) ctx.drawImage(image, x - r, y - r, size, size)
		else {
			ctx.fillStyle = sprite.color || "#94a3b8"
			ctx.fillRect(x - r, y - r, size, size)
		}
		ctx.restore()
		ctx.save()
		ctx.globalAlpha = clamp(alpha, 0, 1) * 0.7
		ctx.strokeStyle = scene.palette.muted
		ctx.lineWidth = 1.5
		ctx.beginPath()
		ctx.arc(x, y, r, 0, Math.PI * 2)
		ctx.stroke()
		ctx.restore()
	}

	/** Xep count diem vao mot vung theo luoi co do lech xac dinh theo (id, index). */
	function layout(id, count, salt, x0, y0, x1, y1) {
		const seed = seedOf(id)
		const w = Math.max(1, x1 - x0)
		const h = Math.max(1, y1 - y0)
		const cols = Math.max(1, Math.min(count, Math.round(Math.sqrt((count * w) / h)) || 1))
		const rows = Math.ceil(count / cols)
		const spots = []
		for (let i = 0; i < count; i += 1) {
			const col = i % cols
			const row = Math.floor(i / cols)
			spots.push({
				x: x0 + (col + 0.5) * (w / cols) + (rand01(seed, i, salt) - 0.5) * (w / cols) * 0.7,
				y: y0 + (row + 0.5) * (h / rows) + (rand01(seed, i, salt + 1) - 0.5) * (h / rows) * 0.7,
				phase: rand01(seed, i, salt + 2) * Math.PI * 2,
				scale: 0.85 + rand01(seed, i, salt + 3) * 0.35,
			})
		}
		return spots
	}

	function draw(frame) {
		const { W, H, palette } = scene
		const t = Number.isFinite(frame.t) ? frame.t : 0
		const p = clamp(Number.isFinite(frame.progress) ? frame.progress : 0, 0, 1)
		clear(scene)

		const cupW = clamp(W * 0.38, 150, 250)
		const cupH = clamp(H * 0.5, 130, 210)
		const cx = W / 2
		const cupLeft = cx - cupW / 2
		const cupRight = cx + cupW / 2
		const cupTop = H * 0.36
		const cupBottom = cupTop + cupH
		const liquidTop = cupTop + cupH * 0.24

		/* Mau dung dich: trung binh mau chat tham gia; effects "color" thi chuyen dan sang mau san pham chinh. */
		const reactantColors = (frame.sprites ?? [])
			.filter((sprite) => sprite.role === "reactant")
			.map((sprite) => sprite.color)
		const base = solutionBase(reactantColors)
		const target = frame.solution?.shift ? hexToRgb(frame.solution.to) : base
		const liquid = mixRgb(base, target, smooth(p))

		/* Anh sang am (glow) ve truoc coc */
		if (frame.effects?.includes("glow")) {
			const pulse = 0.5 + 0.5 * Math.sin(t * 2.1)
			const gy = cupTop + cupH * 0.35
			const radius = cupW * 0.95
			const glow = ctx.createRadialGradient(cx, gy, 8, cx, gy, radius)
			glow.addColorStop(0, `rgba(251, 191, 36, ${0.14 + 0.12 * pulse})`)
			glow.addColorStop(1, "rgba(251, 191, 36, 0)")
			ctx.save()
			ctx.fillStyle = glow
			ctx.fillRect(cx - radius, gy - radius, radius * 2, radius * 2)
			ctx.restore()
		}

		/* Bong do duoi day coc */
		ctx.save()
		ctx.globalAlpha = 0.25
		ctx.fillStyle = palette.muted
		ctx.beginPath()
		ctx.ellipse(cx, cupBottom + 10, cupW * 0.55, 8, 0, 0, Math.PI * 2)
		ctx.fill()
		ctx.restore()

		/* Than dung dich + be mat */
		ctx.save()
		ctx.globalAlpha = 0.62
		ctx.fillStyle = cssRgb(liquid)
		roundedPath(cupLeft + 3, liquidTop, cupW - 6, cupBottom - liquidTop - 3, 16)
		ctx.fill()
		ctx.restore()
		ctx.save()
		ctx.globalAlpha = 0.3
		ctx.strokeStyle = "#ffffff"
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.ellipse(cx, liquidTop + 1, cupW / 2 - 6, 5, 0, 0, Math.PI * 2)
		ctx.stroke()
		ctx.restore()

		/* Hat tan (dissolve): nho dan va dam xuong day */
		if (frame.effects?.includes("dissolve")) {
			const depth = Math.max(24, cupBottom - liquidTop - 30)
			ctx.save()
			for (let i = 0; i < 9; i += 1) {
				const px = cupLeft + 14 + rand01(91, i, 21) * (cupW - 28)
				const py = clamp(liquidTop + 10 + rand01(91, i, 22) * depth + p * 16, liquidTop + 6, cupBottom - 10)
				const r = (1 - p * 0.9) * (1.6 + 2.4 * rand01(91, i, 23))
				if (r <= 0.4) continue
				ctx.globalAlpha = 0.5 * (1 - p * 0.7)
				ctx.fillStyle = palette.muted
				ctx.beginPath()
				ctx.arc(px, py, r, 0, Math.PI * 2)
				ctx.fill()
			}
			ctx.restore()
		}

		/* San pham hien dan trong dung dich */
		for (const product of frame.products ?? []) {
			const spots = layout(product.id, product.count, 40, cupLeft + 14, liquidTop + 12, cupRight - 14, cupBottom - 12)
			const alpha = smooth(p)
			spots.forEach((spot) => {
				const x = spot.x + Math.cos(t * 0.9 + spot.phase) * 1.5
				const y = spot.y + Math.sin(t * 1.2 + spot.phase) * 2
				drawSprite(product, x, y, 22 * spot.scale, alpha)
			})
		}

		/* Hop coc thuy tinh + vet sang ben thanh */
		ctx.save()
		ctx.strokeStyle = palette.text
		ctx.globalAlpha = 0.5
		ctx.lineWidth = 3
		roundedPath(cupLeft, cupTop, cupW, cupH, 18)
		ctx.stroke()
		ctx.beginPath()
		ctx.ellipse(cx, cupTop, cupW / 2, 7, 0, 0, Math.PI * 2)
		ctx.stroke()
		ctx.globalAlpha = 0.16
		ctx.strokeStyle = "#f1f5f9"
		ctx.lineWidth = 5
		ctx.beginPath()
		ctx.moveTo(cupLeft + 9, cupTop + 20)
		ctx.quadraticCurveTo(cupLeft + 4, (cupTop + cupBottom) / 2, cupLeft + 9, cupBottom - 22)
		ctx.stroke()
		ctx.restore()

		/* Chat trong coc: chat phan ung mo dan theo tien trinh, chat ngoai phan ung giu nguyen */
		for (const sprite of frame.sprites ?? []) {
			const spots = layout(sprite.id, sprite.count, 7, cupLeft - 8, cupTop - 58, cupRight + 8, liquidTop + 26)
			const baseAlpha = sprite.role === "reactant" ? 1 - 0.85 * smooth(p) : 0.95
			spots.forEach((spot) => {
				const x = spot.x + Math.cos(t * 1.1 + spot.phase) * 3
				const y = spot.y + Math.sin(t * 1.6 + spot.phase) * 4
				drawSprite(sprite, x, y, 26 * spot.scale, baseAlpha)
			})
		}

		/* Bot khi (gas) noi tu be mat dung dich len tren mieng coc */
		if (frame.effects?.includes("gas")) {
			const count = Math.round(4 + 9 * p)
			const riseTop = cupTop - 40
			const span = Math.max(60, liquidTop - riseTop)
			for (let i = 0; i < count; i += 1) {
				const phase = rand01(77, i, 5)
				const speed = 22 + phase * 26
				const travel = (t * speed + phase * 90) % span
				const bx = cupLeft + 12 + phase * (cupW - 24) + Math.sin(t * 2.4 + i) * 4
				const by = liquidTop - travel
				ctx.save()
				ctx.globalAlpha = (0.25 + 0.6 * p) * clamp((by - riseTop) / 50, 0.15, 1)
				bubble(scene, bx, by, 1.5 + 3 * phase, palette.text)
				ctx.restore()
			}
		}

		/* Lua (flame) chop tren mieng coc */
		if (frame.effects?.includes("flame")) {
			for (let i = 0; i < 4; i += 1) {
				const fx = cupLeft + cupW * (0.18 + (0.64 * i) / 3)
				const flicker = 0.78 + 0.16 * Math.sin(t * 11 + i * 1.9) + 0.06 * Math.sin(t * 23 + i)
				const h = (15 + 12 * rand01(55, i, 9)) * flicker * (0.35 + 0.65 * p)
				const sway = Math.sin(t * 6 + i * 1.3) * 3
				const half = 5 + 3 * rand01(55, i, 10)
				const gradient = ctx.createLinearGradient(fx, cupTop, fx, cupTop - h)
				gradient.addColorStop(0, "#f97316")
				gradient.addColorStop(1, "#fbbf24")
				ctx.save()
				ctx.globalAlpha = 0.85
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.moveTo(fx - half, cupTop)
				ctx.quadraticCurveTo(fx - half, cupTop - h * 0.45, fx + sway, cupTop - h)
				ctx.quadraticCurveTo(fx + half, cupTop - h * 0.45, fx + half, cupTop)
				ctx.closePath()
				ctx.fill()
				ctx.globalAlpha = 0.9
				ctx.fillStyle = "#fde68a"
				ctx.beginPath()
				ctx.ellipse(fx + sway * 0.4, cupTop - h * 0.28, half * 0.45, Math.max(1.5, h * 0.3), 0, 0, Math.PI * 2)
				ctx.fill()
				ctx.restore()
			}
		}

		/* Song nhiet (warm) mong nhap nhay phia tren coc */
		if (frame.effects?.includes("warm")) {
			ctx.save()
			ctx.globalAlpha = 0.15 + 0.12 * p
			ctx.strokeStyle = palette.warn
			ctx.lineWidth = 2
			for (let k = 0; k < 3; k += 1) {
				const bx = cx + (k - 1) * cupW * 0.3
				ctx.beginPath()
				for (let y = cupTop + 4; y > cupTop - 52; y -= 4) {
					const x = bx + Math.sin(y * 0.16 + t * 3.2 + k * 1.4) * 4
					if (y === cupTop + 4) ctx.moveTo(x, y)
					else ctx.lineTo(x, y)
				}
				ctx.stroke()
			}
			ctx.restore()
		}

		/* Thu nhiet (heat): pha do am cot dung dich + mui ten nhiet chui vao coc */
		if (frame.effects?.includes("heat")) {
			ctx.save()
			ctx.globalAlpha = 0.08 + 0.1 * p
			ctx.fillStyle = "#ef4444"
			roundedPath(cupLeft + 3, liquidTop, cupW - 6, cupBottom - liquidTop - 3, 16)
			ctx.fill()
			ctx.restore()
			const ay = (liquidTop + cupBottom) / 2
			const ax = Math.max(16, cupLeft - 62)
			arrow(scene, ax, ay, cupLeft - 8, ay, palette.danger)
			label(scene, "nhiệt", ax, ay - 24, { color: palette.danger })
		}

		hud(scene, frame.hudLines ?? [])
		if (frame.hint) {
			label(scene, frame.hint, cx, H * 0.12, {
				align: "center",
				color: palette.muted,
				font: "14px ui-sans-serif, system-ui, sans-serif",
			})
		}
	}

	return { setFrame, destroy }
}
