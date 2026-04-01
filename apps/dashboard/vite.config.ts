import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@nfl/types":      resolve(__dirname, "../../packages/types/src/index.ts"),
      "@nfl/api-client": resolve(__dirname, "../../packages/api-client/src/index.ts"),
      "@nfl/ui":         resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // In dev, /api/data-lake/... → http://localhost:8000/...
      "/api/data-lake": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/data-lake/, ""),
      },
      // In dev, /api/models/... → http://localhost:8001/...
      "/api/models": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/models/, ""),
      },
      // In dev, /api/nanoclaw/... → http://localhost:8002/...
      "/api/nanoclaw": {
        target: "http://localhost:8002",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/nanoclaw/, ""),
      },
    },
  },
});