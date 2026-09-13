import imageCredits from "./imageCredits.js"

export const CATEGORIES = [
	{ id: "khi", label: "Khí", icon: "💨" },
	{ id: "kimLoai", label: "Kim loại", icon: "🔩" },
	{ id: "axit", label: "Axit", icon: "🧪" },
	{ id: "bazo", label: "Bazơ", icon: "🧫" },
	{ id: "oxit", label: "Oxit", icon: "🪨" },
	{ id: "muoi", label: "Muối", icon: "💠" },
	{ id: "nuoc", label: "Nước", icon: "💧" },
]

/**
 * Catalog chat hoa hoc: cong thuc, khoi luong mol, nhom, trang thai, mau dung dich
 * va anh chup that (tu Wikimedia Commons, chi tiet giay phep trong imageCredits.json).
 */
export const SUBSTANCES = [
	{ id: "h2", formula: "H2", name: "Khối hydro", category: "khi", state: "gas", molarMass: 2.016, color: "#7dd3fc", description: "Khí nhẹ nhất, cháy trong oxi tạo nước." },
	{ id: "o2", formula: "O2", name: "Khí oxi", category: "khi", state: "gas", molarMass: 31.998, color: "#93c5fd", description: "Khí duy trì sự cháy và hô hấp." },
	{ id: "cl2", formula: "Cl2", name: "Khí clo", category: "khi", state: "gas", molarMass: 70.906, color: "#a3e635", description: "Khí màu lục vàng, rất độc." },
	{ id: "ch4", formula: "CH4", name: "Khí methane", category: "khi", state: "gas", molarMass: 16.043, color: "#c084fc", description: "Thành phần chính của khí thiên nhiên." },
	{ id: "co2", formula: "CO2", name: "Khí cacbonic", category: "khi", state: "gas", molarMass: 44.009, color: "#94a3b8", description: "Sản phẩm cháy, gây hiệu ứng nhà kính." },
	{ id: "na", formula: "Na", name: "Natri", category: "kimLoai", state: "solid", molarMass: 22.99, color: "#e2e8f0", description: "Kim loại kiềm mềm, phản ứng mãnh liệt với nước." },
	{ id: "fe", formula: "Fe", name: "Sắt", category: "kimLoai", state: "solid", molarMass: 55.845, color: "#78716c", description: "Kim loại phổ biến nhất, bị gỉ trong không khí ẩm." },
	{ id: "zn", formula: "Zn", name: "Kẽm", category: "kimLoai", state: "solid", molarMass: 65.38, color: "#a1a1aa", description: "Kim loại xanh lục nhạt, tan trong axit tạo khí hydro." },
	{ id: "cu", formula: "Cu", name: "Đồng", category: "kimLoai", state: "solid", molarMass: 63.546, color: "#f59e0b", description: "Kim loại đỏ nâu, dẫn điện rất tốt." },
	{ id: "mg", formula: "Mg", name: "Magie", category: "kimLoai", state: "solid", molarMass: 24.305, color: "#cbd5e1", description: "Kim loại nhẹ, cháy với ánh sáng trắng rực rỡ." },
	{ id: "hcl", formula: "HCl", name: "Axit clohydric", category: "axit", state: "liquid", molarMass: 36.461, color: "#fde047", description: "Axit mạnh trong dạ dày và phòng thí nghiệm." },
	{ id: "naoh", formula: "NaOH", name: "Natri hiđroxit", category: "bazo", state: "solid", molarMass: 39.997, color: "#f8fafc", description: "Xút ăn da — bazơ mạnh, hút ẩm." },
	{ id: "caoh2", formula: "Ca(OH)2", name: "Canxi hiđroxit", category: "bazo", state: "solid", molarMass: 74.093, color: "#fef9c3", description: "Vôi tôi, làm nước vôi trong." },
	{ id: "cao", formula: "CaO", name: "Canxi oxit", category: "oxit", state: "solid", molarMass: 56.077, color: "#f5f5f4", description: "Vôi sống, tỏa nhiệt mạnh khi gặp nước." },
	{ id: "fe2o3", formula: "Fe2O3", name: "Sắt(III) oxit", category: "oxit", state: "solid", molarMass: 159.69, color: "#b45309", description: "Gỉ sắt — bột nâu đỏ, quặng hematit." },
	{ id: "mgo", formula: "MgO", name: "Magie oxit", category: "oxit", state: "solid", molarMass: 40.304, color: "#fafafa", description: "Bột trắng sau khi đốt magie." },
	{ id: "nacl", formula: "NaCl", name: "Natri clorua", category: "muoi", state: "solid", molarMass: 58.44, color: "#f8fafc", description: "Muối ăn — tinh thể ion điển hình." },
	{ id: "caco3", formula: "CaCO3", name: "Canxi cacbonat", category: "muoi", state: "solid", molarMass: 100.086, color: "#e7e5e4", description: "Đá vôi, phấn, vỏ sò ốc." },
	{ id: "zncl2", formula: "ZnCl2", name: "Kẽm clorua", category: "muoi", state: "solid", molarMass: 136.286, color: "#e4e4e7", description: "Muối kẽm tan tốt, dùng hàn kẽm." },
	{ id: "cuso4", formula: "CuSO4", name: "Đồng(II) sunfat", category: "muoi", state: "solid", molarMass: 159.609, color: "#2563eb", description: "Tinh thể xanh lam đẹp, dùng diệt nấm." },
	{ id: "feso4", formula: "FeSO4", name: "Sắt(II) sunfat", category: "muoi", state: "solid", molarMass: 151.908, color: "#16a34a", description: "Tinh thể xanh lục nhạt, bổ sắt." },
	{ id: "h2o", formula: "H2O", name: "Nước", category: "nuoc", state: "liquid", molarMass: 18.015, color: "#38bdf8", description: "Dung môi phổ biến nhất trong phòng thí nghiệm." },
]

const creditsById = new Map(imageCredits.filter((item) => item.id && item.file).map((item) => [item.id, item]))

export const getSubstance = (id) => SUBSTANCES.find((item) => item.id === id) ?? null

/** Gop du lieu thuan voi thong tin anh: {img: "/substances/xx.jpg" | null, credit}. */
export function withImages(substances = SUBSTANCES) {
	return substances.map((item) => {
		const credit = creditsById.get(item.id)
		return {
			...item,
			img: credit ? `/substances/${credit.file}` : null,
			credit: credit ?? null,
		}
	})
}

export const massOf = (id, moles) => {
	const substance = getSubstance(id)
	return substance ? substance.molarMass * moles : 0
}

export const IMAGE_CREDITS = imageCredits
