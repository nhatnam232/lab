export default function InfoPanel({ module, result, explanation }) {
	return (
		<div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">📊 Info Panel</h3>
			{!result && <p className="text-sm text-slate-500">Điền các giá trị ở trên để xem thông tin chi tiết.</p>}

			{result && module === "chemistry" && (
				<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					<dt className="text-slate-500">Phương trình</dt>
					<dd className="text-slate-100">{result.balanced}</dd>
					<dt className="text-slate-500">Sản phẩm</dt>
					<dd className="text-slate-100">{result.product}</dd>
					<dt className="text-slate-500">Trạng thái</dt>
					<dd className="text-slate-100">{result.state}</dd>
					<dt className="text-slate-500">An toàn</dt>
					<dd className="text-slate-100">{result.danger}</dd>
					<dt className="text-slate-500">Ứng dụng</dt>
					<dd className="text-slate-100">{result.applications}</dd>
				</dl>
			)}

			{result && module === "physics" && (
				<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					{result.type === "newton" && (
						<>
							<dt className="text-slate-500">Gia tốc a</dt>
							<dd className="text-slate-100">{result.acceleration.toFixed(2)} m/s²</dd>
						</>
					)}
					{result.type === "freefall" && (
						<>
							<dt className="text-slate-500">Thời gian rơi</dt>
							<dd className="text-slate-100">{result.time.toFixed(2)} s</dd>
							<dt className="text-slate-500">Vận tốc chạm đất</dt>
							<dd className="text-slate-100">{result.finalVelocity.toFixed(2)} m/s</dd>
						</>
					)}
					{result.type === "pendulum" && (
						<>
							<dt className="text-slate-500">Chu kỳ T</dt>
							<dd className="text-slate-100">{result.period.toFixed(2)} s</dd>
						</>
					)}
				</dl>
			)}

			{result && module === "math" && (
				<dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
					{result.type === "quadratic" && (
						<>
							<dt className="text-slate-500">Đỉnh</dt>
							<dd className="text-slate-100">
								{result.vertex ? `(${result.vertex.x.toFixed(2)}, ${result.vertex.y.toFixed(2)})` : "—"}
							</dd>
							<dt className="text-slate-500">Nghiệm</dt>
							<dd className="text-slate-100">{result.roots.length ? result.roots.map((r) => r.toFixed(2)).join(", ") : "Vô nghiệm thực"}</dd>
							<dt className="text-slate-500">Giao Oy</dt>
							<dd className="text-slate-100">{result.yIntercept}</dd>
						</>
					)}
					{result.type === "triangle" && (
						<>
							<dt className="text-slate-500">Hợp lệ</dt>
							<dd className="text-slate-100">{result.isValid ? "Có" : "Không"}</dd>
							{result.isValid && (
								<>
									<dt className="text-slate-500">Diện tích</dt>
									<dd className="text-slate-100">{result.area.toFixed(2)}</dd>
								</>
							)}
						</>
					)}
					{result.type === "coin" && (
						<>
							<dt className="text-slate-500">Số lần ngửa</dt>
							<dd className="text-slate-100">
								{result.heads} / {result.flips}
							</dd>
							<dt className="text-slate-500">Tỉ lệ</dt>
							<dd className="text-slate-100">{(result.ratio * 100).toFixed(1)}%</dd>
						</>
					)}
				</dl>
			)}

			<div className="mt-2 rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">
				<span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">🤖 Giải thích AI</span>
				{explanation || "Đang tạo giải thích…"}
			</div>
		</div>
	)
}
