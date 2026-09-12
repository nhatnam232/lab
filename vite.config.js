import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// "base" must match the repository name for GitHub Pages project sites
// (served at https://<user>.github.io/lab/).
export default defineConfig({
	plugins: [react()],
	base: "/lab/",
})
