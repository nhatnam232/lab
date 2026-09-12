import { useEffect, useRef } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const WIDTH = 640
const HEIGHT = 320

function clearBackground(ctx) {
	ctx.fillStyle = "#020617"
	ctx.fillRect(0, 0, WIDTH, HEIGHT)
}

function emptyMessage(ctx, text) {
	ctx.fillStyle = "#64748b"
	ctx.font = "16px sans-serif"
	ctx.textAlign = "left"
	ctx.fillText(text, 24, HEIGHT / 2)
}

function drawAxes(ctx) {
	ctx.strokeStyle = "#1e293b"
	ctx.lineWidth = 1
	ctx.beginPath()
	ctx.moveTo(0, HEIGHT / 2)
	ctx.lineTo(WIDTH, HEIGHT / 2)
	ctx.moveTo(WIDTH / 2, 0)
	ctx.lineTo(WIDTH / 2, HEIGHT)
	ctx.stroke()
}

function drawChemistry(ctx, chemState, result, elapsed) {
	clearBackground(ctx)
	if (!result) {
		emptyMessage(ctx, "Nhập chất phản ứng để xem mô phỏng…")
		return
	}

	const loop = elapsed % 2400
	const progress = Math.min(loop / 1600, 1)
	const cx = WIDTH / 2
	const cy = HEIGHT / 2 - 10
	ctx.textAlign = "center"
	ctx.font = "18px sans-serif"

	if (progress < 0.55) {
		const approach = Math.min(progress / 0.55, 1)
		const leftX = 90 + (cx - 90 - 36) * approach
		const rightX = WIDTH - 90 - (WIDTH - 90 - cx - 36) * approach

		ctx.fillStyle = result.color
		ctx.beginPath()
		ctx.arc(leftX, cy, 26, 0, Math.PI * 2)
		ctx.fill()
		ctx.fillStyle = "#fff"
		ctx.fillText(result.reactants?.[0] ?? chemState.reactantA, leftX, cy + 6)

		if (result.reactants?.[1]) {
			ctx.fillStyle = "#f43f5e"
			ctx.beginPath()
			ctx.arc(rightX, cy, 26, 0, Math.PI * 2)
			ctx.fill()
			ctx.fillStyle = "#fff"
			ctx.fillText(result.reactants[1], rightX, cy + 6)
		}
	} else {
		const burst = Math.min((progress - 0.55) / 0.45, 1)
		for (let i = 0; i < 12; i++) {
			const angle = (i / 12) * Math.PI * 2
			const r = 32 + burst * 46
			ctx.fillStyle = `rgba(251, 191, 36, ${1 - burst})`
			ctx.beginPath()
			ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, 4, 0, Math.PI * 2)
			ctx.fill()
		}

		ctx.fillStyle = result.color
		ctx.beginPath()
		ctx.arc(cx, cy, 30 + burst * 6, 0, Math.PI * 2)
		ctx.fill()
		ctx.fillStyle = "#fff"
		ctx.fillText(result.product, cx, cy + 6)

		ctx.fillStyle = "#e2e8f0"
		ctx.font = "14px sans-serif"
		ctx.fillText(result.balanced, cx, cy + 66)
	}
}

function drawPhysics(ctx, physicsState, result, elapsed) {
	clearBackground(ctx)
	const groundY = HEIGHT - 70
	ctx.strokeStyle = "#334155"
	ctx.lineWidth = 2
	ctx.beginPath()
	ctx.moveTo(20, groundY)
	ctx.lineTo(WIDTH - 20, groundY)
	ctx.stroke()

	if (!result) {
		emptyMessage(ctx, "Nhập thông số để xem mô phỏng…")
		return
	}

	if (result.type === "newton") {
		const t = (elapsed % 3000) / 1000
		const dist = 0.5 * result.acceleration * t * t
		const x = Math.min(60 + dist * 12, WIDTH - 120)
		ctx.fillStyle = "#38bdf8"
		ctx.fillRect(x, groundY - 40, 44, 40)

		const arrowLen = Math.min(Math.abs(result.force) * 3, 160)
		ctx.strokeStyle = "#f87171"
		ctx.lineWidth = 3
		ctx.beginPath()
		ctx.moveTo(x + 44, groundY - 20)
		ctx.lineTo(x + 44 + arrowLen, groundY - 20)
		ctx.stroke()
		ctx.beginPath()
		ctx.moveTo(x + 44 + arrowLen, groundY - 20)
		ctx.lineTo(x + 44 + arrowLen - 8, groundY - 26)
		ctx.lineTo(x + 44 + arrowLen - 8, groundY - 14)
		ctx.closePath()
		ctx.fillStyle = "#f87171"
		ctx.fill()

		ctx.fillStyle = "#e2e8f0"
		ctx.font = "14px sans-serif"
		ctx.textAlign = "left"
		ctx.fillText(`a = F/m = ${result.acceleration.toFixed(2)} m/s²`, 24, 30)
	}

	if (result.type === "freefall") {
		const loopTime = result.time > 0 ? result.time : 1
		const t = (elapsed % (loopTime * 1000)) / 1000
		const fallen = 0.5 * result.gravity * t * t
		const remaining = Math.max(result.height - fallen, 0)
		const topY = 40
		const usableHeight = groundY - topY - 20
		const y = topY + (usableHeight * (result.height - remaining)) / result.height

		ctx.beginPath()
		ctx.fillStyle = "#facc15"
		ctx.arc(WIDTH / 2, y, 14, 0, Math.PI * 2)
		ctx.fill()

		ctx.fillStyle = "#e2e8f0"
		ctx.font = "14px sans-serif"
		ctx.textAlign = "left"
		ctx.fillText(`Thời gian rơi ≈ ${result.time.toFixed(2)} s | v cuối ≈ ${result.finalVelocity.toFixed(2)} m/s`, 24, 30)
	}

	if (result.type === "pendulum") {
		const period = result.period > 0 ? result.period : 1
		const phase = ((elapsed % (period * 1000)) / (period * 1000)) * Math.PI * 2
		const amplitude = (Math.min(Math.abs(result.angleDeg), 45) * Math.PI) / 180
		const angle = amplitude * Math.cos(phase)
		const pivotX = WIDTH / 2
		const pivotY = 40
		const length = Math.min(result.length * 60, groundY - pivotY - 20)
		const bobX = pivotX + length * Math.sin(angle)
		const bobY = pivotY + length * Math.cos(angle)

		ctx.strokeStyle = "#94a3b8"
		ctx.beginPath()
		ctx.moveTo(pivotX, pivotY)
		ctx.lineTo(bobX, bobY)
		ctx.stroke()
		ctx.fillStyle = "#f472b6"
		ctx.beginPath()
		ctx.arc(bobX, bobY, 14, 0, Math.PI * 2)
		ctx.fill()

		ctx.fillStyle = "#e2e8f0"
		ctx.font = "14px sans-serif"
		ctx.textAlign = "left"
		ctx.fillText(`Chu kỳ T ≈ ${result.period.toFixed(2)} s`, 24, 30)
	}
}

function drawTriangle(ctx, result) {
	ctx.fillStyle = "#e2e8f0"
	ctx.font = "14px sans-serif"
	ctx.textAlign = "left"

	if (!result.isValid) {
		emptyMessage(ctx, "Ba cạnh này không tạo thành tam giác hợp lệ.")
		return
	}

	const { a, b, c } = result
	const ax = 0
	const ay = 0
	const bx = a
	const by = 0
	const cosA = (a * a + b * b - c * c) / (2 * a * b)
	const cx = b * cosA
	const cy = b * Math.sqrt(Math.max(1 - cosA * cosA, 0))

	const points = [
		{ x: ax, y: ay },
		{ x: bx, y: by },
		{ x: cx, y: cy },
	]
	const maxDim = Math.max(a, b, c, 1)
	const scale = 180 / maxDim
	const offsetX = WIDTH / 2 - (bx * scale) / 2
	const offsetY = HEIGHT / 2 + 60

	ctx.strokeStyle = "#38bdf8"
	ctx.lineWidth = 2
	ctx.beginPath()
	points.forEach((point, index) => {
		const px = offsetX + point.x * scale
		const py = offsetY - point.y * scale
		if (index === 0) ctx.moveTo(px, py)
		else ctx.lineTo(px, py)
	})
	ctx.closePath()
	ctx.stroke()
	ctx.fillStyle = "rgba(56, 189, 248, 0.15)"
	ctx.fill()

	ctx.fillStyle = "#e2e8f0"
	ctx.fillText(`Diện tích ≈ ${result.area.toFixed(2)}`, 24, 30)
	ctx.fillText(`Chu vi = ${result.perimeter.toFixed(2)}`, 24, 54)
}

function drawMath(ctx, mathState, result, elapsed) {
	clearBackground(ctx)

	if (result?.type === "triangle") {
		drawTriangle(ctx, result)
		return
	}

	if (result?.type === "coin") {
		ctx.fillStyle = "#e2e8f0"
		ctx.font = "14px sans-serif"
		ctx.textAlign = "left"
		ctx.fillText(`Tỉ lệ mặt ngửa hiện tại ≈ ${(result.ratio * 100).toFixed(1)}% sau ${result.flips} lần tung`, 24, 30)
		ctx.fillText("Xem biểu đồ hội tụ bên phải →", 24, 54)
		return
	}

	drawAxes(ctx)

	if (!result || result.type !== "quadratic") {
		emptyMessage(ctx, "Nhập a, b, c để vẽ đồ thị…")
		return
	}

	const originX = WIDTH / 2
	const originY = HEIGHT / 2
	const scaleX = 24
	const scaleY = 24

	ctx.strokeStyle = "#38bdf8"
	ctx.lineWidth = 2
	ctx.beginPath()
	result.points.forEach((point, index) => {
		const px = originX + point.x * scaleX
		const py = originY - point.y * scaleY
		if (index === 0) ctx.moveTo(px, py)
		else ctx.lineTo(px, py)
	})
	ctx.stroke()

	if (result.vertex) {
		const vx = originX + result.vertex.x * scaleX
		const vy = originY - result.vertex.y * scaleY
		ctx.fillStyle = "#facc15"
		ctx.beginPath()
		ctx.arc(vx, vy, 5, 0, Math.PI * 2)
		ctx.fill()
	}

	result.roots.forEach((root) => {
		const rx = originX + root * scaleX
		ctx.fillStyle = "#34d399"
		ctx.beginPath()
		ctx.arc(rx, originY, 5, 0, Math.PI * 2)
		ctx.fill()
	})

	ctx.fillStyle = "#f472b6"
	ctx.beginPath()
	ctx.arc(originX, originY - result.yIntercept * scaleY, 5, 0, Math.PI * 2)
	ctx.fill()
}

export default function SimulationCanvas({ module, state, result }) {
	const canvasRef = useRef(null)
	const frameRef = useRef(0)
	const startRef = useRef(performance.now())

	useEffect(() => {
		startRef.current = performance.now()
	}, [module, JSON.stringify(state), result?.type])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext("2d")

		function render(now) {
			const elapsed = now - startRef.current
			if (module === "chemistry") drawChemistry(ctx, state.chemistry, result, elapsed)
			else if (module === "physics") drawPhysics(ctx, state.physics, result, elapsed)
			else if (module === "math") drawMath(ctx, state.math, result, elapsed)
			frameRef.current = requestAnimationFrame(render)
		}

		frameRef.current = requestAnimationFrame(render)
		return () => cancelAnimationFrame(frameRef.current)
	}, [module, state, result])

	return (
		<div className="flex flex-col gap-4 lg:flex-row">
			<canvas
				ref={canvasRef}
				width={WIDTH}
				height={HEIGHT}
				className="w-full max-w-[640px] rounded-lg border border-slate-800 bg-slate-950"
			/>
			{module === "physics" && result?.type === "newton" && (
				<div className="h-[220px] w-full max-w-[280px]">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={result.points}>
							<XAxis dataKey="t" stroke="#64748b" fontSize={11} />
							<YAxis stroke="#64748b" fontSize={11} />
							<Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
							<Line type="monotone" dataKey="v" stroke="#38bdf8" dot={false} strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
			{module === "math" && result?.type === "coin" && (
				<div className="h-[220px] w-full max-w-[280px]">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={result.points}>
							<XAxis dataKey="i" stroke="#64748b" fontSize={11} />
							<YAxis domain={[0, 1]} stroke="#64748b" fontSize={11} />
							<Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155" }} />
							<Line type="monotone" dataKey="ratio" stroke="#a3e635" dot={false} strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	)
}
