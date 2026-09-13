import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { clamp, toNumber } from "../lib/utils.js"
import { getSubstance } from "../lab/chem/substances.js"
import { getBlockType, clampParams } from "../lab/math/blocks.js"
import { buildChemShare, parseChemShare } from "../lab/chem/engine.js"
import { buildMathShare, parseMathShare, nextUid } from "../lab/math/composer.js"

const STORAGE_KEY = "scilab:studio:v3"

/* ---------- doc/kiem tra localStorage ---------- */

function readStored() {
	if (typeof localStorage === "undefined") return {}
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") ?? {}
	} catch {
		return {}
	}
}

function sanitizeStored(raw = {}) {
	const state = { theme: "dark", mode: "chem" }
	state.theme = raw.theme === "light" ? "light" : "dark"
	state.mode = raw.mode === "math" ? "math" : "chem"
	state.playing = typeof raw.playing === "boolean" ? raw.playing : true

	const mix = {}
	if (raw.chemMix && typeof raw.chemMix === "object") {
		for (const [id, moles] of Object.entries(raw.chemMix)) {
			if (getSubstance(id) && Number.isFinite(Number(moles)) && Number(moles) > 0) {
				mix[id] = clamp(Number(moles), 0.1, 10)
			}
		}
	}
	state.chemMix = mix
	state.selectedReactionId =
		typeof raw.selectedReactionId === "string" ? raw.selectedReactionId : null

	const blocks = []
	if (Array.isArray(raw.mathBlocks)) {
		for (const block of raw.mathBlocks) {
			const type = getBlockType(block?.typeId)
			if (!type) continue
			blocks.push({
				uid: typeof block.uid === "string" ? block.uid : nextUid(),
				typeId: block.typeId,
				sign: block.sign < 0 ? -1 : 1,
				params: clampParams(type, block.params ?? {}),
			})
		}
	}
	state.mathBlocks = blocks.slice(0, 12)
	state.mathDomain =
		Array.isArray(raw.mathDomain) && raw.mathDomain.length === 2
			? [clamp(toNumber(raw.mathDomain[0], -10), -50, 0), clamp(toNumber(raw.mathDomain[1], 10), 0.5, 50)]
			: [-10, 10]
	return state
}

/* ---------- share hash ---------- */

function parseHash(hashString) {
	if (typeof window === "undefined" && !hashString) return null
	const hash = String(hashString ?? window.location.hash ?? "").replace(/^#/, "")
	if (!hash) return null
	const params = new URLSearchParams(hash)
	const mode = params.get("m")
	if (mode !== "chem" && mode !== "math") return null
	if (mode === "chem") {
		return { mode, chemMix: parseChemShare(params), selectedReactionId: params.get("r") }
	}
	return { mode, mathBlocks: parseMathShare(params) }
}

function buildHash(state) {
	return state.mode === "chem"
		? buildChemShare(state.chemMix)
		: buildMathShare(state.mathBlocks)
}

/* ---------- hook chinh ---------- */

export function useLabState() {
	const stored = useMemo(() => sanitizeStored(readStored()), [])
	const shared = useMemo(() => parseHash(), [])

	const [theme, setTheme] = useState(stored.theme)
	const [mode, setMode] = useState(shared?.mode ?? stored.mode)
	const [playing, setPlaying] = useState(() => {
		if (typeof stored.playing === "boolean" && !shared) return stored.playing
		if (typeof window === "undefined" || !window.matchMedia) return true
		return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
	})
	const [chemMix, setChemMix] = useState(shared?.chemMix ?? stored.chemMix)
	const [selectedReactionId, setSelectedReactionId] = useState(
		(shared?.selectedReactionId ?? stored.selectedReactionId) ?? null,
	)
	const [mathBlocks, setMathBlocks] = useState(shared?.mathBlocks ?? stored.mathBlocks)
	const [mathDomain, setMathDomain] = useState(stored.mathDomain)

	/* Chu dong (state -> hash) de URL luon chia sẻ duoc; bo qua khi thay doi den tu hash. */
	const applyingHashRef = useRef(false)
	useEffect(() => {
		if (applyingHashRef.current) {
			applyingHashRef.current = false
			return
		}
		const id = setTimeout(() => {
			try {
				window.history.replaceState(null, "", `#${buildHash({ mode, chemMix, mathBlocks })}`)
			} catch {
				/* bo qua */
			}
		}, 400)
		return () => clearTimeout(id)
	}, [mode, chemMix, mathBlocks])

	/* Thu dong (hash -> state) de dan link moi vao tab dang mo van co tac dung. */
	useEffect(() => {
		const onHashChange = () => {
			const parsed = parseHash()
			if (!parsed) return
			applyingHashRef.current = true
			setMode(parsed.mode)
			if (parsed.mode === "chem") {
				setChemMix(parsed.chemMix ?? {})
				setSelectedReactionId(parsed.selectedReactionId ?? null)
			} else {
				setMathBlocks(parsed.mathBlocks ?? [])
			}
		}
		window.addEventListener("hashchange", onHashChange)
		return () => window.removeEventListener("hashchange", onHashChange)
	}, [])

	/* theme ap dung ngay cho <html> */
	useEffect(() => {
		if (typeof document === "undefined") return
		document.documentElement.classList.toggle("dark", theme === "dark")
		document.documentElement.style.colorScheme = theme
	}, [theme])

	/* Luu localStorage: theme ghi ngay, phan con lai debounce 250ms. */
	useEffect(() => {
		try {
			const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, theme }))
		} catch {
			/* trinh duyet chan localStorage */
		}
	}, [theme])

	useEffect(() => {
		const id = setTimeout(() => {
			try {
				const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify({
						...current,
						mode,
						playing,
						chemMix,
						selectedReactionId,
						mathBlocks,
						mathDomain,
					}),
				)
			} catch {
				/* bo qua */
			}
		}, 250)
		return () => clearTimeout(id)
	}, [mode, playing, chemMix, selectedReactionId, mathBlocks, mathDomain])

	/* ---------- hanh dong chem ---------- */

	const addSubstance = useCallback((id, moles = 1) => {
		if (!getSubstance(id)) return
		setChemMix((prev) => ({ ...prev, [id]: clamp(toNumber(moles, 1), 0.1, 10) }))
	}, [])

	const setMoles = useCallback((id, raw) => {
		setChemMix((prev) => {
			const value = clamp(toNumber(raw, prev[id] ?? 1), 0.1, 10)
			return { ...prev, [id]: value }
		})
	}, [])

	const removeSubstance = useCallback((id) => {
		setChemMix((prev) => {
			const next = { ...prev }
			delete next[id]
			return next
		})
	}, [])

	const clearMix = useCallback(() => {
		setChemMix({})
		setSelectedReactionId(null)
	}, [])

	const selectReaction = useCallback((id) => setSelectedReactionId(id), [])

	/* ---------- hanh dong math ---------- */

	const addBlock = useCallback((typeId) => {
		const type = getBlockType(typeId)
		if (!type) return
		setMathBlocks((prev) => {
			if (prev.length >= 12) return prev
			return [...prev, { uid: nextUid(), typeId, sign: 1, params: Object.fromEntries(type.params.map((param) => [param.key, param.default])) }]
		})
	}, [])

	const updateParam = useCallback((uid, key, raw) => {
		setMathBlocks((prev) =>
			prev.map((block) => {
				if (block.uid !== uid) return block
				const type = getBlockType(block.typeId)
				const param = type?.params.find((item) => item.key === key)
				if (!param) return block
				return { ...block, params: { ...block.params, [key]: clamp(toNumber(raw, param.default), param.min, param.max) } }
			}),
		)
	}, [])

	const toggleSign = useCallback((uid) => {
		setMathBlocks((prev) =>
			prev.map((block) => (block.uid === uid ? { ...block, sign: block.sign < 0 ? 1 : -1 } : block)),
		)
	}, [])

	const removeBlock = useCallback((uid) => {
		setMathBlocks((prev) => prev.filter((block) => block.uid !== uid))
	}, [])

	const moveBlock = useCallback((uid, direction) => {
		setMathBlocks((prev) => {
			const index = prev.findIndex((block) => block.uid === uid)
			const target = index + direction
			if (index < 0 || target < 0 || target >= prev.length) return prev
			const next = [...prev]
			;[next[index], next[target]] = [next[target], next[index]]
			return next
		})
	}, [])

	const clearBlocks = useCallback(() => setMathBlocks([]), [])

	const setMathDomainValue = useCallback((index, raw) => {
		setMathDomain((prev) => {
			const value = clamp(toNumber(raw, prev[index]), index === 0 ? -50 : 0.5, index === 0 ? 0 : 50)
			const next = [...prev]
			next[index] = value
			if (next[0] >= next[1]) next[index === 0 ? 1 : 0] = index === 0 ? next[0] + 1 : next[1] - 1
			return next
		})
	}, [])

	const toggleTheme = useCallback(() => setTheme((prev) => (prev === "dark" ? "light" : "dark")), [])

	return {
		theme,
		toggleTheme,
		mode,
		setMode,
		playing,
		setPlaying,
		chemMix,
		addSubstance,
		setMoles,
		removeSubstance,
		clearMix,
		selectedReactionId,
		selectReaction,
		mathBlocks,
		addBlock,
		updateParam,
		toggleSign,
		removeBlock,
		moveBlock,
		clearBlocks,
		mathDomain,
		setMathDomainValue,
	}
}
