/**
 * Co so du lieu phan ung: moi phan ung gom chat tham gia (id + he so),
 * san pham, enthalpy (kJ theo phuong trinh nhu viet), dieu kien va
 * goi y hieu ung de man hinh mo phong (effects: gas, flame, glow, color...).
 */
export const REACTIONS = [
	{
		id: "burn-hydrogen",
		equation: "2H2 + O2 -> 2H2O",
		reactants: [
			{ id: "h2", coef: 2 },
			{ id: "o2", coef: 1 },
		],
		products: [{ id: "h2o", coef: 2 }],
		enthalpy: -571.6,
		conditions: "Châm lửa",
		note: "Hydro cháy trong oxi tạo nước, tỏa nhiệt mạnh — cơ sở của pin nhiên liệu.",
		effects: ["flame", "gas"],
		tags: ["tỏa nhiệt", "chất giới hạn", "khí"],
	},
	{
		id: "salt-synthesis",
		equation: "2Na + Cl2 -> 2NaCl",
		reactants: [
			{ id: "na", coef: 2 },
			{ id: "cl2", coef: 1 },
		],
		products: [{ id: "nacl", coef: 2 }],
		enthalpy: -822,
		conditions: "Đun nhẹ",
		note: "Natri nhượng electron cho clo tạo liên kết ion, lửa vàng đặc trưng của natri.",
		effects: ["flame", "glow"],
		tags: ["liên kết ion", "kim loại kiềm"],
	},
	{
		id: "neutralization",
		equation: "HCl + NaOH -> NaCl + H2O",
		reactants: [
			{ id: "hcl", coef: 1 },
			{ id: "naoh", coef: 1 },
		],
		products: [
			{ id: "nacl", coef: 1 },
			{ id: "h2o", coef: 1 },
		],
		enthalpy: -57.3,
		conditions: "Dung dịch",
		note: "H⁺ của axit kết hợp OH⁻ của bazơ tạo nước — phản ứng trung hòa.",
		effects: ["dissolve", "warm"],
		tags: ["axit", "bazơ", "trung hòa"],
	},
	{
		id: "burn-methane",
		equation: "CH4 + 2O2 -> CO2 + 2H2O",
		reactants: [
			{ id: "ch4", coef: 1 },
			{ id: "o2", coef: 2 },
		],
		products: [
			{ id: "co2", coef: 1 },
			{ id: "h2o", coef: 2 },
		],
		enthalpy: -890.3,
		conditions: "Châm lửa",
		note: "Đốt khí thiên nhiên. Thiếu oxi sẽ cháy không hoàn toàn sinh CO độc.",
		effects: ["flame", "gas"],
		tags: ["nhiên liệu", "tỏa nhiệt"],
	},
	{
		id: "decompose-limestone",
		equation: "CaCO3 -> CaO + CO2",
		reactants: [{ id: "caco3", coef: 1 }],
		products: [
			{ id: "cao", coef: 1 },
			{ id: "co2", coef: 1 },
		],
		enthalpy: 178.3,
		conditions: "Nung ~900 °C",
		note: "Nung đá vôi thu vôi sống và khí CO2 — phản ứng thu nhiệt cần cấp nhiệt liên tục.",
		effects: ["heat", "gas"],
		tags: ["thu nhiệt", "phân hủy", "công nghiệp"],
	},
	{
		id: "rusting",
		equation: "4Fe + 3O2 -> 2Fe2O3",
		reactants: [
			{ id: "fe", coef: 4 },
			{ id: "o2", coef: 3 },
		],
		products: [{ id: "fe2o3", coef: 2 }],
		enthalpy: -1648,
		conditions: "Không khí ẩm",
		note: "Sắt oxy hóa chậm thành gỉ (thực tế là Fe₂O₃·nH₂O có hơi nước xúc tiến).",
		effects: ["color"],
		tags: ["ăn mòn", "oxy hóa"],
	},
	{
		id: "zinc-acid",
		equation: "Zn + 2HCl -> ZnCl2 + H2",
		reactants: [
			{ id: "zn", coef: 1 },
			{ id: "hcl", coef: 2 },
		],
		products: [
			{ id: "zncl2", coef: 1 },
			{ id: "h2", coef: 1 },
		],
		enthalpy: -152,
		conditions: "Dung dịch",
		note: "Kẽm tan trong axit tạo muối và bọt khí hydro — cách điều chế H₂ trong phòng thí nghiệm.",
		effects: ["gas", "dissolve"],
		tags: ["kim loại hoạt động", "điều chế khí"],
	},
	{
		id: "iron-copper",
		equation: "Fe + CuSO4 -> FeSO4 + Cu",
		reactants: [
			{ id: "fe", coef: 1 },
			{ id: "cuso4", coef: 1 },
		],
		products: [
			{ id: "feso4", coef: 1 },
			{ id: "cu", coef: 1 },
		],
		enthalpy: -153,
		conditions: "Dung dịch",
		note: "Đảo sắt vào dung dịch xanh lam: sắt đẩy đồng ra, dung dịch nhạt dần sang xanh lục.",
		effects: ["color", "dissolve"],
		tags: ["dãy hoạt động hóa học", "đẩy đồng"],
	},
	{
		id: "burn-magnesium",
		equation: "2Mg + O2 -> 2MgO",
		reactants: [
			{ id: "mg", coef: 2 },
			{ id: "o2", coef: 1 },
		],
		products: [{ id: "mgo", coef: 2 }],
		enthalpy: -1203.2,
		conditions: "Châm lửa",
		note: "Magie cháy với ánh sáng trắng chói — nguồn sáng flash và pháo hoa cũ.",
		effects: ["flame", "glow"],
		tags: ["tỏa nhiệt mạnh", "ánh sáng"],
	},
	{
		id: "slake-lime",
		equation: "CaO + H2O -> Ca(OH)2",
		reactants: [
			{ id: "cao", coef: 1 },
			{ id: "h2o", coef: 1 },
		],
		products: [{ id: "caoh2", coef: 1 }],
		enthalpy: -65.2,
		conditions: "Ở nhiệt độ thường",
		note: "Tôi vôi: vôi sống gặp nước thành vôi tôi, bốc khói nóng — phản ứng tỏa nhiệt rõ rệt.",
		effects: ["warm", "dissolve"],
		tags: ["tỏa nhiệt", "vôi"],
	},
]

export const getReaction = (id) => REACTIONS.find((item) => item.id === id) ?? null
