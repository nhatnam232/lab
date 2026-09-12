export const GRAVITY = 9.8

export function newtonMotion(mass, force) {
	const m = Number(mass)
	const f = Number(force)
	if (!m || m <= 0 || Number.isNaN(f)) return null
	const acceleration = f / m
	const points = []
	for (let t = 0; t <= 3; t += 0.2) {
		points.push({ t: Number(t.toFixed(1)), v: Number((acceleration * t).toFixed(2)) })
	}
	return { type: "newton", mass: m, force: f, acceleration, points }
}

export function freeFall(height, gravity = GRAVITY) {
	const h = Number(height)
	if (!h || h <= 0) return null
	const time = Math.sqrt((2 * h) / gravity)
	const finalVelocity = gravity * time
	const points = []
	const step = time / 12 || 1
	for (let t = 0; t <= time; t += step) {
		const fallen = 0.5 * gravity * t * t
		points.push({ t: Number(t.toFixed(2)), h: Number(Math.max(h - fallen, 0).toFixed(2)) })
	}
	return { type: "freefall", height: h, gravity, time, finalVelocity, points }
}

export function pendulum(length, angleDeg) {
	const l = Number(length)
	const angle = Number(angleDeg)
	if (!l || l <= 0 || Number.isNaN(angle)) return null
	const period = 2 * Math.PI * Math.sqrt(l / GRAVITY)
	return { type: "pendulum", length: l, angleDeg: angle, period }
}

export function soundWave(frequency) {
	const f = Number(frequency)
	if (!f || f <= 0) return null
	const speedOfSound = 343
	const wavelength = speedOfSound / f
	const points = []
	for (let x = 0; x <= 2; x += 0.02) {
		points.push({ x: Number(x.toFixed(2)), y: Number(Math.sin(2 * Math.PI * f * x * 0.01).toFixed(3)) })
	}
	return { type: "wave", frequency: f, wavelength, points }
}

export function circuit(resistance, voltage) {
	const r = Number(resistance)
	const v = Number(voltage)
	if (!r || r <= 0 || Number.isNaN(v)) return null
	const current = v / r
	const power = current * current * r
	return { type: "circuit", resistance: r, voltage: v, current, power }
}
