import test from "node:test"
import assert from "node:assert/strict"
import { SCENARIOS, computeScenario, defaultValues, getScenario, searchScenarios } from "../src/scenarios/index.js"
import { computeReaction } from "../src/scenarios/chemistry.js"
import { fmt, makeRng, toCsv, toNumber } from "../src/lib/utils.js"

test("every scenario has a valid spec", () => {
	assert.ok(SCENARIOS.length >= 14, `only ${SCENARIOS.length} scenarios`)
	const ids = new Set()
	for (const scenario of SCENARIOS) {
		assert.ok(!ids.has(scenario.id), `duplicate id ${scenario.id}`)
		ids.add(scenario.id)
		assert.ok(scenario.title && scenario.formula && scenario.theory, scenario.id)
		assert.ok(["chemistry", "physics", "math"].includes(scenario.subject), scenario.id)
		assert.ok(Array.isArray(scenario.inputs) && scenario.inputs.length > 0, scenario.id)
		assert.equal(typeof scenario.compute, "function", scenario.id)
		assert.equal(typeof scenario.draw, "function", scenario.id)
		assert.equal(typeof scenario.explain, "function", scenario.id)
		for (const field of scenario.inputs) {
			assert.ok(field.min <= field.default && field.default <= field.max, `${scenario.id}.${field.key}`)
			assert.ok(field.step > 0, `${scenario.id}.${field.key}`)
		}
	}
})

test("compute works with defaults and at both bounds", () => {
	for (const scenario of SCENARIOS) {
		const base = defaultValues(scenario)
		const result = computeScenario(scenario, base)
		assert.equal(result.error, null, `${scenario.id}: ${result.error}`)
		assert.ok(result.metrics.length > 0, scenario.id)
		assert.ok(result.series.length > 0, scenario.id)
		assert.equal(typeof scenario.explain(base, result), "string", scenario.id)

		for (const bound of ["min", "max"]) {
			const values = Object.fromEntries(scenario.inputs.map((field) => [field.key, field[bound]]))
			const edge = computeScenario(scenario, values)
			assert.equal(edge.error, null, `${scenario.id} @${bound}: ${edge.error}`)
			assert.equal(typeof scenario.explain(values, edge), "string", `${scenario.id} @${bound}`)
		}
	}
})

test("physics formulas are numerically correct", () => {
	const freefall = getScenario("phys-freefall").compute({ height: 20, gravity: 10, mass: 2 })
	assert.equal(Number(freefall.time.toFixed(6)), 2)
	assert.equal(Number(freefall.vFinal.toFixed(6)), 20)
	assert.equal(Number(freefall.energy.toFixed(6)), 400)

	const projectile = getScenario("phys-projectile").compute({ v0: 10, angle: 45, gravity: 10 })
	assert.equal(Number(projectile.range.toFixed(6)), 10)
	assert.equal(Number(projectile.hMax.toFixed(6)), 2.5)

	const ohm = getScenario("phys-ohm").compute({ voltage: 12, resistance: 6, hours: 2 })
	assert.equal(ohm.I, 2)
	assert.equal(ohm.P, 24)
	assert.equal(Number(ohm.energyKwh.toFixed(6)), 0.048)

	const wave = getScenario("phys-wave").compute({ amplitude: 5, frequency: 2, speed: 340 })
	assert.equal(wave.wavelength, 170)
	assert.equal(wave.period, 0.5)

	const newton = getScenario("phys-newton").compute({ mass: 5, force: 0, friction: 0.5, time: 3 })
	assert.equal(newton.a, 0)
	assert.equal(newton.moving, false)
})

test("math results are numerically correct", () => {
	const quadratic = getScenario("math-quadratic")
	const q = quadratic.compute({ a: 1, b: -3, c: 2, range: 5 })
	assert.deepEqual(
		q.roots.map((x) => Number(x.toFixed(6))),
		[1, 2],
	)
	assert.equal(Number(q.vertexX.toFixed(6)), 1.5)
	assert.equal(quadratic.compute({ a: 1, b: 0, c: 5, range: 5 }).roots.length, 0)
	assert.equal(quadratic.compute({ a: 0, b: 2, c: -4, range: 5 }).roots[0], 2)

	const system = getScenario("math-linear-system")
	const s = system.compute({ a1: 1, b1: 1, c1: 5, a2: 2, b2: -1, c2: 1 })
	assert.equal(Number(s.solution.x.toFixed(6)), 2)
	assert.equal(Number(s.solution.y.toFixed(6)), 3)
	assert.equal(system.compute({ a1: 1, b1: 1, c1: 5, a2: 2, b2: 2, c2: 1 }).solution, null)

	const triangle = getScenario("math-triangle")
	const t = triangle.compute({ a: 3, b: 4, c: 5 })
	assert.equal(Number(t.area.toFixed(6)), 6)
	assert.equal(Math.round(Math.max(...t.angles)), 90)
	assert.equal(t.type, "vu\u00f4ng")
	assert.equal(triangle.compute({ a: 1, b: 1, c: 5 }).valid, false)

	const exponential = getScenario("math-exponential")
	assert.equal(Number(exponential.compute({ initial: 100, rate: 10, periods: 2 }).final.toFixed(6)), 121)
	assert.equal(exponential.compute({ initial: 100, rate: 0, periods: 5 }).doubling, null)

	const trig = getScenario("math-trig").compute({ A: 2, B: 1, C: 0 })
	assert.equal(Number(trig.period.toFixed(4)), Number((2 * Math.PI).toFixed(4)))
})

test("stoichiometry finds the limiting reagent", () => {
	const water = {
		reactants: [
			{ formula: "H2", coef: 2 },
			{ formula: "O2", coef: 1 },
		],
		products: [{ formula: "H2O", coef: 2 }],
		enthalpy: -571.6,
	}
	const r = computeReaction(water, { H2: 2, O2: 5 })
	assert.equal(r.limiting, "H2")
	assert.equal(Number(r.extent.toFixed(6)), 1)
	assert.equal(Number(r.produced[0].moles.toFixed(6)), 2)
	assert.equal(Number(r.consumed.find((item) => item.formula === "O2").leftover.toFixed(6)), 4)
	assert.ok(r.heat > 0, "exothermic reaction releases heat")
	assert.ok(r.produced[0].mass > 0)

	assert.equal(computeReaction(water, { H2: 0, O2: 3 }).extent, 0)
	assert.equal(computeReaction(water, { H2: 4, O2: 2 }).produced[0].moles, 4)

	const endothermic = computeReaction(
		{
			reactants: [{ formula: "CaCO3", coef: 1 }],
			products: [
				{ formula: "CaO", coef: 1 },
				{ formula: "CO2", coef: 1 },
			],
			enthalpy: 178,
		},
		{ CaCO3: 1 },
	)
	assert.ok(endothermic.heat < 0, "endothermic reaction absorbs heat")
})

test("chemistry scenarios report products with defaults", () => {
	const chem = SCENARIOS.filter((scenario) => scenario.subject === "chemistry")
	assert.ok(chem.length >= 6)
	for (const scenario of chem) {
		const result = scenario.compute(defaultValues(scenario))
		assert.ok(result.extent >= 0, scenario.id)
		assert.ok(Array.isArray(result.produced) && result.produced.length > 0, scenario.id)
		assert.ok(Array.isArray(result.consumed) && result.consumed.length > 0, scenario.id)
	}
})

test("probability simulation is deterministic per seed", () => {
	const coin = getScenario("math-coin")
	const a = coin.compute({ flips: 500, p: 0.5, seed: 7 })
	const b = coin.compute({ flips: 500, p: 0.5, seed: 7 })
	assert.equal(a.heads, b.heads)
	assert.ok(Math.abs(a.ratio - 0.5) < 0.1)
	assert.equal(coin.compute({ flips: 100, p: 1, seed: 3 }).heads, 100)
	assert.equal(coin.compute({ flips: 100, p: 0, seed: 3 }).heads, 0)
})

test("search filters by keyword and subject", () => {
	assert.ok(searchScenarios("parabol", null).length > 0)
	assert.ok(searchScenarios("dao dong", null).length > 0)
	assert.ok(searchScenarios("", "physics").every((scenario) => scenario.subject === "physics"))
	assert.equal(searchScenarios("", null).length, SCENARIOS.length)
	assert.equal(searchScenarios("zzzz-khong-ton-tai", null).length, 0)
	assert.equal(getScenario("khong-ton-tai").id, SCENARIOS[0].id)
})

test("utils helpers behave as expected", () => {
	assert.equal(toNumber("3,5", 0), 3.5)
	assert.equal(toNumber("abc", 9), 9)
	assert.equal(fmt(1.23456, 2), "1.23")
	assert.equal(fmt(Number.NaN), "\u2014")
	const rng = makeRng(1)
	for (let i = 0; i < 5; i += 1) {
		const value = rng()
		assert.ok(value >= 0 && value < 1)
	}
	assert.equal(toCsv({ xLabel: "x", yLabel: "y", data: [{ x: 1, y: 2 }] }), "x,y\n1,2")
})
