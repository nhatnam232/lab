// Reaction presets for the "Fill & See" chemistry module.
// Each preset is looked up by matching the user's input reactants
// (order independent, case-insensitive) against `reactants`.

const REACTIONS = [
	{
		id: "combustion-hydrogen",
		reactants: ["H2", "O2"],
		balanced: "2H₂ + O₂ → 2H₂O",
		product: "H₂O",
		state: "Lỏng (ở nhiệt độ phòng)",
		color: "#38bdf8",
		danger: "An toàn — sản phẩm là nước. Phản ứng tỏa nhiệt mạnh (nổ) khi xảy ra nhanh.",
		applications: "Nước uống, hơi nước, pin nhiên liệu hydro.",
		animation: "spark",
	},
	{
		id: "ionize-salt",
		reactants: ["NaCl"],
		balanced: "NaCl → Na⁺ + Cl⁻",
		product: "Na⁺ + Cl⁻ (ion hóa trong nước)",
		state: "Dung dịch ion",
		color: "#a3e635",
		danger: "Muối ăn an toàn; Na kim loại nguyên chất phản ứng mạnh với nước.",
		applications: "Muối ăn, điện phân dung dịch, truyền dịch y tế.",
		animation: "ionize",
	},
	{
		id: "rust",
		reactants: ["Fe", "O2"],
		balanced: "4Fe + 3O₂ → 2Fe₂O₃",
		product: "Fe₂O₃ (gỉ sét)",
		state: "Rắn, màu đỏ cam",
		color: "#f97316",
		danger: "Không nguy hiểm, nhưng làm suy yếu kết cấu kim loại theo thời gian.",
		applications: "Ăn mòn kim loại, lớp gỉ bảo vệ/phá hủy công trình.",
		animation: "rust",
	},
	{
		id: "neutralize",
		reactants: ["HCl", "NaOH"],
		balanced: "HCl + NaOH → NaCl + H₂O",
		product: "NaCl + H₂O",
		state: "Dung dịch trung tính (pH ≈ 7)",
		color: "#34d399",
		danger: "HCl và NaOH ăn mòn riêng lẻ; sau trung hòa thì an toàn.",
		applications: "Xử lý chất thải axit/bazơ, cân bằng pH trong y tế và nông nghiệp.",
		animation: "neutralize",
	},
	{
		id: "burn-carbon",
		reactants: ["C", "O2"],
		balanced: "C + O₂ → CO₂",
		product: "CO₂",
		state: "Khí",
		color: "#94a3b8",
		danger: "CO₂ gây ngạt ở nồng độ cao trong không gian kín.",
		applications: "Đốt cháy nhiên liệu, hô hấp tế bào, hiệu ứng nhà kính.",
		animation: "burn",
	},
]

function normalize(value) {
	return (value ?? "")
		.toString()
		.trim()
		.replace(/\s+/g, "")
		.replace(/\u2082/g, "2")
		.replace(/\u2083/g, "3")
		.toUpperCase()
}

export function getReaction(reactantA, reactantB) {
	const a = normalize(reactantA)
	const b = normalize(reactantB)
	const inputs = [a, b].filter(Boolean)
	if (inputs.length === 0) return null

	return (
		REACTIONS.find((reaction) => {
			const wanted = reaction.reactants.map(normalize)
			if (wanted.length !== inputs.length) return false
			const sortedWanted = [...wanted].sort()
			const sortedInputs = [...inputs].sort()
			return sortedWanted.every((value, index) => value === sortedInputs[index])
		}) ?? null
	)
}

export const CHEMISTRY_PRESETS = REACTIONS.map((reaction) => ({
	id: reaction.id,
	label: reaction.reactants.join(" + "),
	reactantA: reaction.reactants[0],
	reactantB: reaction.reactants[1] ?? "",
}))
