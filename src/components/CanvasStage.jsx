import { useEffect, useRef } from "react"
import { PALETTES } from "../lib/draw.js"

const SPEEDS = [0.25, 0.5, 1, 2, 4]

export default function CanvasStage({ scenario, values, result, theme, playing, onPlaying, speed, onSpeed }) {
	const canvasRef = useRef(null)
	const timeRef = useRef(0)
	const frameRef = useRef(0)
	const lastRef = useRef(0)
	const stateRef = useRef({ scenario, values, result, theme, playing, speed })

	stateRef.current = { scenario, values, result, theme, playing, speed }

	useEffect(() => {
		timeRef.current = 0
	}, [scenario.id])

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return undefined
		const ctx = canvas.getContext("2d")

		const resize = () => {
			const ratio = window.devicePixelRatio || 1
			const width = canvas.clientWidth || 640
			const height = canvas.clientHeight || 380
			canvas.width = Math.round(width * ratio)
			canvas.height = Math.round(height * ratio)
			ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
		}

		resize()
		window.addEventListener("resize", resize)

		const render = (now) => {
			const current = stateRef.current
			const delta = lastRef.current ? (now - lastRef.current) / 1000 : 0
			lastRef.current = now
			if (current.playing) timeRef.current += delta * current.speed

			const scene = {
				ctx,
				W: canvas.clientWidth || 640,
				H: canvas.clientHeight || 380,
				t: timeRef.current,
				v: current.values,
				r: current.result,
				palette: PALETTES[current.theme] ?? PALETTES.dark,
			}

			try {
				if (!current.result.error) current.scenario.draw(scene)
			} catch {
				/* mot khung ve loi khong lam dung vong lap */
			}
			frameRef.current = requestAnimationFrame(render)
		}

		frameRef.current = requestAnimationFrame(render)
		return () => {
			cancelAnimationFrame(frameRef.current)
			lastRef.current = 0
			window.removeEventListener("resize", resize)
		}
	}, [])

	const savePng = () => {
		const canvas = canvasRef.current
		if (!canvas) return
		const link = document.createElement("a")
		link.href = canvas.toDataURL("image/png")
		link.download = `${scenario.id}.png`
		link.click()
	}

	return (
		<section className="card space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{scenario.title}</h2>
					<p className="text-xs text-slate-500 dark:text-slate-400">{scenario.formula}</p>
				</div>
				<div className="flex flex-wrap items-center gap-1.5">
					<button type="button" className="btn btn-primary px-3 py-1.5 text-xs" onClick={() => onPlaying(!playing)}>
						{playing ? "⏸ Tạm dừng" : "▶ Chạy"}
					</button>
					<div className="flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
						{SPEEDS.map((item) => (
							<button
								key={item}
								type="button"
								onClick={() => onSpeed(item)}
								className={`px-2 py-1 text-xs ${
									speed === item
										? "bg-sky-600 text-white"
										: "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"
								}`}
							>
								{item}×
							</button>
						))}
					</div>
					<button type="button" className="btn px-2 py-1 text-xs" onClick={() => (timeRef.current = 0)}>
						↺ Làm lại
					</button>
					<button type="button" className="btn px-2 py-1 text-xs" onClick={savePng}>
						🖼️ PNG
					</button>
				</div>
			</div>

			<div className="relative overflow-hidden rounded-xl">
				<canvas ref={canvasRef} className="block h-[380px] w-full" />
				{result.error ? (
					<p className="absolute inset-0 flex items-center justify-center bg-slate-900/80 p-6 text-center text-sm text-red-300">
						Không tính được với thông số hiện tại: {result.error}
					</p>
				) : null}
			</div>
		</section>
	)
}
