import { PALETTES, ball, bubble, clear, hud, label } from "../lib/draw.js"
import { fmt, linspace, metric, series } from "../lib/utils.js"

export const MOLAR_MASS = {
	H2: 2.016,
	O2: 31.998,
	H2O: 18.015,
	Na: 22.99,
	Cl2: 70.906,
	NaCl: 58.44,
	Fe: 55.845,
	Fe2O3: 159.69,
	HCl: 36.461,
	NaOH: 39.997,
	C: 12.011,
	CO2: 44.009,
	CaCO3: 100.086,
	CaO: 56.077,
	CH4: 16.043,
}

export function pretty(formula) {
	return formula.replace(/(\d+)/g, "$1")
}

function mass(formula, moles) {
	return (MOLAR_MASS[formula] ?? 0) * moles
}

/**
 * Tinh phan ung theo so mol dau vao: tim chat gioi han, san pham, chat con du va nhiet phan ung.
 */
export function computeReaction(reaction, molesByFormula) {
	const ratios = reaction.reactants.map((item) => ({
		...item,
		moles: Math.max(0, Number(molesByFormula[item.formula] ?? 0)),
	}))
	const extents = ratios.map((item) => item.moles / item.coef)
	const extent = Math.min(...extents)
	const limitingIndex = extents.indexOf(extent)
	const limiting = extent > 0 || ratios.some((r) => r.moles === 0) ? ratios[limitingIndex].formula : null

	const consumed = ratios.map((item) => {
		const used = item.coef * extent
		return {
			formula: item.formula,
			coef: item.coef,
			moles: item.moles,
			used,
			leftover: item.moles - used,
			mass: mass(item.formula, used),
		}
	})

	const produced = reaction.products.map((item) => ({
		formula: item.formula,
		coef: item.coef,
		moles: item.coef * extent,
		mass: mass(item.formula, item.coef * extent),
	}))

	return {
		extent,
		limiting,
		consumed,
		produced,
		heat: -(reaction.enthalpy ?? 0) * extent,
	}
}

function chemScenario(config) {
	const { reaction } = config
	return {
		id: config.id,
		subject: "chemistry",
		title: config.title,
		subtitle: config.subtitle,
		formula: config.equation,
		tags: config.tags,
		theory: config.theory,
		safety: config.safety,
		inputs: reaction.reactants.map((item) => ({
			key: item.formula,
			label: `Số mol ${item.formula}`,
			unit: "mol",
			min: 0,
			max: 10,
			step: 0.1,
			default: item.coef,
		})),
		compute(values) {
			const result = computeReaction(reaction, values)
			const mainProduct = result.produced[0]
			const metrics = [
				metric("Chất giới hạn", result.limiting ?? "—", "", "Chất quyết định lượng sản phẩm"),
				metric("Độ tiến triển", fmt(result.extent), "mol", "Số lần phương trình xảy ra"),
				...result.produced.map((item) =>
					metric(`${item.formula} tạo thành`, fmt(item.moles), "mol", `${fmt(item.mass)} g`),
				),
				...result.consumed
					.filter((item) => item.leftover > 1e-9)
					.map((item) => metric(`${item.formula} còn dư`, fmt(item.leftover), "mol", `${fmt(mass(item.formula, item.leftover))} g`)),
				metric(
					result.heat >= 0 ? "Nhiệt toả ra" : "Nhiệt thu vào",
					fmt(Math.abs(result.heat)),
					"kJ",
					result.heat >= 0 ? "Phản ứng toả nhiệt" : "Phản ứng thu nhiệt",
				),
			]
			const progress = linspace(0, 1, 41).map((p) => ({
				x: Number((p * 100).toFixed(1)),
				y: Number((mainProduct.moles * p).toFixed(4)),
			}))
			const heatSerie = linspace(0, 1, 41).map((p) => ({
				x: Number((p * 100).toFixed(1)),
				y: Number((result.heat * p).toFixed(3)),
			}))
			return {
				...result,
				metrics,
				series: [
					series(`${mainProduct.formula} theo tiến trình`, progress, {
						xLabel: "Tiến trình (%)",
						yLabel: `mol ${mainProduct.formula}`,
					}),
					series("Nhiệt tích lũy", heatSerie, { xLabel: "Tiến trình (%)", yLabel: "kJ" }),
				],
			}
		},
		draw(scene) {
			const { W, H, t, r, palette } = scene
			clear(scene)
			const phase = (Math.sin(t * 1.2) + 1) / 2
			const reactants = r.consumed
			const products = r.produced
			const cy = H / 2

			reactants.forEach((item, index) => {
				const count = Math.min(12, Math.round(item.moles * 2))
				for (let i = 0; i < count; i += 1) {
					const baseX = 70 + index * 70
					const x = baseX + Math.sin(t * 2 + i) * 10 + phase * 40
					const y = cy - 70 + ((i % 6) * 26) + Math.cos(t * 2 + i) * 6
					ball(scene, x, y, 8, index === 0 ? palette.accent : palette.accent2)
				}
				label(scene, item.formula, 60 + index * 70, cy + 100, { color: palette.muted })
			})

			products.forEach((item, index) => {
				const count = Math.min(12, Math.round(item.moles * 2))
				for (let i = 0; i < count; i += 1) {
					const baseX = W - 120 - index * 70
					const x = baseX + Math.cos(t * 2 + i) * 10 - (1 - phase) * 40
					const y = cy - 70 + ((i % 6) * 26) + Math.sin(t * 2 + i) * 6
					bubble(scene, x, y, 9, index === 0 ? palette.warn : palette.danger)
				}
				label(scene, item.formula, W - 130 - index * 70, cy + 100, { color: palette.muted })
			})

			label(scene, config.equation, W / 2, cy + 130, {
				align: "center",
				color: palette.text,
				font: "15px ui-sans-serif, system-ui, sans-serif",
			})
			hud(scene, [
				config.title,
				`Chất giới hạn: ${r.limiting ?? "—"}`,
				`${products[0].formula}: ${fmt(products[0].moles)} mol`,
				`${r.heat >= 0 ? "Toả" : "Thu"} ${fmt(Math.abs(r.heat))} kJ`,
			])
		},
		explain(values, result) {
			const main = result.produced[0]
			const leftovers = result.consumed.filter((item) => item.leftover > 1e-9)
			return [
				`Phương trình: ${config.equation}.`,
				`Với lượng đã nhập, ${result.limiting ?? "không có chất nào"} là chất giới hạn nên phản ứng chỉ xảy ra được ${fmt(result.extent)} lần đơn vị.`,
				`Thu được ${fmt(main.moles)} mol ${main.formula} (≈ ${fmt(main.mass)} g).`,
				leftovers.length
					? `Còn dư: ${leftovers.map((item) => `${fmt(item.leftover)} mol ${item.formula}`).join(", ")}.`
					: "Các chất tham gia vừa đủ, không còn dư.",
				`${result.heat >= 0 ? "Phản ứng toả" : "Phản ứng thu"} khoảng ${fmt(Math.abs(result.heat))} kJ nhiệt.`,
			].join(" ")
		},
	}
}

export const CHEMISTRY_SCENARIOS = [
	chemScenario({
		id: "chem-hydrogen-combustion",
		title: "Đốt khí hydro",
		subtitle: "Phản ứng tạo nước, toả nhiệt mạnh",
		equation: "2H2 + O2 → 2H2O",
		tags: ["toả nhiệt", "chất giới hạn", "khí"],
		theory:
			"Hydro cháy trong oxi tạo nước. Tỉ lệ mol 2:1, nên nếu lượng H2 gấp đôi O2 thì hai chất vừa đủ; lệch tỉ lệ sẽ có chất dư. Đây là cơ sở của pin nhiên liệu hydro.",
		safety: "Hỗn hợp H2/O2 dễ nổ, chỉ thực hiện với lượng rất nhỏ trong phòng thí nghiệm.",
		reaction: {
			reactants: [
				{ formula: "H2", coef: 2 },
				{ formula: "O2", coef: 1 },
			],
			products: [{ formula: "H2O", coef: 2 }],
			enthalpy: -571.6,
		},
	}),
	chemScenario({
		id: "chem-salt-synthesis",
		title: "Tổng hợp muối ăn",
		subtitle: "Natri phản ứng với khí clo",
		equation: "2Na + Cl2 → 2NaCl",
		tags: ["kim loại", "liên kết ion"],
		theory:
			"Natri nhượng 1 electron cho clo tạo liên kết ion. Phản ứng toả nhiệt rất mạnh và cho ngọn lửa vàng đặc trưng của natri.",
		safety: "Na phản ứng mãnh liệt với nước, Cl2 rất độc.",
		reaction: {
			reactants: [
				{ formula: "Na", coef: 2 },
				{ formula: "Cl2", coef: 1 },
			],
			products: [{ formula: "NaCl", coef: 2 }],
			enthalpy: -822,
		},
	}),
	chemScenario({
		id: "chem-neutralization",
		title: "Trung hòa axit – bazơ",
		subtitle: "HCl gặp NaOH tạo muối và nước",
		equation: "HCl + NaOH → NaCl + H2O",
		tags: ["axit", "bazơ", "pH"],
		theory:
			"Ion H⁺ của axit kết hợp OH⁻ của bazơ tạo nước. Khi số mol hai chất bằng nhau, dung dịch trung tính (pH ≈ 7); chất nào dư sẽ quyết định môi trường axit hay kiềm.",
		safety: "Pha loãng trước khi trộn, phản ứng toả nhiệt.",
		reaction: {
			reactants: [
				{ formula: "HCl", coef: 1 },
				{ formula: "NaOH", coef: 1 },
			],
			products: [
				{ formula: "NaCl", coef: 1 },
				{ formula: "H2O", coef: 1 },
			],
			enthalpy: -57.3,
		},
	}),
	chemScenario({
		id: "chem-methane-combustion",
		title: "Đốt khí methane",
		subtitle: "Nhiên liệu khí đốt sinh CO2",
		equation: "CH4 + 2O2 → CO2 + 2H2O",
		tags: ["nhiên liệu", "toả nhiệt", "môi trường"],
		theory:
			"Methane là thành phần chính của khí thiên nhiên. Thiếu oxi sẽ cháy không hoàn toàn và sinh CO độc, vì vậy bếp gas cần lỗ thông khí.",
		safety: "Cháy không hoàn toàn sinh CO rất độc.",
		reaction: {
			reactants: [
				{ formula: "CH4", coef: 1 },
				{ formula: "O2", coef: 2 },
			],
			products: [
				{ formula: "CO2", coef: 1 },
				{ formula: "H2O", coef: 2 },
			],
			enthalpy: -890.3,
		},
	}),
	chemScenario({
		id: "chem-limestone",
		title: "Nung đá vôi",
		subtitle: "Phản ứng thu nhiệt tạo vôi sống",
		equation: "CaCO3 → CaO + CO2",
		tags: ["thu nhiệt", "phân hủy", "công nghiệp"],
		theory:
			"Ở khoảng 900 °C, CaCO3 phân hủy thành vôi sống CaO và khí CO2. Đây là phản ứng thu nhiệt nên cần cấp nhiệt liên tục.",
		safety: "CaO gặp nước toả nhiệt mạnh, gây bỏng.",
		reaction: {
			reactants: [{ formula: "CaCO3", coef: 1 }],
			products: [
				{ formula: "CaO", coef: 1 },
				{ formula: "CO2", coef: 1 },
			],
			enthalpy: 178.3,
		},
	}),
	chemScenario({
		id: "chem-rusting",
		title: "Sắt bị gỉ",
		subtitle: "Oxi hóa sắt trong không khí",
		equation: "4Fe + 3O2 → 2Fe2O3",
		tags: ["ăn mòn", "oxi hóa"],
		theory:
			"Sắt phản ứng chậm với oxi (có hơi nước xúc tiến) tạo oxit sắt màu nâu đỏ. Sơn phủ hay mạ kẽm giúp ngăn oxi tiếp xúc bề mặt.",
		safety: "Không đáng kể, nhưng bụi sắt mịn có thể tự bốc cháy.",
		reaction: {
			reactants: [
				{ formula: "Fe", coef: 4 },
				{ formula: "O2", coef: 3 },
			],
			products: [{ formula: "Fe2O3", coef: 2 }],
			enthalpy: -1648,
		},
	}),
]

export { PALETTES }
