// Lightweight wrapper for generating natural-language explanations.
//
// When VITE_CLAUDE_API_KEY (and optionally VITE_CLAUDE_API_URL) are set, this
// calls the Claude Messages API directly from the client for prototyping.
// For production, proxy this call through your own backend instead of
// exposing the API key in the browser.
//
// Without an API key, it falls back to a local heuristic explanation so the
// app still works fully offline.

const DEFAULT_API_URL = "https://api.anthropic.com/v1/messages"

export async function explainResult(module, scenario, result) {
	const apiKey = import.meta.env.VITE_CLAUDE_API_KEY

	if (!apiKey) {
		return localExplanation(module, scenario, result)
	}

	try {
		const response = await fetch(import.meta.env.VITE_CLAUDE_API_URL || DEFAULT_API_URL, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-3-5-haiku-latest",
				max_tokens: 200,
				messages: [{ role: "user", content: buildPrompt(module, scenario, result) }],
			}),
		})
		if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
		const data = await response.json()
		return data?.content?.[0]?.text?.trim() || localExplanation(module, scenario, result)
	} catch (error) {
		console.warn("Falling back to local explanation:", error)
		return localExplanation(module, scenario, result)
	}
}

function buildPrompt(module, scenario, result) {
	return `Giải thích ngắn gọn (2-3 câu, tiếng Việt, dễ hiểu cho học sinh) kết quả sau đây trong môn ${module}, kịch bản ${scenario}: ${JSON.stringify(
		result,
	)}`
}

function localExplanation(module, scenario, result) {
	if (!result) return "Điền các giá trị vào equation panel để xem giải thích."

	if (module === "chemistry") {
		return `Phản ứng tạo ra ${result.product}, ở trạng thái ${result.state}. ${result.danger}`
	}

	if (module === "physics") {
		if (result.type === "newton") {
			return `Với khối lượng ${result.mass} kg và lực ${result.force} N, gia tốc là a = F/m ≈ ${result.acceleration.toFixed(2)} m/s².`
		}
		if (result.type === "freefall") {
			return `Vật rơi từ độ cao ${result.height} m sẽ chạm đất sau ≈ ${result.time.toFixed(2)} s với vận tốc ≈ ${result.finalVelocity.toFixed(2)} m/s.`
		}
		if (result.type === "pendulum") {
			return `Con lắc dài ${result.length} m dao động với chu kỳ T ≈ ${result.period.toFixed(2)} s (xấp xỉ góc nhỏ).`
		}
		if (result.type === "wave") {
			return `Tần số ${result.frequency} Hz cho bước sóng λ ≈ ${result.wavelength.toFixed(2)} m trong không khí.`
		}
		if (result.type === "circuit") {
			return `Với R = ${result.resistance} Ω và V = ${result.voltage} V, dòng điện I ≈ ${result.current.toFixed(2)} A, công suất ≈ ${result.power.toFixed(2)} W.`
		}
	}

	if (module === "math") {
		if (result.type === "quadratic") {
			const rootsText = result.roots.length ? result.roots.map((r) => r.toFixed(2)).join(", ") : "không có nghiệm thực"
			return `Parabol có đỉnh tại (${result.vertex?.x.toFixed(2)}, ${result.vertex?.y.toFixed(2)}) và nghiệm: ${rootsText}.`
		}
		if (result.type === "triangle") {
			return result.isValid
				? `Tam giác hợp lệ với diện tích ≈ ${result.area.toFixed(2)} (đơn vị vuông).`
				: `Ba cạnh ${result.a}, ${result.b}, ${result.c} không tạo thành một tam giác hợp lệ.`
		}
		if (result.type === "coin") {
			return `Sau ${result.flips} lần tung, tỉ lệ mặt ngửa ≈ ${(result.ratio * 100).toFixed(1)}%, tiến dần về 50% theo luật số lớn.`
		}
	}

	return "Chưa có giải thích cho kết quả này."
}
