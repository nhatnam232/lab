import { useEffect, useMemo, useState } from "react"
import EquationPanel from "./components/EquationPanel.jsx"
import SimulationCanvas from "./components/SimulationCanvas.jsx"
import InfoPanel from "./components/InfoPanel.jsx"
import { getReaction } from "./modules/chemistry.js"
import { newtonMotion, freeFall, pendulum } from "./modules/physics.js"
import { quadratic, triangle, coinTossSeries } from "./modules/math.js"
import { explainResult } from "./api/claude.js"

const MODULES = [
	{ id: "chemistry", label: "🧪 Hóa học" },
	{ id: "physics", label: "⚙️ Vật lý" },
	{ id: "math", label: "📐 Toán học" },
]

const INITIAL_STATE = {
	chemistry: { reactantA: "H2", reactantB: "O2" },
	physics: { scenario: "newton", mass: "2", force: "10", height: "20", length: "1", angle: "15" },
	math: { scenario: "quadratic", a: "1", b: "-2", c: "-3", sideA: "3", sideB: "4", sideC: "5", flips: "60" },
}

export default function App() {
	const [module, setModule] = useState("chemistry")
	const [state, setState] = useState(INITIAL_STATE)
	const [explanation, setExplanation] = useState("")

	function handleChange(section, patch) {
		setState((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }))
	}

	const result = useMemo(() => {
		if (module === "chemistry") {
			return getReaction(state.chemistry.reactantA, state.chemistry.reactantB)
		}
		if (module === "physics") {
			const p = state.physics
			if (p.scenario === "newton") return newtonMotion(p.mass, p.force)
			if (p.scenario === "freefall") return freeFall(p.height)
			if (p.scenario === "pendulum") return pendulum(p.length, p.angle)
		}
		if (module === "math") {
			const m = state.math
			if (m.scenario === "quadratic") return quadratic(m.a, m.b, m.c)
			if (m.scenario === "triangle") return triangle(m.sideA, m.sideB, m.sideC)
			if (m.scenario === "coin") return coinTossSeries(m.flips)
		}
		return null
	}, [module, state])

	useEffect(() => {
		let cancelled = false
		setExplanation("")
		explainResult(module, result?.type ?? module, result).then((text) => {
			if (!cancelled) setExplanation(text)
		})
		return () => {
			cancelled = true
		}
	}, [module, result])

	return (
		<div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				<header className="flex flex-wrap items-center justify-between gap-4">
					<h1 className="text-2xl font-bold">🔬 SciLab Playground</h1>
					<nav className="flex gap-2">
						{MODULES.map((m) => (
							<button
								key={m.id}
								onClick={() => setModule(m.id)}
								className={`rounded-md px-4 py-2 text-sm font-medium transition ${
									module === m.id ? "bg-sky-500 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"
								}`}
							>
								{m.label}
							</button>
						))}
					</nav>
				</header>

				<section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">📋 Equation Panel</h2>
					<EquationPanel module={module} state={state} onChange={handleChange} />
				</section>

				<section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
					<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">🎬 Simulation Canvas</h2>
					<SimulationCanvas module={module} state={state} result={result} />
				</section>

				<InfoPanel module={module} result={result} explanation={explanation} />

				<footer className="pb-4 text-center text-xs text-slate-600">
					SciLab Playground — Fill &amp; See learning engine. Xem README.md để chạy dự án cục bộ.
				</footer>
			</div>
		</div>
	)
}
