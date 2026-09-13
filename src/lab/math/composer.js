import { BLOCK_TYPES, clampParams, getBlockType } from "./blocks.js"
import { linspace, samplePoints } from "../../lib/utils.js"

/**
 * Composer: cong cac khoi ham (co dau +/-) thanh mot ham tong.
 * blocks: [{uid, typeId, sign, params}] — toan bo ham thuan, test duoc.
 */

let uidCounter = 0
export const nextUid = () => `b${Date.now().toString(36)}${(uidCounter += 1)}`

/** Chuoi cong thuc hien thi: "+ 2sin(1(x − 0)) − x² ...". */
export function formulaText(blocks) {
	const parts = blocks.map((block, index) => {
		const type = getBlockType(block.typeId)
		if (!type) return null
		const formula = type.formula(clampParams(type, block.params))
		const sign = block.sign < 0 ? "−" : "+"
		return `${index === 0 && block.sign > 0 ? "" : `${sign} `}${formula}`
	})
	return parts.filter(Boolean).join(" ") || "0"
}

export function compose(blocks) {
	const parts = []
	for (const block of blocks) {
		const type = getBlockType(block.typeId)
		if (!type) continue
		const params = clampParams(type, block.params)
		parts.push({
			block,
			type,
			params,
			f: type.fn(params),
			label: type.formula(params),
		})
	}
	const fn = (x) => {
		let sum = 0
		for (const part of parts) {
			const value = part.f(x)
			if (!Number.isFinite(value)) return Number.NaN
			sum += part.block.sign < 0 ? -value : value
		}
		return sum
	}
	return { fn, parts }
}

/** Dao ham so: (f(x+h) − f(x−h)) / 2h. */
export function numericDerivative(fn, x, h = 1e-4) {
	const left = fn(x - h)
	const right = fn(x + h)
	if (!Number.isFinite(left) || !Number.isFinite(right)) return Number.NaN
	return (right - left) / (2 * h)
}

/** Tich phan xap xi Simpson; tra NaN neu khoang co diem khong xac dinh. */
export function simpsonIntegral(fn, from, to, n = 400) {
	if (from >= to) return Number.NaN
	const steps = n % 2 === 0 ? n : n + 1
	const h = (to - from) / steps
	let sum = 0
	for (let i = 0; i <= steps; i += 1) {
		const x = from + i * h
		const y = fn(x)
		if (!Number.isFinite(y)) return Number.NaN
		const factor = i === 0 || i === steps ? 1 : i % 2 === 1 ? 4 : 2
		sum += factor * y
	}
	return (h / 3) * sum
}

/** Do thi ham tong + ( tuy chon ) dao ham. Bo cac diem NaN/gian doan. */
export function buildSeries(blocks, from, to, count = 240, withDerivative = false) {
	const { fn } = compose(blocks)
	const main = samplePoints(fn, from, to, count)
	const result = [
		{ label: "y = tổng các khối", data: main, xLabel: "x", yLabel: "y" },
	]
	if (withDerivative && blocks.length > 0) {
		const derivative = samplePoints((x) => numericDerivative(fn, x), from, to, count)
		result.push({ label: "y′ (đạo hàm)", data: derivative, xLabel: "x", yLabel: "y′" })
	}
	return result
}

/** Gia tri doc tai mot x cu the + thanh phan. */
export function evaluateAt(blocks, x) {
	const { fn, parts } = compose(blocks)
	const total = fn(x)
	const contributions = parts.map((part) => {
		const value = part.f(x)
		return {
			label: part.label,
			sign: part.block.sign,
			value: Number.isFinite(value) ? Number((value * (part.block.sign < 0 ? -1 : 1)).toFixed(6)) : null,
		}
	})
	return { x, total: Number.isFinite(total) ? Number(total.toFixed(6)) : null, contributions }
}

/** Share: "m=math&b=sin:1:1,1,0;x2:-1:1" (typeId:sign:params theo thu tu khai bao). */
export function buildMathShare(blocks) {
	const encoded = blocks
		.map((block) => {
			const type = getBlockType(block.typeId)
			if (!type) return null
			const params = clampParams(type, block.params)
			const values = type.params.map((param) => Number(params[param.key].toFixed(4)))
			return `${block.typeId}:${block.sign < 0 ? -1 : 1}:${values.join(",")}`
		})
		.filter(Boolean)
		.join(";")
	return encoded ? `m=math&b=${encoded}` : "m=math"
}

export function parseMathShare(params) {
	const raw = params.get("b") ?? ""
	const blocks = []
	for (const chunk of raw.split(";")) {
		if (!chunk) continue
		const [typeId, signRaw, valuesRaw] = chunk.split(":")
		const type = getBlockType(typeId)
		if (!type) continue
		const values = (valuesRaw ?? "").split(",").map(Number)
		const params2 = {}
		type.params.forEach((param, index) => {
			params2[param.key] = Number.isFinite(values[index]) ? values[index] : param.default
		})
		blocks.push({
			uid: nextUid(),
			typeId,
			sign: Number(signRaw) < 0 ? -1 : 1,
			params: clampParams(type, params2),
		})
	}
	return blocks
}
