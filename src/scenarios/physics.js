import { arrow, ball, clear, ground, hud, label, path } from "../lib/draw.js"
import { GRAVITY, fmt, linspace, metric, series } from "../lib/utils.js"

export const PHYSICS_SCENARIOS = [
	{
		id: "phys-newton",
		subject: "physics",
		title: "Định luật II Newton",
		subtitle: "Lực kéo, ma sát và gia tốc",
		formula: "a = (F - μmg) / m",
		tags: ["động lực học", "ma sát"],
		theory:
			"Hợp lực tác dụng lên vật bằng khối lượng nhân gia tốc. Khi lực kéo chưa thắng được ma sát, vật đứng yên; vượt qua ngưỡng đó vật chuyển động nhanh dần đều.",
		inputs: [
			{ key: "mass", label: "Khối lượng", unit: "kg", min: 0.5, max: 50, step: 0.5, default: 5 },
			{ key: "force", label: "Lực kéo", unit: "N", min: 0, max: 300, step: 1, default: 40 },
			{ key: "friction", label: "Hệ số ma sát", unit: "", min: 0, max: 1, step: 0.01, default: 0.2 },
			{ key: "time", label: "Thời gian", unit: "s", min: 0.5, max: 20, step: 0.5, default: 5 },
		],
		compute(v) {
			const weight = v.mass * GRAVITY
			const frictionForce = v.friction * weight
			const net = Math.max(0, v.force - frictionForce)
			const a = net / v.mass
			const vFinal = a * v.time
			const distance = 0.5 * a * v.time * v.time
			const times = linspace(0, v.time, 40)
			return {
				a,
				vFinal,
				distance,
				frictionForce,
				moving: net > 0,
				metrics: [
					metric("Gia tốc", fmt(a), "m/s²", "a = F_hop / m"),
					metric("Lực ma sát", fmt(frictionForce), "N", "μ·m·g"),
					metric("Hợp lực", fmt(net), "N"),
					metric("Tốc độ cuối", fmt(vFinal), "m/s"),
					metric("Quãng đường", fmt(distance), "m"),
					metric("Công của lực kéo", fmt(v.force * distance), "J"),
				],
				series: [
					series("Tốc độ v(t)", times.map((t) => ({ x: Number(t.toFixed(2)), y: Number((a * t).toFixed(3)) })), {
						xLabel: "t (s)",
						yLabel: "v (m/s)",
					}),
					series("Quãng đường s(t)", times.map((t) => ({ x: Number(t.toFixed(2)), y: Number((0.5 * a * t * t).toFixed(3)) })), {
						xLabel: "t (s)",
						yLabel: "s (m)",
					}),
				],
			}
		},
		draw(scene) {
			const { W, H, t, v, r, palette } = scene
			clear(scene)
			const baseY = H - 90
			ground(scene, baseY + 30)
			const loop = r.a > 0 ? (t % 4) : 0
			const travelled = 0.5 * r.a * loop * loop
			const x = 90 + ((travelled * 12) % (W - 220))
			scene.ctx.fillStyle = palette.accent
			scene.ctx.fillRect(x - 30, baseY - 30, 60, 60)
			arrow(scene, x + 30, baseY, x + 30 + Math.min(120, v.force), baseY, palette.warn)
			if (r.frictionForce > 0) {
				arrow(scene, x - 30, baseY + 16, x - 30 - Math.min(90, r.frictionForce), baseY + 16, palette.danger)
			}
			label(scene, "F", x + 40 + Math.min(120, v.force), baseY - 20, { color: palette.warn })
			hud(scene, [
				"Định luật II Newton",
				`a = ${fmt(r.a)} m/s²`,
				`v = ${fmt(r.a * loop)} m/s`,
				r.moving ? "Vật đang chuyển động" : "Lực chưa thắng ma sát",
			])
		},
		explain(v, r) {
			return r.moving
				? `Lực kéo ${fmt(v.force)} N trừ ma sát ${fmt(r.frictionForce)} N cho hợp lực ${fmt(v.force - r.frictionForce)} N, chia cho ${fmt(v.mass)} kg được gia tốc ${fmt(r.a)} m/s². Sau ${fmt(v.time)} s vật đạt ${fmt(r.vFinal)} m/s và đi được ${fmt(r.distance)} m.`
				: `Lực kéo ${fmt(v.force)} N nhỏ hơn ma sát ${fmt(r.frictionForce)} N nên vật vẫn đứng yên. Hãy tăng lực hoặc giảm hệ số ma sát.`
		},
	},
	{
		id: "phys-freefall",
		subject: "physics",
		title: "Rơi tự do",
		subtitle: "Thời gian rơi và tốc độ chạm đất",
		formula: "t = √(2h/g), v = √(2gh)",
		tags: ["cơ học", "năng lượng"],
		theory:
			"Bỏ qua lực cản không khí, mọi vật rơi với cùng gia tốc g. Thời gian rơi không phụ thuộc khối lượng, nhưng động năng khi chạm đất thì có.",
		inputs: [
			{ key: "height", label: "Độ cao", unit: "m", min: 1, max: 200, step: 1, default: 20 },
			{ key: "gravity", label: "Gia tốc trọng trường", unit: "m/s²", min: 1.6, max: 25, step: 0.1, default: 9.81 },
			{ key: "mass", label: "Khối lượng", unit: "kg", min: 0.1, max: 20, step: 0.1, default: 1 },
		],
		compute(v) {
			const time = Math.sqrt((2 * v.height) / v.gravity)
			const vFinal = Math.sqrt(2 * v.gravity * v.height)
			const energy = v.mass * v.gravity * v.height
			const times = linspace(0, time, 40)
			return {
				time,
				vFinal,
				energy,
				metrics: [
					metric("Thời gian rơi", fmt(time), "s"),
					metric("Tốc độ chạm đất", fmt(vFinal), "m/s", `${fmt(vFinal * 3.6)} km/h`),
					metric("Thế năng ban đầu", fmt(energy), "J", "mgh"),
					metric("Động năng khi chạm", fmt(0.5 * v.mass * vFinal * vFinal), "J"),
				],
				series: [
					series(
						"Độ cao y(t)",
						times.map((t) => ({
							x: Number(t.toFixed(2)),
							y: Number(Math.max(0, v.height - 0.5 * v.gravity * t * t).toFixed(3)),
						})),
						{ xLabel: "t (s)", yLabel: "y (m)" },
					),
					series("Tốc độ v(t)", times.map((t) => ({ x: Number(t.toFixed(2)), y: Number((v.gravity * t).toFixed(3)) })), {
						xLabel: "t (s)",
						yLabel: "v (m/s)",
					}),
				],
			}
		},
		draw(scene) {
			const { W, H, t, v, r, palette } = scene
			clear(scene)
			const top = 50
			const baseY = H - 60
			ground(scene, baseY)
			const cycle = r.time > 0 ? t % (r.time + 0.6) : 0
			const fall = Math.min(v.height, 0.5 * v.gravity * cycle * cycle)
			const y = top + ((baseY - top) * fall) / v.height
			ball(scene, W / 2, y, 16, palette.accent)
			arrow(scene, W / 2 + 40, y, W / 2 + 40, Math.min(baseY - 5, y + 50), palette.warn)
			label(scene, `h = ${fmt(v.height - fall)} m`, W / 2 + 70, y - 8, { color: palette.muted })
			hud(scene, [
				"Rơi tự do",
				`t = ${fmt(Math.min(cycle, r.time))} s`,
				`v = ${fmt(Math.min(v.gravity * cycle, r.vFinal))} m/s`,
				`g = ${fmt(v.gravity)} m/s²`,
			])
		},
		explain(v, r) {
			return `Từ độ cao ${fmt(v.height)} m với g = ${fmt(v.gravity)} m/s², vật rơi trong ${fmt(r.time)} s và chạm đất ở ${fmt(r.vFinal)} m/s (≈ ${fmt(r.vFinal * 3.6)} km/h). Thế năng ${fmt(r.energy)} J chuyển gần như toàn bộ thành động năng. Đổi khối lượng không làm đổi thời gian rơi.`
		},
	},
	{
		id: "phys-projectile",
		subject: "physics",
		title: "Ném xéo",
		subtitle: "Tầm xa, độ cao cực đại",
		formula: "R = v₀²sin(2θ)/g",
		tags: ["chuyển động ném", "quỹ đạo"],
		theory:
			"Chuyển động ném xéo tách thành phương ngang đều và phương thẳng đứng biến đổi đều. Góc 45° cho tầm xa lớn nhất khi bỏ qua lực cản.",
		inputs: [
			{ key: "v0", label: "Tốc độ ban đầu", unit: "m/s", min: 1, max: 80, step: 1, default: 20 },
			{ key: "angle", label: "Góc ném", unit: "°", min: 1, max: 89, step: 1, default: 45 },
			{ key: "gravity", label: "Gia tốc trọng trường", unit: "m/s²", min: 1.6, max: 25, step: 0.1, default: 9.81 },
		],
		compute(v) {
			const rad = (v.angle * Math.PI) / 180
			const vx = v.v0 * Math.cos(rad)
			const vy = v.v0 * Math.sin(rad)
			const flight = (2 * vy) / v.gravity
			const range = (v.v0 * v.v0 * Math.sin(2 * rad)) / v.gravity
			const hMax = (vy * vy) / (2 * v.gravity)
			const times = linspace(0, flight, 50)
			const trajectory = times.map((t) => ({
				x: Number((vx * t).toFixed(3)),
				y: Number(Math.max(0, vy * t - 0.5 * v.gravity * t * t).toFixed(3)),
			}))
			return {
				vx,
				vy,
				flight,
				range,
				hMax,
				trajectory,
				metrics: [
					metric("Tầm xa", fmt(range), "m"),
					metric("Độ cao cực đại", fmt(hMax), "m"),
					metric("Thời gian bay", fmt(flight), "s"),
					metric("v ngang", fmt(vx), "m/s"),
					metric("v đứng ban đầu", fmt(vy), "m/s"),
				],
				series: [
					series("Quỹ đạo y(x)", trajectory, { xLabel: "x (m)", yLabel: "y (m)" }),
					series(
						"Độ cao y(t)",
						times.map((t) => ({
							x: Number(t.toFixed(2)),
							y: Number(Math.max(0, vy * t - 0.5 * v.gravity * t * t).toFixed(3)),
						})),
						{ xLabel: "t (s)", yLabel: "y (m)" },
					),
				],
			}
		},
		draw(scene) {
			const { W, H, t, r, palette } = scene
			clear(scene)
			const baseY = H - 60
			ground(scene, baseY)
			const scaleX = (W - 120) / Math.max(1, r.range)
			const scaleY = (baseY - 70) / Math.max(1, r.hMax)
			const points = r.trajectory.map((point) => ({
				x: 60 + point.x * scaleX,
				y: baseY - point.y * scaleY,
			}))
			path(scene, points, palette.grid, 2)
			const cycle = r.flight > 0 ? t % (r.flight + 0.5) : 0
			const progress = Math.min(1, cycle / Math.max(0.001, r.flight))
			const index = Math.min(points.length - 1, Math.floor(progress * (points.length - 1)))
			const current = points[index]
			path(scene, points.slice(0, index + 1), palette.accent, 3)
			ball(scene, current.x, current.y, 10, palette.warn)
			hud(scene, [
				"Ném xéo",
				`Tầm xa ${fmt(r.range)} m`,
				`H_max ${fmt(r.hMax)} m`,
				`t bay ${fmt(r.flight)} s`,
			])
		},
		explain(v, r) {
			return `Với v₀ = ${fmt(v.v0)} m/s ở góc ${fmt(v.angle)}°, vận tốc tách thành ${fmt(r.vx)} m/s ngang và ${fmt(r.vy)} m/s đứng. Vật bay ${fmt(r.flight)} s, lên cao ${fmt(r.hMax)} m và đáp cách điểm ném ${fmt(r.range)} m. Thử góc 45° để thấy tầm xa lớn nhất.`
		},
	},
	{
		id: "phys-pendulum",
		subject: "physics",
		title: "Con lắc đơn",
		subtitle: "Chu kỳ dao động nhỏ",
		formula: "T = 2π√(L/g)",
		tags: ["dao động", "chu kỳ"],
		theory:
			"Với biên độ nhỏ, chu kỳ con lắc đơn chỉ phụ thuộc chiều dài dây và gia tốc trọng trường, không phụ thuộc khối lượng vật nặng.",
		inputs: [
			{ key: "length", label: "Chiều dài dây", unit: "m", min: 0.1, max: 5, step: 0.05, default: 1 },
			{ key: "gravity", label: "Gia tốc trọng trường", unit: "m/s²", min: 1.6, max: 25, step: 0.1, default: 9.81 },
			{ key: "amplitude", label: "Biên độ góc", unit: "°", min: 1, max: 45, step: 1, default: 15 },
		],
		compute(v) {
			const period = 2 * Math.PI * Math.sqrt(v.length / v.gravity)
			const freq = 1 / period
			const amp = (v.amplitude * Math.PI) / 180
			const vMax = amp * Math.sqrt(v.gravity * v.length)
			const times = linspace(0, period * 2, 60)
			return {
				period,
				freq,
				amp,
				vMax,
				metrics: [
					metric("Chu kỳ", fmt(period), "s"),
					metric("Tần số", fmt(freq), "Hz"),
					metric("Tốc độ cực đại", fmt(vMax), "m/s"),
					metric("Số dao động/phút", fmt(60 * freq), "lần"),
				],
				series: [
					series(
						"Góc lệch θ(t)",
						times.map((t) => ({
							x: Number(t.toFixed(2)),
							y: Number((v.amplitude * Math.cos((2 * Math.PI * t) / period)).toFixed(3)),
						})),
						{ xLabel: "t (s)", yLabel: "θ (°)" },
					),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, v, r, palette } = scene
			clear(scene)
			const pivotX = W / 2
			const pivotY = 60
			const lengthPx = Math.min(H - 140, 60 + v.length * 90)
			const theta = r.amp * Math.cos((2 * Math.PI * t) / r.period)
			const x = pivotX + lengthPx * Math.sin(theta)
			const y = pivotY + lengthPx * Math.cos(theta)
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(pivotX, pivotY)
			ctx.lineTo(x, y)
			ctx.stroke()
			ball(scene, pivotX, pivotY, 5, palette.muted)
			ball(scene, x, y, 18, palette.accent)
			hud(scene, [
				"Con lắc đơn",
				`T = ${fmt(r.period)} s`,
				`θ = ${fmt((theta * 180) / Math.PI)}°`,
				`L = ${fmt(v.length)} m`,
			])
		},
		explain(v, r) {
			return `Dây dài ${fmt(v.length)} m trong trường g = ${fmt(v.gravity)} m/s² cho chu kỳ ${fmt(r.period)} s (${fmt(r.freq)} Hz). Khối lượng vật nặng không ảnh hưởng; muốn dao động chậm hơn thì làm dây dài hơn.`
		},
	},
	{
		id: "phys-spring",
		subject: "physics",
		title: "Dao động lò xo",
		subtitle: "Hệ vật – lò xo điều hòa",
		formula: "T = 2π√(m/k)",
		tags: ["dao động", "năng lượng"],
		theory:
			"Lực đàn hồi tỉ lệ với độ biến dạng (định luật Hooke) tạo dao động điều hòa. Cơ năng bảo toàn, chuyển qua lại giữa thế năng đàn hồi và động năng.",
		inputs: [
			{ key: "mass", label: "Khối lượng", unit: "kg", min: 0.1, max: 10, step: 0.1, default: 1 },
			{ key: "k", label: "Độ cứng lò xo", unit: "N/m", min: 1, max: 200, step: 1, default: 40 },
			{ key: "amplitude", label: "Biên độ", unit: "cm", min: 1, max: 20, step: 0.5, default: 6 },
		],
		compute(v) {
			const omega = Math.sqrt(v.k / v.mass)
			const period = (2 * Math.PI) / omega
			const ampM = v.amplitude / 100
			const energy = 0.5 * v.k * ampM * ampM
			const vMax = omega * ampM
			const times = linspace(0, period * 2, 60)
			return {
				omega,
				period,
				energy,
				vMax,
				ampM,
				metrics: [
					metric("Chu kỳ", fmt(period), "s"),
					metric("Tần số góc", fmt(omega), "rad/s"),
					metric("Tốc độ cực đại", fmt(vMax), "m/s"),
					metric("Cơ năng", fmt(energy), "J"),
					metric("Gia tốc cực đại", fmt(omega * omega * ampM), "m/s²"),
				],
				series: [
					series(
						"Li độ x(t)",
						times.map((t) => ({
							x: Number(t.toFixed(2)),
							y: Number((v.amplitude * Math.cos(omega * t)).toFixed(3)),
						})),
						{ xLabel: "t (s)", yLabel: "x (cm)" },
					),
					series(
						"Tốc độ v(t)",
						times.map((t) => ({
							x: Number(t.toFixed(2)),
							y: Number((-vMax * Math.sin(omega * t)).toFixed(3)),
						})),
						{ xLabel: "t (s)", yLabel: "v (m/s)" },
					),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, v, r, palette } = scene
			clear(scene)
			const cy = H / 2
			const anchorX = 70
			const x = W / 2 + v.amplitude * 6 * Math.cos(r.omega * t)
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(anchorX, cy - 40)
			ctx.lineTo(anchorX, cy + 40)
			ctx.stroke()
			const coils = 14
			ctx.strokeStyle = palette.accent2
			ctx.beginPath()
			ctx.moveTo(anchorX, cy)
			for (let i = 1; i <= coils; i += 1) {
				const px = anchorX + ((x - anchorX) * i) / coils
				const py = cy + (i % 2 === 0 ? -14 : 14)
				ctx.lineTo(px, py)
			}
			ctx.lineTo(x, cy)
			ctx.stroke()
			ctx.fillStyle = palette.accent
			ctx.fillRect(x, cy - 26, 52, 52)
			hud(scene, [
				"Dao động lò xo",
				`T = ${fmt(r.period)} s`,
				`x = ${fmt(v.amplitude * Math.cos(r.omega * t))} cm`,
				`Cơ năng ${fmt(r.energy)} J`,
			])
		},
		explain(v, r) {
			return `Vật ${fmt(v.mass)} kg trên lò xo ${fmt(v.k)} N/m dao động với chu kỳ ${fmt(r.period)} s. Biên độ ${fmt(v.amplitude)} cm cho cơ năng ${fmt(r.energy)} J và tốc độ cực đại ${fmt(r.vMax)} m/s tại vị trí cân bằng.`
		},
	},
	{
		id: "phys-ohm",
		subject: "physics",
		title: "Định luật Ohm",
		subtitle: "Dòng điện, công suất và điện năng",
		formula: "I = U/R, P = UI",
		tags: ["điện học", "công suất"],
		theory:
			"Cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở. Nhân công suất với thời gian ta được điện năng tiêu thụ (kWh trên hóa đơn điện).",
		inputs: [
			{ key: "voltage", label: "Hiệu điện thế", unit: "V", min: 1, max: 240, step: 1, default: 12 },
			{ key: "resistance", label: "Điện trở", unit: "Ω", min: 0.5, max: 500, step: 0.5, default: 6 },
			{ key: "hours", label: "Thời gian dùng", unit: "h", min: 0.5, max: 24, step: 0.5, default: 2 },
		],
		compute(v) {
			const I = v.voltage / v.resistance
			const P = v.voltage * I
			const energyKwh = (P * v.hours) / 1000
			const voltages = linspace(0, v.voltage, 30)
			return {
				I,
				P,
				energyKwh,
				metrics: [
					metric("Cường độ dòng điện", fmt(I), "A"),
					metric("Công suất", fmt(P), "W"),
					metric("Điện năng", fmt(energyKwh), "kWh", `trong ${fmt(v.hours)} giờ`),
					metric("Nhiệt lượng Joule", fmt(P * v.hours * 3600), "J"),
				],
				series: [
					series("I theo U", voltages.map((u) => ({ x: Number(u.toFixed(2)), y: Number((u / v.resistance).toFixed(4)) })), {
						xLabel: "U (V)",
						yLabel: "I (A)",
					}),
					series("P theo U", voltages.map((u) => ({ x: Number(u.toFixed(2)), y: Number(((u * u) / v.resistance).toFixed(4)) })), {
						xLabel: "U (V)",
						yLabel: "P (W)",
					}),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, v, r, palette } = scene
			clear(scene)
			const left = 80
			const right = W - 80
			const top = 90
			const bottom = H - 90
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 3
			ctx.strokeRect(left, top, right - left, bottom - top)
			ctx.fillStyle = palette.bg
			ctx.fillRect(W / 2 - 40, top - 12, 80, 24)
			ctx.strokeStyle = palette.warn
			ctx.strokeRect(W / 2 - 40, top - 12, 80, 24)
			label(scene, `${fmt(v.resistance)} Ω`, W / 2, top - 34, { align: "center", color: palette.warn })
			label(scene, `${fmt(v.voltage)} V`, left - 12, (top + bottom) / 2, { align: "right", color: palette.accent })

			const count = 18
			const speed = Math.min(2.5, 0.3 + r.I * 0.25)
			for (let i = 0; i < count; i += 1) {
				const p = ((i / count + t * speed * 0.12) % 1) * 2 * ((right - left) + (bottom - top))
				let x = left
				let y = top
				const wSide = right - left
				const hSide = bottom - top
				if (p < wSide) {
					x = left + p
					y = top
				} else if (p < wSide + hSide) {
					x = right
					y = top + (p - wSide)
				} else if (p < 2 * wSide + hSide) {
					x = right - (p - wSide - hSide)
					y = bottom
				} else {
					x = left
					y = bottom - (p - 2 * wSide - hSide)
				}
				ball(scene, x, y, 5, palette.accent2)
			}
			hud(scene, ["Định luật Ohm", `I = ${fmt(r.I)} A`, `P = ${fmt(r.P)} W`, `${fmt(r.energyKwh)} kWh`])
		},
		explain(v, r) {
			return `U = ${fmt(v.voltage)} V trên R = ${fmt(v.resistance)} Ω cho I = ${fmt(r.I)} A và công suất ${fmt(r.P)} W. Dùng ${fmt(v.hours)} giờ sẽ tiêu thụ ${fmt(r.energyKwh)} kWh. Tăng điện trở sẽ làm dòng giảm theo tỉ lệ nghịch.`
		},
	},
	{
		id: "phys-wave",
		subject: "physics",
		title: "Sóng cơ",
		subtitle: "Tần số, bước sóng, tốc độ",
		formula: "v = λf",
		tags: ["sóng", "âm học"],
		theory:
			"Tốc độ truyền sóng bằng bước sóng nhân tần số. Trong cùng một môi trường, tần số càng cao thì bước sóng càng ngắn.",
		inputs: [
			{ key: "amplitude", label: "Biên độ", unit: "cm", min: 1, max: 20, step: 0.5, default: 8 },
			{ key: "frequency", label: "Tần số", unit: "Hz", min: 0.2, max: 20, step: 0.1, default: 2 },
			{ key: "speed", label: "Tốc độ truyền", unit: "m/s", min: 1, max: 400, step: 1, default: 340 },
		],
		compute(v) {
			const wavelength = v.speed / v.frequency
			const period = 1 / v.frequency
			const omega = 2 * Math.PI * v.frequency
			const times = linspace(0, period * 2, 60)
			const positions = linspace(0, wavelength * 2, 60)
			return {
				wavelength,
				period,
				omega,
				metrics: [
					metric("Bước sóng", fmt(wavelength), "m"),
					metric("Chu kỳ", fmt(period), "s"),
					metric("Tần số góc", fmt(omega), "rad/s"),
					metric("Số sóng", fmt((2 * Math.PI) / wavelength), "rad/m"),
				],
				series: [
					series(
						"Li độ theo thời gian",
						times.map((t) => ({ x: Number(t.toFixed(3)), y: Number((v.amplitude * Math.sin(omega * t)).toFixed(3)) })),
						{ xLabel: "t (s)", yLabel: "u (cm)" },
					),
					series(
						"Hình dạng sóng",
						positions.map((x) => ({
							x: Number(x.toFixed(3)),
							y: Number((v.amplitude * Math.sin((2 * Math.PI * x) / wavelength)).toFixed(3)),
						})),
						{ xLabel: "x (m)", yLabel: "u (cm)" },
					),
				],
			}
		},
		draw(scene) {
			const { W, H, t, v, r, palette } = scene
			clear(scene)
			const cy = H / 2
			const points = []
			for (let px = 20; px <= W - 20; px += 4) {
				const phase = (px / 60) - v.frequency * t
				points.push({ x: px, y: cy + v.amplitude * 4 * Math.sin(phase * 2) })
			}
			path(scene, points, palette.accent, 3)
			for (let i = 0; i < points.length; i += 12) {
				ball(scene, points[i].x, points[i].y, 4, palette.accent2)
			}
			hud(scene, ["Sóng cơ", `λ = ${fmt(r.wavelength)} m`, `f = ${fmt(v.frequency)} Hz`, `v = ${fmt(v.speed)} m/s`])
		},
		explain(v, r) {
			return `Sóng tần số ${fmt(v.frequency)} Hz truyền với ${fmt(v.speed)} m/s có bước sóng ${fmt(r.wavelength)} m và chu kỳ ${fmt(r.period)} s. Giữ tốc độ môi trường không đổi, tăng tần số sẽ làm bước sóng ngắn lại.`
		},
	},
]
