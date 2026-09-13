import { Component } from "react"

/** Chong trang trang: bat loi render, hien UI loi tieng Viet co nut tai lai. */
export default class ErrorBoundary extends Component {
	constructor(props) {
		super(props)
		this.state = { error: null }
	}

	static getDerivedStateFromError(error) {
		return { error }
	}

	componentDidCatch(error, info) {
		console.error("SciLab lỗi hiển thị:", error, info?.componentStack)
	}

	render() {
		if (!this.state.error) return this.props.children
		return (
			<section className="card space-y-3" role="alert">
				<h2 className="text-base font-semibold text-red-500">Ứng dụng gặp lỗi không mong muốn</h2>
				<pre className="overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
					{String(this.state.error?.message ?? this.state.error)}
				</pre>
				<div className="flex gap-2">
					<button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
						Tải lại trang
					</button>
					<button
						type="button"
						className="btn"
						onClick={() => {
							try {
								window.history.replaceState(null, "", window.location.pathname)
								localStorage.removeItem("scilab:studio:v3")
							} finally {
								window.location.reload()
							}
						}}
					>
						Về mặc định
					</button>
				</div>
			</section>
		)
	}
}
