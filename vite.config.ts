import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "")
  const host = env.VITE_HOST?.trim() || "localhost"
  const port = Number(env.VITE_PORT || 5173)
  const previewPort = Number(env.VITE_PREVIEW_PORT || 4173)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host,
      port,
      strictPort: true,
    },
    preview: {
      host,
      port: previewPort,
      strictPort: true,
    },
  }
})
