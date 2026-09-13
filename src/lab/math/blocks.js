/**
 * Cac khoi ham thanh phan: member bam chon khoi, cong (hoac tru) lai thanh
 * y = ±f₁(x) ± f₂(x) + ... Moi khoi co tham so rieng dieu chinh duoc.
 */

const amplitude = (def = 1) => ({ key: "a", label: "Biên độ a", min: -5, max: 5, step: 0.1, default: def })
const frequency = (def = 1) => ({ key: "b", label: "Tần số b", min: 0.1, max: 6, step: 0.1, default: def })
const phase = () => ({ key: "c", label: "Dịch pha c", min: -6.28, max: 6.28, step: 0.05, default: 0 })

export const BLOCK_TYPES = [
	{
		id: "const",
		label: "c",
		name: "Hằng số",
		description: "Đường thẳng ngang y = c — co giãn theo trục đứng.",
		params: [{ key: "c", label: "Giá trị c", min: -10, max: 10, step: 0.1, default: 1 }],
		fn: (p) => (x) => p.c,
		formula: (p) => `${p.c}`,
	},
	{
		id: "linear",
		label: "x",
		name: "Hàm bậc nhất",
		description: "Đường thẳng qua gốc tọa độ y = a·x.",
		params: [amplitude()],
		fn: (p) => (x) => p.a * x,
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}x`,
	},
	{
		id: "x2",
		label: "x²",
		name: "Bậc hai",
		description: "Parabol cơ bản y = a·x².",
		params: [amplitude()],
		fn: (p) => (x) => p.a * x * x,
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}x²`,
	},
	{
		id: "x3",
		label: "x³",
		name: "Bậc ba",
		description: "Đường bậc ba y = a·x³ — điểm uốn tại gốc.",
		params: [amplitude()],
		fn: (p) => (x) => p.a * x * x * x,
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}x³`,
	},
	{
		id: "sqrt",
		label: "√x",
		name: "Căn bậc hai",
		description: "Chỉ xác định với x ≥ 0.",
		params: [amplitude()],
		fn: (p) => (x) => (x >= 0 ? p.a * Math.sqrt(x) : Number.NaN),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}√x`,
	},
	{
		id: "abs",
		label: "|x|",
		name: "Giá trị tuyệt đối",
		description: "Gãy khúc tại x = 0, luôn không âm.",
		params: [amplitude()],
		fn: (p) => (x) => p.a * Math.abs(x),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}|x|`,
	},
	{
		id: "recip",
		label: "1/x",
		name: "Nghịch đảo",
		description: "Đường hypebol, gián đoạn tại x = 0.",
		params: [amplitude()],
		fn: (p) => (x) => (Math.abs(x) < 1e-9 ? Number.NaN : p.a / x),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}/x`,
	},
	{
		id: "sin",
		label: "sin",
		name: "Sin",
		description: "Dao động tuần hoàn a·sin(b(x − c)).",
		params: [amplitude(), frequency(), phase()],
		fn: (p) => (x) => p.a * Math.sin(p.b * (x - p.c)),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}sin(${p.b}(x − ${p.c}))`,
	},
	{
		id: "cos",
		label: "cos",
		name: "Cos",
		description: "Dao động tuần hoàn a·cos(b(x − c)).",
		params: [amplitude(), frequency(), phase()],
		fn: (p) => (x) => p.a * Math.cos(p.b * (x - p.c)),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}cos(${p.b}(x − ${p.c}))`,
	},
	{
		id: "exp",
		label: "eˣ",
		name: "Mũ",
		description: "Tăng trưởng mũ a·e^(b·x).",
		params: [amplitude(), { key: "b", label: "Hệ số b", min: -3, max: 3, step: 0.1, default: 1 }],
		fn: (p) => (x) => p.a * Math.exp(p.b * x),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}e^(${p.b}x)`,
	},
	{
		id: "ln",
		label: "ln x",
		name: "Logarit",
		description: "Chỉ xác định với x > 0, tăng chậm dần.",
		params: [amplitude()],
		fn: (p) => (x) => (x > 1e-9 ? p.a * Math.log(x) : Number.NaN),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}ln(x)`,
	},
	{
		id: "gauss",
		label: "e^(−x²)",
		name: "Chuông Gauss",
		description: "Đường cong chuông a·e^(−b(x − c)²).",
		params: [amplitude(), { key: "b", label: "Độ dốc b", min: 0.1, max: 4, step: 0.1, default: 1 }, phase()],
		fn: (p) => (x) => p.a * Math.exp(-p.b * (x - p.c) * (x - p.c)),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}e^(−${p.b}(x − ${p.c})²)`,
	},
	{
		id: "sigmoid",
		label: "σ(x)",
		name: "Sigmoit",
		description: "Đường cong S — mô hình tăng trưởng có giới hạn.",
		params: [amplitude(), frequency(), phase()],
		fn: (p) => (x) => p.a / (1 + Math.exp(-p.b * (x - p.c))),
		formula: (p) => `${p.a === 1 ? "" : p.a === -1 ? "−" : p.a}σ(${p.b}(x − ${p.c}))`,
	},
]

export const getBlockType = (id) => BLOCK_TYPES.find((item) => item.id === id) ?? null

export function defaultParams(type) {
	return Object.fromEntries(type.params.map((param) => [param.key, param.default]))
}

export function clampParams(type, raw = {}) {
	const params = defaultParams(type)
	for (const param of type.params) {
		const value = Number(raw[param.key])
		if (Number.isFinite(value)) {
			params[param.key] = Math.min(param.max, Math.max(param.min, value))
		}
	}
	return params
}
