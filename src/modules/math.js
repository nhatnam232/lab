export function quadratic(a, b, c) {
	const A = Number(a)
	const B = Number(b)
	const C = Number(c)
	if ([A, B, C].some((n) => Number.isNaN(n))) return null

	const points = []
	for (let x = -10; x <= 10; x += 0.5) {
		points.push({ x, y: A * x * x + B * x + C })
	}

	let roots = []
	if (A !== 0) {
		const discriminant = B * B - 4 * A * C
		if (discriminant > 0) {
			const sqrtD = Math.sqrt(discriminant)
			roots = [(-B + sqrtD) / (2 * A), (-B - sqrtD) / (2 * A)]
		} else if (discriminant === 0) {
			roots = [-B / (2 * A)]
		}
	} else if (B !== 0) {
		roots = [-C / B]
	}

	const vertex = A !== 0 ? { x: -B / (2 * A), y: C - (B * B) / (4 * A) } : null

	return { type: "quadratic", a: A, b: B, c: C, points, roots, vertex, yIntercept: C }
}

export function triangle(sideA, sideB, sideC) {
	const a = Number(sideA)
	const b = Number(sideB)
	const c = Number(sideC)
	if ([a, b, c].some((n) => !n || n <= 0)) return null
	const isValid = a + b > c && b + c > a && a + c > b
	if (!isValid) return { type: "triangle", a, b, c, isValid: false }
	const s = (a + b + c) / 2
	const area = Math.sqrt(s * (s - a) * (s - b) * (s - c))
	return { type: "triangle", a, b, c, isValid: true, area, perimeter: a + b + c }
}

export function coinTossSeries(flips) {
	const n = Math.max(1, Math.min(500, Math.round(Number(flips) || 0)))
	const points = []
	let heads = 0
	for (let i = 1; i <= n; i++) {
		if (Math.random() < 0.5) heads += 1
		points.push({ i, ratio: Number((heads / i).toFixed(3)) })
	}
	return { type: "coin", flips: n, heads, ratio: heads / n, points }
}
