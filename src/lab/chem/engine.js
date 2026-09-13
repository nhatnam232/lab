import { getSubstance, massOf } from "./substances.js"
import { REACTIONS } from "./reactions.js"
import { fmt, linspace, prettyFormula, series, toNumber } from "../../lib/utils.js"

/**
 * Phan tich hon hop: tim cac phan ung kha thi (du chat tham gia),
 * goi y phan ung chi thieu mot chat, va chay phan ung duoc chon.
 * Toan bo la ham thuan de test duoc (khong dung window/document).
 */

/** mix: {substanceId: moles} — bo cac muc 0/am. */
export function cleanMix(mix) {
	const result = {}
	for (const [id, moles] of Object.entries(mix ?? {})) {
		const value = toNumber(moles, Number.NaN)
		if (Number.isFinite(value) && value > 0) result[id] = value
	}
	return result
}

export function findCandidates(mix) {
	const clean = cleanMix(mix)
	const present = new Set(Object.keys(clean))
	return REACTIONS.filter((reaction) =>
		reaction.reactants.every((item) => present.has(item.id)),
	)
}

/** Phan ung chi thieu dung mot chat (chua co trong hon hop) -> goi y "them X de ...". */
export function findSuggestions(mix) {
	const clean = cleanMix(mix)
	const present = new Set(Object.keys(clean))
	const suggestions = []
	for (const reaction of REACTIONS) {
		if (reaction.reactants.some((item) => present.has(item.id))) {
			const missing = reaction.reactants.filter((item) => !present.has(item.id))
			if (missing.length === 1) {
				suggestions.push({ reaction, missingId: missing[0].id })
			}
		}
	}
	return suggestions
}

/**
 * Chay mot phan ung voi so mol dau vao: chat gioi han, san pham, chat du, nhiet,
 * cac buoc giai tung dong va series tien trinh cho do thi.
 */
export function runReaction(reaction, mix) {
	const clean = cleanMix(mix)
	const ratios = reaction.reactants.map((item) => ({
		...item,
		moles: clean[item.id] ?? 0,
	}))
	const extents = ratios.map((item) => item.moles / item.coef)
	const extent = Math.min(...extents)
	const totalInput = ratios.reduce((sum, item) => sum + item.moles, 0)
	const limiting =
		totalInput === 0 ? null : ratios[extents.indexOf(extent)].id

	const consumed = ratios.map((item) => {
		const used = item.coef * extent
		return {
			id: item.id,
			formula: getSubstance(item.id)?.formula ?? item.id,
			name: getSubstance(item.id)?.name ?? item.id,
			coef: item.coef,
			moles: item.moles,
			used,
			leftover: item.moles - used,
		}
	})

	const produced = reaction.products.map((item) => ({
		id: item.id,
		formula: getSubstance(item.id)?.formula ?? item.id,
		name: getSubstance(item.id)?.name ?? item.id,
		coef: item.coef,
		moles: item.coef * extent,
	}))

	const heat = -(reaction.enthalpy ?? 0) * extent
	const pretty = prettyFormula(reaction.equation)

	const steps = [
		{
			title: "Viết phương trình hóa học",
			lines: [
				pretty,
				`Tỉ lệ mol theo hệ số: ${reaction.reactants.map((item) => `${getSubstance(item.id)?.formula ?? item.id}: ${item.coef}`).join(" ; ")}`,
			],
		},
		{
			title: "Tìm chất giới hạn",
			lines: ratios.map(
				(item) =>
					`${getSubstance(item.id)?.formula ?? item.id}: ${fmt(item.moles)} mol ÷ ${item.coef} = ${fmt(item.moles / item.coef)}`,
			).concat(
				totalInput === 0
					? ["Chưa có chất nào nên chưa xảy ra phản ứng."]
					: [`Kết quả nhỏ nhất là của ${getSubstance(limiting)?.name ?? limiting} → chất giới hạn.`],
			),
		},
		{
			title: "Tính sản phẩm theo chất giới hạn",
			lines:
				totalInput === 0
					? ["Chưa tạo được sản phẩm nào."]
					: produced.map(
							(item) =>
								`${item.formula}: ${item.coef} × ${fmt(extent)} = ${fmt(item.moles)} mol (≈ ${fmt(massOf(item.id, item.moles))} g)`,
						),
		},
		{
			title: "Số mol chất còn dư",
			lines: consumed
				.filter((item) => item.leftover > 1e-9)
				.map(
					(item) =>
						`${item.formula}: ${fmt(item.moles)} − ${fmt(item.used)} = ${fmt(item.leftover)} mol (≈ ${fmt(massOf(item.id, item.leftover))} g)`,
				)
				.concat(
					consumed.every((item) => item.leftover <= 1e-9)
						? ["Các chất tham gia vừa đủ, không còn dư."]
						: [],
				),
		},
		{
			title: "Nhiệt phản ứng",
			lines:
				totalInput === 0
					? ["—"]
					: [
							`Q = |ΔH°| × tiến trình = ${fmt(Math.abs(reaction.enthalpy ?? 0))} × ${fmt(extent)} = ${fmt(Math.abs(heat))} kJ (${heat >= 0 ? "tỏa nhiệt" : "thu nhiệt"})`,
							"ΔH° đo ở 25 °C.",
						],
		},
	]

	/* Trung hòa: xac dinh moi truong sau phan ung dua tren chat du. */
	let environment = null
	if (reaction.id === "neutralization" && totalInput > 0) {
		const hcl = consumed.find((item) => item.id === "hcl")
		const naoh = consumed.find((item) => item.id === "naoh")
		if (hcl.leftover > 1e-9) environment = { label: "Axit (dư HCl)", ph: "< 7" }
		else if (naoh.leftover > 1e-9) environment = { label: "Bazơ (dư NaOH)", ph: "> 7" }
		else environment = { label: "Trung tính", ph: "≈ 7" }
	}

	const progress = linspace(0, 1, 41).map((p) => ({
		x: Number((p * 100).toFixed(1)),
		y: Number(((produced[0]?.moles ?? 0) * p).toFixed(4)),
	}))
	const heatSerie = linspace(0, 1, 41).map((p) => ({
		x: Number((p * 100).toFixed(1)),
		y: Number((heat * p).toFixed(3)),
	}))

	return {
		reaction,
		extent,
		limiting,
		consumed,
		produced,
		heat,
		totalInput,
		environment,
		equation: pretty,
		steps,
		series: [
			series(
				produced.length ? `${prettyFormula(produced[0].formula)} theo tiến trình` : "Sản phẩm theo tiến trình",
				progress,
				{ xLabel: "Tiến trình (%)", yLabel: "mol" },
			),
			series("Nhiệt tích lũy", heatSerie, { xLabel: "Tiến trình (%)", yLabel: "kJ" }),
		],
	}
}

/** Phan ung kha thi co tien trien lon nhat. */
export function bestCandidate(mix) {
	const clean = cleanMix(mix)
	let best = null
	let bestExtent = -Infinity
	for (const reaction of findCandidates(clean)) {
		const extent = Math.min(
			...reaction.reactants.map((item) => (clean[item.id] ?? 0) / item.coef),
		)
		if (extent > bestExtent) {
			bestExtent = extent
			best = reaction
		}
	}
	return best
}

/**
 * Phan tich tong hop: candidates (phan ung kha thi), suggestions (thieu 1 chat),
 * va result cho phan ung duoc chon (mac dinh la best).
 */
export function analyzeMix(mix, selectedReactionId = null) {
	const clean = cleanMix(mix)
	const candidates = findCandidates(clean)
	const selected =
		(selectedReactionId && candidates.find((item) => item.id === selectedReactionId)) ||
		bestCandidate(clean)
	return {
		candidates,
		suggestions: findSuggestions(clean),
		selected,
		result: selected ? runReaction(selected, clean) : null,
	}
}

/** Chuoi ta lien ket: #m=chem&mx=h2:2,o2:1 */
export function buildChemShare(mix) {
	const clean = cleanMix(mix)
	const parts = Object.entries(clean).map(([id, moles]) => `${id}:${moles}`)
	return parts.length ? `m=chem&mx=${parts.join(",")}` : "m=chem"
}

export function parseChemShare(params) {
	const raw = params.get("mx") ?? ""
	const mix = {}
	for (const part of raw.split(",")) {
		if (!part) continue
		const [id, value] = part.split(":")
		if (getSubstance(id) && Number.isFinite(Number(value)) && Number(value) > 0) {
			mix[id] = Math.min(10, Number(value))
		}
	}
	return mix
}
