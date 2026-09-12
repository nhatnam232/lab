const PHYSICS_SCENARIOS = [
	{ id: "newton", label: "Định luật II Newton (F = m·a)" },
	{ id: "freefall", label: "Rơi tự do" },
	{ id: "pendulum", label: "Con lắc đơn" },
]

const MATH_SCENARIOS = [
	{ id: "quadratic", label: "Hàm số bậc hai y = ax² + bx + c" },
	{ id: "triangle", label: "Tam giác từ 3 cạnh" },
	{ id: "coin", label: "Xác suất tung đồng xu" },
]

function Field({ label, ...props }) {
	return (
		<label className="flex flex-col gap-1 text-sm text-slate-300">
			<span>{label}</span>
			<input
				{...props}
				className="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-center text-slate-100 outline-none focus:border-sky-400"
			/>
		</label>
	)
}

function ScenarioSelect({ options, value, onChange }) {
	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className="w-fit rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
		>
			{options.map((option) => (
				<option key={option.id} value={option.id}>
					{option.label}
				</option>
			))}
		</select>
	)
}

export default function EquationPanel({ module, state, onChange }) {
	if (module === "chemistry") {
		return (
			<div className="flex flex-wrap items-end gap-4">
				<Field
					label="Chất A"
					value={state.chemistry.reactantA}
					placeholder="H2"
					onChange={(e) => onChange("chemistry", { reactantA: e.target.value })}
				/>
				<span className="pb-2 text-xl text-slate-500">+</span>
				<Field
					label="Chất B"
					value={state.chemistry.reactantB}
					placeholder="O2"
					onChange={(e) => onChange("chemistry", { reactantB: e.target.value })}
				/>
				<span className="pb-2 text-xl text-slate-500">→ ?</span>
			</div>
		)
	}

	if (module === "physics") {
		const scenario = state.physics.scenario
		return (
			<div className="flex flex-col gap-4">
				<ScenarioSelect options={PHYSICS_SCENARIOS} value={scenario} onChange={(id) => onChange("physics", { scenario: id })} />
				{scenario === "newton" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="Khối lượng m (kg)" type="number" value={state.physics.mass} onChange={(e) => onChange("physics", { mass: e.target.value })} />
						<Field label="Lực F (N)" type="number" value={state.physics.force} onChange={(e) => onChange("physics", { force: e.target.value })} />
					</div>
				)}
				{scenario === "freefall" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="Độ cao H (m)" type="number" value={state.physics.height} onChange={(e) => onChange("physics", { height: e.target.value })} />
					</div>
				)}
				{scenario === "pendulum" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="Chiều dài L (m)" type="number" value={state.physics.length} onChange={(e) => onChange("physics", { length: e.target.value })} />
						<Field label="Góc θ (độ)" type="number" value={state.physics.angle} onChange={(e) => onChange("physics", { angle: e.target.value })} />
					</div>
				)}
			</div>
		)
	}

	if (module === "math") {
		const scenario = state.math.scenario
		return (
			<div className="flex flex-col gap-4">
				<ScenarioSelect options={MATH_SCENARIOS} value={scenario} onChange={(id) => onChange("math", { scenario: id })} />
				{scenario === "quadratic" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="a" type="number" value={state.math.a} onChange={(e) => onChange("math", { a: e.target.value })} />
						<span className="pb-2 text-slate-500">x² +</span>
						<Field label="b" type="number" value={state.math.b} onChange={(e) => onChange("math", { b: e.target.value })} />
						<span className="pb-2 text-slate-500">x +</span>
						<Field label="c" type="number" value={state.math.c} onChange={(e) => onChange("math", { c: e.target.value })} />
					</div>
				)}
				{scenario === "triangle" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="Cạnh a" type="number" value={state.math.sideA} onChange={(e) => onChange("math", { sideA: e.target.value })} />
						<Field label="Cạnh b" type="number" value={state.math.sideB} onChange={(e) => onChange("math", { sideB: e.target.value })} />
						<Field label="Cạnh c" type="number" value={state.math.sideC} onChange={(e) => onChange("math", { sideC: e.target.value })} />
					</div>
				)}
				{scenario === "coin" && (
					<div className="flex flex-wrap items-end gap-4">
						<Field label="Số lần tung N" type="number" value={state.math.flips} onChange={(e) => onChange("math", { flips: e.target.value })} />
					</div>
				)}
			</div>
		)
	}

	return null
}
