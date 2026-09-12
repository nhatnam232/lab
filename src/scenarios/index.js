import { CHEMISTRY_SCENARIOS } from "./chemistry.js"
import { MATH_SCENARIOS } from "./math.js"
import { PHYSICS_SCENARIOS } from "./physics.js"

export const SUBJECTS = [
	{ id: "chemistry", label: "Hóa học", icon: "⚗️" },
	{ id: "physics", label: "Vật lý", icon: "🦸" },
	{ id: "math", label: "Toán học", icon: "📐" },
]

export const SCENARIOS = [...CHEMISTRY_SCENARIOS, ...PHYSICS_SCENARIOS, ...MATH_SCENARIOS]

export function getScenario(id) {
	return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0]
}

export function defaultValues(scenario) {
	return Object.fromEntries(scenario.inputs.map((field) => [field.key, field.default]))
}

function normalize(text) {
	return String(text ?? "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\u0111/g, "d")
}

export function searchScenarios(query, subject) {
	const needle = normalize(query).trim()
	return SCENARIOS.filter((scenario) => {
		if (subject && scenario.subject !== subject) return false
		if (!needle) return true
		const haystack = normalize(
			[scenario.title, scenario.subtitle, scenario.formula, scenario.theory, (scenario.tags ?? []).join(" ")].join(" "),
		)
		return haystack.includes(needle)
	})
}

/** Chay compute an toan: loi tinh toan khong lam sap giao dien. */
export function computeScenario(scenario, values) {
	try {
		const result = scenario.compute(values)
		return {
			...result,
			metrics: result.metrics ?? [],
			series: (result.series ?? []).filter((serie) => serie && serie.data && serie.data.length > 0),
			error: null,
		}
	} catch (error) {
		return {
			metrics: [],
			series: [],
			error: error instanceof Error ? error.message : String(error),
		}
	}
}
