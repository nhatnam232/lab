import CanvasStage from "./components/CanvasStage.jsx"
import ChartPanel from "./components/ChartPanel.jsx"
import ControlPanel from "./components/ControlPanel.jsx"
import InfoPanel from "./components/InfoPanel.jsx"
import Sidebar from "./components/Sidebar.jsx"
import { useAppState } from "./state/useAppState.js"

export default function App() {
	const app = useAppState()

	return (
		<div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
			<header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
					<div>
						<h1 className="text-lg font-bold">🧪 SciLab Playground</h1>
						<p className="text-xs text-slate-500 dark:text-slate-400">
							Phòng thí nghiệm mô phỏng Hóa – Lý – Toán ngay trong trình duyệt
						</p>
					</div>
					<button type="button" className="btn" onClick={app.toggleTheme}>
						{app.theme === "dark" ? "☀️ Sáng" : "🌙 Tối"}
					</button>
				</div>
			</header>

			<main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 xl:grid-cols-[320px_minmax(0,1fr)]">
				<div className="xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)]">
					<Sidebar
						list={app.list}
						scenarioId={app.scenarioId}
						onSelect={app.selectScenario}
						subject={app.subject}
						onSubject={app.setSubject}
						query={app.query}
						onQuery={app.setQuery}
						favorites={app.favorites}
						onToggleFavorite={app.toggleFavorite}
					/>
				</div>

				<div className="space-y-4">
					<CanvasStage
						scenario={app.scenario}
						values={app.values}
						result={app.result}
						theme={app.theme}
						playing={app.playing}
						onPlaying={app.setPlaying}
						speed={app.speed}
						onSpeed={app.setSpeed}
					/>

					<div className="grid gap-4 lg:grid-cols-2">
						<ControlPanel
							scenario={app.scenario}
							values={app.values}
							onChange={app.setValue}
							onReset={app.resetValues}
							onRandom={app.randomizeValues}
							shareUrl={app.shareUrl}
						/>
						<ChartPanel scenarioId={app.scenario.id} series={app.result.series ?? []} />
					</div>

					<InfoPanel scenario={app.scenario} values={app.values} result={app.result} />
				</div>
			</main>

			<footer className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-slate-400">
				Số liệu mang tính mô phỏng giáo dục — luôn tuân thủ hướng dẫn an toàn khi làm thí nghiệm thật.
			</footer>
		</div>
	)
}
