import { useCallback, useEffect, useMemo, useState } from "react"
import { clamp, randomBetween, toNumber } from "../lib/utils.js"
import { SCENARIOS, computeScenario, defaultValues, getScenario, searchScenarios } from "../scenarios/index.js"

const STORAGE_KEY = "scilab:state:v2"

function readStored() {
	if (typeof localStorage === "undefined") return {}
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {}
	} catch {
		return {}
	}
}

function sanitize(scenario, raw = {}) {
	const values = defaultValues(scenario)
	for (const field of scenario.inputs) {
		if (raw[field.key] === undefined) continue
		values[field.key] = clamp(toNumber(raw[field.key], field.default), field.min, field.max)
	}
	return values
}

/** Doc cau hinh tu duong dan chia se: #s=<id>&<key>=<value> */
function readHash() {
	if (typeof window === "undefined") return null
	const hash = window.location.hash.replace(/^#/, "")
	if (!hash) return null
	const params = new URLSearchParams(hash)
	const id = params.get("s")
	const scenario = SCENARIOS.find((item) => item.id === id)
	if (!scenario) return null
	const raw = {}
	for (const field of scenario.inputs) {
		const value = params.get(field.key)
		if (value !== null) raw[field.key] = value
	}
	return { scenarioId: scenario.id, values: sanitize(scenario, raw) }
}

export function useAppState() {
	const stored = useMemo(() => readStored(), [])
	const shared = useMemo(() => readHash(), [])

	const [theme, setTheme] = useState(stored.theme === "light" ? "light" : "dark")
	const [subject, setSubject] = useState(stored.subject ?? null)
	const [query, setQuery] = useState("")
	const [favorites, setFavorites] = useState(Array.isArray(stored.favorites) ? stored.favorites : [])
	const [playing, setPlaying] = useState(true)
	const [speed, setSpeed] = useState(typeof stored.speed === "number" ? stored.speed : 1)
	const [scenarioId, setScenarioId] = useState(
		(shared?.scenarioId ?? stored.scenarioId) || SCENARIOS[0].id,
	)

	const scenario = useMemo(() => getScenario(scenarioId), [scenarioId])

	const [values, setValues] = useState(() =>
		shared?.values ?? sanitize(getScenario((stored.scenarioId ?? SCENARIOS[0].id)), stored.values),
	)

	const result = useMemo(() => computeScenario(scenario, values), [scenario, values])
	const list = useMemo(() => searchScenarios(query, subject), [query, subject])

	useEffect(() => {
		if (typeof document === "undefined") return
		document.documentElement.classList.toggle("dark", theme === "dark")
		document.documentElement.style.colorScheme = theme
	}, [theme])

	useEffect(() => {
		if (typeof localStorage === "undefined") return
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ theme, subject, favorites, speed, scenarioId, values }),
			)
		} catch {
			/* bo qua khi trinh duyet chan localStorage */
		}
	}, [theme, subject, favorites, speed, scenarioId, values])

	const selectScenario = useCallback((id) => {
		const next = getScenario(id)
		setScenarioId(next.id)
		setValues(defaultValues(next))
	}, [])

	const setValue = useCallback(
		(key, raw) => {
			const field = scenario.inputs.find((item) => item.key === key)
			if (!field) return
			setValues((prev) => ({ ...prev, [key]: clamp(toNumber(raw, field.default), field.min, field.max) }))
		},
		[scenario],
	)

	const resetValues = useCallback(() => setValues(defaultValues(scenario)), [scenario])

	const randomizeValues = useCallback(() => {
		setValues(
			Object.fromEntries(
				scenario.inputs.map((field) => [field.key, randomBetween(field.min, field.max, field.step)]),
			),
		)
	}, [scenario])

	const toggleFavorite = useCallback((id) => {
		setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
	}, [])

	const toggleTheme = useCallback(() => setTheme((prev) => (prev === "dark" ? "light" : "dark")), [])

	const shareUrl = useCallback(() => {
		const params = new URLSearchParams({ s: scenario.id })
		for (const field of scenario.inputs) params.set(field.key, String(values[field.key]))
		const base = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}`
		return `${base}#${params.toString()}`
	}, [scenario, values])

	return {
		theme,
		toggleTheme,
		subject,
		setSubject,
		query,
		setQuery,
		favorites,
		toggleFavorite,
		playing,
		setPlaying,
		speed,
		setSpeed,
		scenario,
		scenarioId,
		selectScenario,
		values,
		setValue,
		resetValues,
		randomizeValues,
		result,
		list,
		shareUrl,
	}
}
