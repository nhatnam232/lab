import test from "node:test"
import assert from "node:assert/strict"

import { fmt, makeRng, prettyFormula, samplePoints, toCsvMany, toNumber } from "../src/lib/utils.js"
import {
	analyzeMix,
	bestCandidate,
	buildChemShare,
	cleanMix,
	findCandidates,
	findSuggestions,
	parseChemShare,
	runReaction,
} from "../src/lab/chem/engine.js"
import { getReaction } from "../src/lab/chem/reactions.js"
import { getSubstance, SUBSTANCES } from "../src/lab/chem/substances.js"
import { BLOCK_TYPES, clampParams, getBlockType } from "../src/lab/math/blocks.js"
import {
	buildMathShare,
	buildSeries,
	compose,
	evaluateAt,
	formulaText,
	numericDerivative,
	parseMathShare,
	simpsonIntegral,
} from "../src/lab/math/composer.js"

test("utils: dinh dang so kieu Viet Nam va cong thuc dep", () => {
	assert.equal(fmt(1.23456, 2), "1,23")
	assert.equal(fmt(0), "0")
	assert.equal(fmt(Number.NaN), "—")
	assert.equal(fmt(1e7), "1,00e+7")
	assert.equal(fmt(0.00001), "1,00e-5")
	assert.equal(toNumber("3,5", 0), 3.5)
	assert.equal(toNumber("abc", 9), 9)
	assert.equal(prettyFormula("2H2 + O2 -> 2H2O"), "2H₂ + O₂ → 2H₂O")
	assert.equal(prettyFormula("CaCO3"), "CaCO₃")
	assert.equal(prettyFormula("Ca(OH)2"), "Ca(OH)₂")
	const points = samplePoints((x) => (x === 0 ? Number.NaN : 1 / x), -2, 2, 41)
	assert.ok(points.every((point) => Number.isFinite(point.y)))
	assert.ok(!points.some((point) => point.x === 0))
	const rng = makeRng(7)
	const first = [rng(), rng(), rng()]
	const rng2 = makeRng(7)
	assert.deepEqual(first, [rng2(), rng2(), rng2()])
})

test("catalog du lieu day du va nhat quan", () => {
	assert.equal(SUBSTANCES.length, 22)
	const ids = new Set(SUBSTANCES.map((item) => item.id))
	assert.equal(ids.size, 22)
	for (const substance of SUBSTANCES) {
		assert.ok(getSubstance(substance.id), substance.id)
		assert.ok(substance.molarMass > 0, substance.id)
		assert.ok(substance.name && substance.formula && substance.category, substance.id)
	}
})

test("moi phan ung deu tham chieu chat co that va co enthalpy", () => {
	const all = ["burn-hydrogen", "salt-synthesis", "neutralization", "burn-methane", "decompose-limestone", "rusting", "zinc-acid", "iron-copper", "burn-magnesium", "slake-lime"]
	for (const id of all) {
		const reaction = getReaction(id)
		assert.ok(reaction, id)
		assert.equal(typeof reaction.enthalpy, "number", id)
		for (const item of [...reaction.reactants, ...reaction.products]) {
			assert.ok(getSubstance(item.id), `${id}: ${item.id}`)
			assert.ok(item.coef > 0, `${id}: ${item.id}`)
		}
	}
})

test("tim phan ung kha thi va goi y thieu mot chat", () => {
	const candidates = findCandidates({ h2: 2, o2: 5 })
	assert.deepEqual(candidates.map((item) => item.id), ["burn-hydrogen"])

	assert.deepEqual(findCandidates({ fe: 4, o2: 3 }).map((item) => item.id), ["rusting"])
	assert.equal(findCandidates({ h2: 1 }).length, 0)

	const suggestions = findSuggestions({ h2: 1 })
	assert.ok(suggestions.some((item) => item.reaction.id === "burn-hydrogen" && item.missingId === "o2"))
	const cu = findSuggestions({ cuso4: 1 })
	assert.ok(cu.some((item) => item.reaction.id === "iron-copper" && item.missingId === "fe"))

	assert.deepEqual(cleanMix({ h2: 2, o2: 0, na: -1, zn: "1,5", fe: Number.NaN }), { h2: 2, zn: 1.5 })
})

test("chay phan ung: chat gioi han, san pham, chat du, nhiet", () => {
	const burn = getReaction("burn-hydrogen")
	const result = runReaction(burn, { h2: 2, o2: 5 })
	assert.equal(result.limiting, "h2")
	assert.equal(Number(result.extent.toFixed(6)), 1)
	const water = result.produced.find((item) => item.id === "h2o")
	assert.equal(Number(water.moles.toFixed(6)), 2)
	assert.ok(Math.abs(water.moles * getSubstance("h2o").molarMass - 36.03) < 0.01)
	const oxygen = result.consumed.find((item) => item.id === "o2")
	assert.equal(Number(oxygen.leftover.toFixed(6)), 4)
	assert.ok(result.heat > 0, "phan ung toa nhiet")
	assert.equal(result.steps.length, 5)
	assert.ok(result.series.length >= 2)
	assert.ok(result.series.every((serie) => serie.data.length === 41))

	const endothermic = runReaction(getReaction("decompose-limestone"), { caco3: 1 })
	assert.ok(endothermic.heat < 0, "nung da vui thu nhiet")
	assert.equal(endothermic.produced.filter((item) => item.moles > 0).length, 2)

	/* Moi chat 0 mol: khong crash, khong bao sai chat gioi han. */
	const empty = runReaction(burn, { h2: 0, o2: 0 })
	assert.equal(empty.limiting, null)
	assert.equal(empty.totalInput, 0)
	assert.equal(empty.steps[4].lines[0], "—")

	/* Trung hòa: môi trường sau phản ứng. */
	const acidExcess = runReaction(getReaction("neutralization"), { hcl: 2, naoh: 1 })
	assert.match(acidExcess.environment.label, /Axit/)
	const baseExcess = runReaction(getReaction("neutralization"), { hcl: 1, naoh: 3 })
	assert.match(baseExcess.environment.label, /Bazơ/)
	const neutral = runReaction(getReaction("neutralization"), { hcl: 1, naoh: 1 })
	assert.match(neutral.environment.label, /Trung tính/)
})

test("bestCandidate chon phan ung tien trien lon nhat, analyzeMix tong hop", () => {
	const best = bestCandidate({ ch4: 1, o2: 2 })
	assert.equal(best.id, "burn-methane")

	const analysis = analyzeMix({ h2: 2, o2: 5 })
	assert.equal(analysis.result.reaction.id, "burn-hydrogen")
	/* Gợi ý thêm chất cho các phản ứng khác (gỉ sắt cần Fe, đốt CH₄...) */
	assert.ok(analysis.suggestions.some((item) => item.reaction.id === "rusting" && item.missingId === "fe"))

	const forced = analyzeMix({ h2: 2, o2: 5 }, "burn-hydrogen")
	assert.equal(forced.result.reaction.id, "burn-hydrogen")

	const nothing = analyzeMix({})
	assert.equal(nothing.result, null)
	assert.ok(nothing.candidates.length === 0)
})

test("share hash hoa loop tron", () => {
	const hash = buildChemShare({ h2: 2, o2: 1 })
	assert.equal(hash, "m=chem&mx=h2:2,o2:1")
	assert.equal(
		buildChemShare({ h2: 2, o2: 1 }, "burn-hydrogen"),
		"m=chem&mx=h2:2,o2:1&r=burn-hydrogen",
	)
	const parsed = parseChemShare(new URLSearchParams(hash.replace(/^m=chem&/, "")))
	assert.deepEqual(parsed, { h2: 2, o2: 1 })

	assert.equal(buildChemShare({}), "m=chem")
	const garbage = parseChemShare(new URLSearchParams("mx=khongtonTai:5,h2:abc,o2:1"))
	assert.deepEqual(garbage, { o2: 1 })
})

test("khoi ham: du lieu day du, tham so bi kẹp trong bien", () => {
	assert.equal(BLOCK_TYPES.length, 13)
	for (const type of BLOCK_TYPES) {
		assert.ok(type.params.length > 0, type.id)
		assert.equal(typeof type.fn, "function", type.id)
	}
	const sin = getBlockType("sin")
	const clamped = clampParams(sin, { a: 999, b: -5, c: 0 })
	assert.ok(clamped.a <= 5 && clamped.b >= 0.1)
	assert.equal(clampParams(sin, {}).a, sin.params[0].default)
})

test("composer: cong khoi co dau, xu ly mien xac dinh", () => {
	const { fn } = compose([
		{ uid: "u1", typeId: "sin", sign: 1, params: { a: 1, b: 1, c: 0 } },
		{ uid: "u2", typeId: "const", sign: 1, params: { c: 2 } },
	])
	assert.equal(fn(0), 2)
	assert.ok(Math.abs(fn(Math.PI / 2) - 3) < 1e-9)

	const subtract = compose([{ uid: "u3", typeId: "const", sign: -1, params: { c: 2 } }])
	assert.equal(subtract.fn(5), -2)

	const { fn: withRecip } = compose([{ uid: "u4", typeId: "recip", sign: 1, params: { a: 1 } }])
	assert.ok(Number.isNaN(withRecip(0)))
	const { fn: withSqrt } = compose([{ uid: "u5", typeId: "sqrt", sign: 1, params: { a: 1 } }])
	assert.ok(Number.isNaN(withSqrt(-4)))

	const text = formulaText([
		{ uid: "u6", typeId: "sin", sign: 1, params: { a: 1, b: 1, c: 0 } },
		{ uid: "u7", typeId: "x2", sign: -1, params: { a: 1 } },
	])
	assert.ok(text.startsWith("sin(") && text.includes("− x²"), text)
	assert.equal(formulaText([]), "0")
})

test("dao ham so va tich phan Simpson", () => {
	const square = (x) => x * x
	assert.ok(Math.abs(numericDerivative(square, 1) - 2) < 1e-3)
	assert.ok(Math.abs(numericDerivative(square, -3) - -6) < 1e-3)
	assert.ok(Math.abs(simpsonIntegral((x) => 3 * x * x, 0, 2) - 8) < 1e-6)
	assert.ok(Math.abs(simpsonIntegral(() => 3, 0, 10) - 30) < 1e-6)
	assert.ok(Number.isNaN(simpsonIntegral((x) => (x === 0 ? Number.NaN : 1 / x), -1, 1)))
})

test("buildSeries chi chua diem huu han, dao ham tuy chon", () => {
	const blocks = [{ uid: "u8", typeId: "recip", sign: 1, params: { a: 1 } }]
	const only = buildSeries(blocks, -2, 2, 100)
	assert.equal(only.length, 1)
	assert.ok(only[0].data.every((point) => Number.isFinite(point.y)))
	const withDerivative = buildSeries(blocks, -2, 2, 100, true)
	assert.equal(withDerivative.length, 2)

	const at = evaluateAt(
		[
			{ uid: "u9", typeId: "sin", sign: 1, params: { a: 1, b: 1, c: 0 } },
			{ uid: "u10", typeId: "const", sign: 1, params: { c: 1 } },
		],
		Math.PI / 2,
	)
	assert.equal(at.total, 2)
	assert.equal(at.contributions.length, 2)
	const sum = at.contributions.reduce((acc, item) => acc + (item.value ?? 0), 0)
	assert.ok(Math.abs(sum - at.total) < 1e-9)
})

test("share ham so loop tron", () => {
	const blocks = [
		{ uid: "u11", typeId: "sin", sign: -1, params: { a: 2, b: 1, c: 0.5 } },
		{ uid: "u12", typeId: "x2", sign: 1, params: { a: 1 } },
	]
	const hash = buildMathShare(blocks)
	assert.equal(hash, "m=math&b=sin:-1:2,1,0.5;x2:1:1")
	const parsed = parseMathShare(new URLSearchParams(hash.replace(/^m=math&/, "")))
	assert.equal(parsed.length, 2)
	assert.equal(parsed[0].typeId, "sin")
	assert.equal(parsed[0].sign, -1)
	assert.deepEqual(parsed[0].params, { a: 2, b: 1, c: 0.5 })
	assert.deepEqual(parsed[1].params, { a: 1 })

	assert.deepEqual(parseMathShare(new URLSearchParams("b=khongtontai:1:1;cos:1:1,2,0")).map((b) => b.typeId), ["cos"])
	assert.deepEqual(parseMathShare(new URLSearchParams("")), [])
})

test("toCsvMany gop nhieu serie cung cot x", () => {
	const csv = toCsvMany([
		{ xLabel: "x", yLabel: "y1", data: [{ x: 1, y: 2 }] },
		{ xLabel: "x", yLabel: "y2", data: [{ x: 1, y: 5 }, { x: 3, y: 7 }] },
	])
	assert.equal(csv, "x,y1,y2\n1,2,5\n3,,7")
})
