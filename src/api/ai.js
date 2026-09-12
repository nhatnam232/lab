const API_KEY = import.meta.env?.VITE_CLAUDE_API_KEY ?? ""
const API_URL = import.meta.env?.VITE_CLAUDE_API_URL ?? "https://api.anthropic.com/v1/messages"
const MODEL = import.meta.env?.VITE_CLAUDE_MODEL ?? "claude-3-5-haiku-latest"

export const hasAiKey = Boolean(API_KEY)

function buildPrompt(scenario, values, result) {
	const inputs = scenario.inputs
		.map((field) => `- ${field.label}: ${values[field.key]} ${field.unit ?? ""}`.trim())
		.join("\n")
	const metrics = (result.metrics ?? [])
		.map((item) => `- ${item.label}: ${item.value} ${item.unit ?? ""}`.trim())
		.join("\n")
	return [
		`Thí nghiệm: ${scenario.title} (${scenario.formula})`,
		`Dữ kiện:\n${inputs}`,
		`Kết quả tính được:\n${metrics}`,
		"Hãy giải thích ngắn gọn bằng tiếng Việt cho học sinh phổ thông: nêu ý nghĩa công thức, cách suy ra kết quả trên và một nhận xét thực tế. Tối đa 4 câu, không dùng markdown.",
	].join("\n\n")
}

/** Giai thich ket qua: uu tien AI, khong co key thi dung loi giai offline. */
export async function explainWithAi(scenario, values, result) {
	const offline = scenario.explain(values, result)
	if (!hasAiKey) return { text: offline, source: "offline" }

	try {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-api-key": API_KEY,
				"anthropic-version": "2023-06-01",
				"anthropic-dangerous-direct-browser-access": "true",
			},
			body: JSON.stringify({
				model: MODEL,
				max_tokens: 400,
				messages: [{ role: "user", content: buildPrompt(scenario, values, result) }],
			}),
		})

		if (!response.ok) throw new Error(`HTTP ${response.status}`)
		const data = await response.json()
		const text = (data?.content ?? [])
			.filter((part) => part.type === "text")
			.map((part) => part.text)
			.join("\n")
			.trim()
		return text ? { text, source: "ai" } : { text: offline, source: "offline" }
	} catch (error) {
		return {
			text: offline,
			source: "offline",
			error: error instanceof Error ? error.message : String(error),
		}
	}
}
