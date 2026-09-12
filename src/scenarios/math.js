import { ball, clear, hud, label, path } from "../lib/draw.js"
import { fmt, linspace, makeRng, metric, series } from "../lib/utils.js"

export const MATH_SCENARIOS = [
	{
		id: "math-quadratic",
		subject: "math",
		title: "Hàm số bậc hai",
		subtitle: "Parabol, nghiệm và đỉnh",
		formula: "y = ax² + bx + c, Δ = b² - 4ac",
		tags: ["đại số", "parabol", "nghiệm"],
		theory:
			"Dấu của biệt thức Δ quyết định số nghiệm thực: Δ > 0 có hai nghiệm, Δ = 0 có nghiệm kép, Δ < 0 vô nghiệm thực. Đỉnh parabol nằm tại x = -b/2a.",
		inputs: [
			{ key: "a", label: "Hệ số a", unit: "", min: -5, max: 5, step: 0.1, default: 1 },
			{ key: "b", label: "Hệ số b", unit: "", min: -20, max: 20, step: 0.1, default: -3 },
			{ key: "c", label: "Hệ số c", unit: "", min: -20, max: 20, step: 0.1, default: 2 },
			{ key: "range", label: "Khoảng vẽ", unit: "", min: 2, max: 20, step: 1, default: 6 },
		],
		compute(v) {
			const isLinear = Math.abs(v.a) < 1e-9
			const delta = v.b * v.b - 4 * v.a * v.c
			let roots = []
			if (isLinear) {
				if (Math.abs(v.b) > 1e-9) roots = [-v.c / v.b]
			} else if (delta >= 0) {
				const sq = Math.sqrt(delta)
				roots = [(-v.b - sq) / (2 * v.a), (-v.b + sq) / (2 * v.a)].sort((x, y) => x - y)
			}
			const vertexX = isLinear ? 0 : -v.b / (2 * v.a)
			const vertexY = v.a * vertexX * vertexX + v.b * vertexX + v.c
			const curve = linspace(-v.range, v.range, 80).map((x) => ({
				x: Number(x.toFixed(3)),
				y: Number((v.a * x * x + v.b * x + v.c).toFixed(3)),
			}))
			return {
				isLinear,
				delta,
				roots,
				vertexX,
				vertexY,
				curve,
				metrics: [
					metric("Biệt thức Δ", fmt(delta), "", delta > 0 ? "hai nghiệm" : delta === 0 ? "nghiệm kép" : "vô nghiệm thực"),
					metric("Nghiệm", roots.length ? roots.map((x) => fmt(x)).join(" ; ") : "không có", ""),
					metric("Đỉnh", isLinear ? "—" : `(${fmt(vertexX)} ; ${fmt(vertexY)})`, ""),
					metric("Bề lõm", isLinear ? "đường thẳng" : v.a > 0 ? "lên trên" : "xuống dưới", ""),
					metric("Trục đối xứng", isLinear ? "—" : `x = ${fmt(vertexX)}`, ""),
				],
				series: [series("y = f(x)", curve, { xLabel: "x", yLabel: "y" })],
			}
		},
		draw(scene) {
			const { ctx, W, H, v, r, palette } = scene
			clear(scene)
			const ys = r.curve.map((p) => p.y)
			const minY = Math.min(...ys)
			const maxY = Math.max(...ys)
			const spanY = Math.max(1e-6, maxY - minY)
			const mapX = (x) => 40 + ((x + v.range) / (2 * v.range)) * (W - 80)
			const mapY = (y) => H - 40 - ((y - minY) / spanY) * (H - 80)
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 1.5
			ctx.beginPath()
			ctx.moveTo(mapX(-v.range), mapY(0))
			ctx.lineTo(mapX(v.range), mapY(0))
			ctx.moveTo(mapX(0), 30)
			ctx.lineTo(mapX(0), H - 30)
			ctx.stroke()
			path(scene, r.curve.map((p) => ({ x: mapX(p.x), y: mapY(p.y) })), palette.accent, 3)
			for (const root of r.roots) {
				if (Math.abs(root) <= v.range) {
					ball(scene, mapX(root), mapY(0), 6, palette.warn)
					label(scene, fmt(root), mapX(root) + 8, mapY(0) + 8, { color: palette.warn })
				}
			}
			if (!r.isLinear && Math.abs(r.vertexX) <= v.range) {
				ball(scene, mapX(r.vertexX), mapY(r.vertexY), 6, palette.accent2)
			}
			hud(scene, [
				`y = ${fmt(v.a)}x² + ${fmt(v.b)}x + ${fmt(v.c)}`,
				`Δ = ${fmt(r.delta)}`,
				r.roots.length ? `Nghiệm: ${r.roots.map((x) => fmt(x)).join(" ; ")}` : "Vô nghiệm thực",
			])
		},
		explain(v, r) {
			if (r.isLinear) {
				return `Khi a = 0, đồ thị là đường thẳng y = ${fmt(v.b)}x + ${fmt(v.c)}${r.roots.length ? `, cắt trục hoành tại x = ${fmt(r.roots[0])}` : ""}.`
			}
			const rootText =
				r.roots.length === 2
					? `có hai nghiệm x₁ = ${fmt(r.roots[0])} và x₂ = ${fmt(r.roots[1])}`
					: r.roots.length === 1
						? `có nghiệm kép x = ${fmt(r.roots[0])}`
						: "phương trình vô nghiệm thực"
			return `Đồ thị là parabol bề lõm ${v.a > 0 ? "lên trên" : "xuống dưới"} với đỉnh (${fmt(r.vertexX)} ; ${fmt(r.vertexY)}). Δ = ${fmt(r.delta)} nên ${rootText}.`
		},
	},
	{
		id: "math-linear-system",
		subject: "math",
		title: "Hệ hai phương trình",
		subtitle: "Giao điểm của hai đường thẳng",
		formula: "a₁x + b₁y = c₁ ; a₂x + b₂y = c₂",
		tags: ["đại số", "hệ phương trình"],
		theory:
			"Nghiệm của hệ là giao điểm hai đường thẳng. Nếu định thức D = a₁b₂ - a₂b₁ bằng 0 thì hai đường song song (vô nghiệm) hoặc trùng nhau (vô số nghiệm).",
		inputs: [
			{ key: "a1", label: "a₁", unit: "", min: -10, max: 10, step: 0.5, default: 1 },
			{ key: "b1", label: "b₁", unit: "", min: -10, max: 10, step: 0.5, default: 1 },
			{ key: "c1", label: "c₁", unit: "", min: -20, max: 20, step: 0.5, default: 5 },
			{ key: "a2", label: "a₂", unit: "", min: -10, max: 10, step: 0.5, default: 2 },
			{ key: "b2", label: "b₂", unit: "", min: -10, max: 10, step: 0.5, default: -1 },
			{ key: "c2", label: "c₂", unit: "", min: -20, max: 20, step: 0.5, default: 1 },
		],
		compute(v) {
			const det = v.a1 * v.b2 - v.a2 * v.b1
			const hasSolution = Math.abs(det) > 1e-9
			const solution = hasSolution
				? { x: (v.c1 * v.b2 - v.c2 * v.b1) / det, y: (v.a1 * v.c2 - v.a2 * v.c1) / det }
				: null
			const xs = linspace(-10, 10, 60)
			const lineOf = (a, b, c) =>
				Math.abs(b) < 1e-9 ? [] : xs.map((x) => ({ x: Number(x.toFixed(2)), y: Number(((c - a * x) / b).toFixed(3)) }))
			const lines = [lineOf(v.a1, v.b1, v.c1), lineOf(v.a2, v.b2, v.c2)]
			return {
				det,
				hasSolution,
				solution,
				lines,
				metrics: [
					metric("Định thức D", fmt(det), "", hasSolution ? "nghiệm duy nhất" : "song song hoặc trùng nhau"),
					metric("x", hasSolution ? fmt(solution.x) : "—", ""),
					metric("y", hasSolution ? fmt(solution.y) : "—", ""),
				],
				series: [
					series("Đường thứ nhất", lines[0], { xLabel: "x", yLabel: "y" }),
					series("Đường thứ hai", lines[1], { xLabel: "x", yLabel: "y" }),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, r, palette } = scene
			clear(scene)
			const mapX = (x) => W / 2 + (x / 12) * (W / 2 - 40)
			const mapY = (y) => H / 2 - (y / 12) * (H / 2 - 40)
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 1.5
			ctx.beginPath()
			ctx.moveTo(20, mapY(0))
			ctx.lineTo(W - 20, mapY(0))
			ctx.moveTo(mapX(0), 20)
			ctx.lineTo(mapX(0), H - 20)
			ctx.stroke()
			r.lines.forEach((line, index) => {
				path(scene, line.map((p) => ({ x: mapX(p.x), y: mapY(p.y) })), index === 0 ? palette.accent : palette.accent2, 3)
			})
			if (r.solution) {
				ball(scene, mapX(r.solution.x), mapY(r.solution.y), 7, palette.warn)
				label(scene, `(${fmt(r.solution.x)} ; ${fmt(r.solution.y)})`, mapX(r.solution.x) + 10, mapY(r.solution.y) - 20, {
					color: palette.warn,
				})
			}
			hud(scene, ["Hệ hai phương trình", `D = ${fmt(r.det)}`, r.solution ? "Có nghiệm duy nhất" : "Không có nghiệm duy nhất"])
		},
		explain(v, r) {
			return r.solution
				? `Định thức D = ${fmt(r.det)} khác 0 nên hệ có nghiệm duy nhất x = ${fmt(r.solution.x)}, y = ${fmt(r.solution.y)} — cũng là giao điểm của hai đường thẳng.`
				: "Định thức D = 0 nên hai đường thẳng song song hoặc trùng nhau: hệ vô nghiệm hoặc có vô số nghiệm."
		},
	},
	{
		id: "math-triangle",
		subject: "math",
		title: "Tam giác từ ba cạnh",
		subtitle: "Diện tích Heron và các góc",
		formula: "S = √(p(p-a)(p-b)(p-c))",
		tags: ["hình học", "Heron", "côsin"],
		theory:
			"Ba đoạn tạo được tam giác khi tổng hai cạnh bất kỳ lớn hơn cạnh còn lại. Dùng công thức Heron cho diện tích và định lý côsin cho các góc.",
		inputs: [
			{ key: "a", label: "Cạnh a", unit: "cm", min: 1, max: 30, step: 0.5, default: 3 },
			{ key: "b", label: "Cạnh b", unit: "cm", min: 1, max: 30, step: 0.5, default: 4 },
			{ key: "c", label: "Cạnh c", unit: "cm", min: 1, max: 30, step: 0.5, default: 5 },
		],
		compute(v) {
			const { a, b, c } = v
			const valid = a + b > c && b + c > a && a + c > b
			const p = (a + b + c) / 2
			const area = valid ? Math.sqrt(Math.max(0, p * (p - a) * (p - b) * (p - c))) : 0
			const angleOf = (x, y, z) =>
				(Math.acos(Math.min(1, Math.max(-1, (y * y + z * z - x * x) / (2 * y * z)))) * 180) / Math.PI
			const angles = valid ? [angleOf(a, b, c), angleOf(b, a, c), angleOf(c, a, b)] : [0, 0, 0]
			const maxAngle = Math.max(...angles)
			const type = !valid
				? "không tồn tại"
				: Math.abs(maxAngle - 90) < 0.5
					? "vuông"
					: maxAngle > 90
						? "tù"
						: "nhọn"
			return {
				valid,
				area,
				angles,
				perimeter: a + b + c,
				type,
				metrics: [
					metric("Tồn tại tam giác", valid ? "Có" : "Không", "", "Bất đẳng thức tam giác"),
					metric("Chu vi", fmt(a + b + c), "cm"),
					metric("Diện tích", fmt(area), "cm²", "Công thức Heron"),
					metric("Các góc", angles.map((x) => `${fmt(x, 1)}°`).join(" ; "), ""),
					metric("Loại tam giác", type, ""),
					metric("Bán kính nội tiếp", fmt(valid ? area / p : 0), "cm"),
				],
				series: [
					series(
						"Góc theo cạnh",
						[a, b, c].map((side, index) => ({ x: Number(side.toFixed(2)), y: Number(angles[index].toFixed(2)) })),
						{ xLabel: "cạnh (cm)", yLabel: "góc đối diện (°)" },
					),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, v, r, palette } = scene
			clear(scene)
			if (!r.valid) {
				label(scene, "Ba cạnh này không tạo được tam giác", W / 2, H / 2, {
					align: "center",
					color: palette.danger,
					font: "16px ui-sans-serif, system-ui, sans-serif",
				})
				return
			}
			const { a, b, c } = v
			const cosA = (b * b + c * c - a * a) / (2 * b * c)
			const cx = b * cosA
			const cy = Math.sqrt(Math.max(0, b * b - cx * cx))
			const maxDim = Math.max(c, cx, cy, 1)
			const scale = Math.min((W - 140) / maxDim, (H - 140) / maxDim)
			const ox = W / 2 - (Math.max(c, cx) * scale) / 2
			const oy = H / 2 + (cy * scale) / 2
			const P = (x, y) => ({ x: ox + x * scale, y: oy - y * scale })
			const p1 = P(0, 0)
			const p2 = P(c, 0)
			const p3 = P(cx, cy)
			ctx.fillStyle = `${palette.accent}44`
			ctx.strokeStyle = palette.accent
			ctx.lineWidth = 3
			ctx.beginPath()
			ctx.moveTo(p1.x, p1.y)
			ctx.lineTo(p2.x, p2.y)
			ctx.lineTo(p3.x, p3.y)
			ctx.closePath()
			ctx.fill()
			ctx.stroke()
			label(scene, `c = ${fmt(c)}`, (p1.x + p2.x) / 2, p1.y + 10, { align: "center", color: palette.muted })
			label(scene, `b = ${fmt(b)}`, (p1.x + p3.x) / 2 - 40, (p1.y + p3.y) / 2, { color: palette.muted })
			label(scene, `a = ${fmt(a)}`, (p2.x + p3.x) / 2 + 10, (p2.y + p3.y) / 2, { color: palette.muted })
			hud(scene, ["Tam giác", `S = ${fmt(r.area)} cm²`, `Loại: ${r.type}`])
		},
		explain(v, r) {
			return r.valid
				? `Nửa chu vi p = ${fmt(r.perimeter / 2)} cm, áp dụng Heron được diện tích ${fmt(r.area)} cm². Các góc là ${r.angles.map((x) => `${fmt(x, 1)}°`).join(", ")}, nên đây là tam giác ${r.type}.`
				: `Ba đoạn ${fmt(v.a)}, ${fmt(v.b)}, ${fmt(v.c)} không thỏa bất đẳng thức tam giác nên không ghép thành tam giác được.`
		},
	},
	{
		id: "math-trig",
		subject: "math",
		title: "Hàm lượng giác",
		subtitle: "Biên độ, chu kỳ, pha",
		formula: "y = A·sin(Bx + C)",
		tags: ["lượng giác", "đồ thị", "tuần hoàn"],
		theory:
			"A định biên độ, B định chu kỳ (2π/B), C dịch đồ thị theo trục hoành. Đây là mô hình chung cho mọi hiện tượng tuần hoàn.",
		inputs: [
			{ key: "A", label: "Biên độ A", unit: "", min: -5, max: 5, step: 0.1, default: 2 },
			{ key: "B", label: "Hệ số B", unit: "", min: 0.2, max: 6, step: 0.1, default: 1 },
			{ key: "C", label: "Pha C", unit: "rad", min: -3.14, max: 3.14, step: 0.05, default: 0 },
		],
		compute(v) {
			const period = (2 * Math.PI) / v.B
			const xs = linspace(0, period * 2, 90)
			return {
				period,
				metrics: [
					metric("Biên độ", fmt(Math.abs(v.A)), ""),
					metric("Chu kỳ", fmt(period), "rad"),
					metric("Tần số", fmt(1 / period), "1/rad"),
					metric("Dịch pha", fmt(-v.C / v.B), "rad"),
				],
				series: [
					series(
						"A·sin(Bx + C)",
						xs.map((x) => ({ x: Number(x.toFixed(3)), y: Number((v.A * Math.sin(v.B * x + v.C)).toFixed(4)) })),
						{ xLabel: "x (rad)", yLabel: "y" },
					),
					series(
						"A·cos(Bx + C)",
						xs.map((x) => ({ x: Number(x.toFixed(3)), y: Number((v.A * Math.cos(v.B * x + v.C)).toFixed(4)) })),
						{ xLabel: "x (rad)", yLabel: "y" },
					),
				],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, v, r, palette } = scene
			clear(scene)
			const cy = H / 2
			const amp = Math.min(H / 2 - 40, Math.abs(v.A) * 40)
			ctx.strokeStyle = palette.muted
			ctx.lineWidth = 1.5
			ctx.beginPath()
			ctx.moveTo(20, cy)
			ctx.lineTo(W - 20, cy)
			ctx.stroke()
			const points = []
			for (let px = 40; px <= W - 40; px += 3) {
				const x = ((px - 40) / 60) * v.B
				points.push({ x: px, y: cy - amp * Math.sin(x + v.C) })
			}
			path(scene, points, palette.accent, 3)
			const cursor = 40 + ((t * 60) % Math.max(1, W - 80))
			const xVal = ((cursor - 40) / 60) * v.B
			ball(scene, cursor, cy - amp * Math.sin(xVal + v.C), 7, palette.warn)
			hud(scene, ["Hàm lượng giác", `A = ${fmt(v.A)}`, `Chu kỳ = ${fmt(r.period)} rad`])
		},
		explain(v, r) {
			return `Với A = ${fmt(v.A)}, B = ${fmt(v.B)}, C = ${fmt(v.C)}, đồ thị dao động trong khoảng ±${fmt(Math.abs(v.A))}, chu kỳ ${fmt(r.period)} rad và dịch pha ${fmt(-v.C / v.B)} rad.`
		},
	},
	{
		id: "math-exponential",
		subject: "math",
		title: "Tăng trưởng hàm mũ",
		subtitle: "Lãi kép và thời gian nhân đôi",
		formula: "A = A₀(1 + r)ⁿ",
		tags: ["hàm mũ", "lãi kép", "tăng trưởng"],
		theory:
			"Mỗi kỳ giá trị được nhân với (1 + r) nên tăng nhanh dần. Thời gian nhân đôi xấp xỉ 70 chia cho phần trăm tăng — quy tắc 70.",
		inputs: [
			{ key: "initial", label: "Giá trị ban đầu", unit: "", min: 1, max: 10000, step: 1, default: 100 },
			{ key: "rate", label: "Tỉ lệ mỗi kỳ", unit: "%", min: -50, max: 100, step: 0.5, default: 10 },
			{ key: "periods", label: "Số kỳ", unit: "kỳ", min: 1, max: 60, step: 1, default: 10 },
		],
		compute(v) {
			const rate = v.rate / 100
			const final = v.initial * Math.pow(1 + rate, v.periods)
			const doubling = rate > 0 ? Math.log(2) / Math.log(1 + rate) : null
			const points = Array.from({ length: Math.round(v.periods) + 1 }, (_, n) => ({
				x: n,
				y: Number((v.initial * Math.pow(1 + rate, n)).toFixed(3)),
			}))
			return {
				final,
				doubling,
				growth: final - v.initial,
				points,
				metrics: [
					metric("Giá trị cuối", fmt(final), ""),
					metric("Tăng thêm", fmt(final - v.initial), "", `${fmt(((final - v.initial) / v.initial) * 100, 1)}%`),
					metric("Nhân đôi sau", doubling ? fmt(doubling) : "—", "kỳ", "Quy tắc 70"),
					metric("Trung bình mỗi kỳ", fmt((final - v.initial) / v.periods), ""),
				],
				series: [series("Giá trị theo kỳ", points, { xLabel: "kỳ", yLabel: "giá trị" })],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, r, palette } = scene
			clear(scene)
			const data = r.points
			const maxY = Math.max(...data.map((p) => p.y), 1)
			const minY = Math.min(...data.map((p) => p.y), 0)
			const barW = Math.max(4, (W - 90) / data.length - 6)
			const visible = Math.max(1, Math.round((t * 6) % (data.length + 6)))
			data.slice(0, visible).forEach((point, index) => {
				const h = ((point.y - minY) / (maxY - minY || 1)) * (H - 120)
				ctx.fillStyle = index === visible - 1 ? palette.warn : palette.accent
				ctx.fillRect(50 + index * (barW + 6), H - 60 - h, barW, h)
			})
			hud(scene, [
				"Tăng trưởng hàm mũ",
				`Giá trị cuối ${fmt(r.final)}`,
				r.doubling ? `Nhân đôi sau ${fmt(r.doubling)} kỳ` : "Không tăng trưởng",
			])
		},
		explain(v, r) {
			return `Bắt đầu từ ${fmt(v.initial)} với tỉ lệ ${fmt(v.rate)}% mỗi kỳ, sau ${fmt(v.periods)} kỳ giá trị đạt ${fmt(r.final)} (tăng ${fmt(r.growth)}). ${r.doubling ? `Giá trị nhân đôi sau khoảng ${fmt(r.doubling)} kỳ.` : "Tỉ lệ không dương nên giá trị không nhân đôi."}`
		},
	},
	{
		id: "math-coin",
		subject: "math",
		title: "Xác suất tung đồng xu",
		subtitle: "Luật số lớn",
		formula: "fₙ → p khi n → ∞",
		tags: ["xác suất", "thống kê", "mô phỏng"],
		theory:
			"Tần suất thực nghiệm dao động mạnh khi số phép thử nhỏ nhưng tiệm cận xác suất lý thuyết khi số phép thử tăng. Seed giúp tái lập chính xác một lần mô phỏng.",
		inputs: [
			{ key: "flips", label: "Số lần tung", unit: "lần", min: 10, max: 5000, step: 10, default: 500 },
			{ key: "p", label: "Xác suất mặt ngửa", unit: "", min: 0, max: 1, step: 0.01, default: 0.5 },
			{ key: "seed", label: "Seed", unit: "", min: 1, max: 999, step: 1, default: 7 },
		],
		compute(v) {
			const rng = makeRng(v.seed)
			const total = Math.round(v.flips)
			const points = []
			const step = Math.max(1, Math.round(total / 60))
			let heads = 0
			for (let i = 1; i <= total; i += 1) {
				if (rng() < v.p) heads += 1
				if (i % step === 0 || i === total) points.push({ x: i, y: Number((heads / i).toFixed(4)) })
			}
			const ratio = heads / total
			const sd = Math.sqrt((v.p * (1 - v.p)) / total)
			return {
				heads,
				tails: total - heads,
				ratio,
				sd,
				points,
				metrics: [
					metric("Mặt ngửa", String(heads), "lần"),
					metric("Mặt sấp", String(total - heads), "lần"),
					metric("Tần suất thực nghiệm", fmt(ratio, 4), "", `lý thuyết ${fmt(v.p)}`),
					metric("Sai số", fmt(Math.abs(ratio - v.p), 4), ""),
					metric("Độ lệch chuẩn lý thuyết", fmt(sd, 4), ""),
				],
				series: [series("Tần suất tích lũy", points, { xLabel: "số lần tung", yLabel: "tần suất ngửa" })],
			}
		},
		draw(scene) {
			const { ctx, W, H, t, v, r, palette } = scene
			clear(scene)
			const data = r.points
			const visible = Math.max(2, Math.round((t * 12) % (data.length + 12)))
			const mapX = (i) => 50 + (i / Math.max(1, data.length - 1)) * (W - 90)
			const mapY = (y) => H - 50 - y * (H - 100)
			ctx.strokeStyle = palette.warn
			ctx.setLineDash([6, 6])
			ctx.beginPath()
			ctx.moveTo(50, mapY(v.p))
			ctx.lineTo(W - 40, mapY(v.p))
			ctx.stroke()
			ctx.setLineDash([])
			path(
				scene,
				data.slice(0, visible).map((point, index) => ({ x: mapX(index), y: mapY(point.y) })),
				palette.accent,
				3,
			)
			label(scene, `p = ${fmt(v.p)}`, W - 40, mapY(v.p) - 18, { align: "right", color: palette.warn })
			hud(scene, ["Luật số lớn", `${r.heads} ngửa / ${r.tails} sấp`, `Tần suất ${fmt(r.ratio, 4)}`])
		},
		explain(v, r) {
			return `Mô phỏng ${fmt(v.flips)} lần tung với p = ${fmt(v.p)} (seed ${fmt(v.seed)}) cho ${r.heads} mặt ngửa, tần suất ${fmt(r.ratio, 4)} — lệch ${fmt(Math.abs(r.ratio - v.p), 4)} so với lý thuyết. Tăng số lần tung sẽ thấy đường tần suất ép dần về p.`
		},
	},
]
