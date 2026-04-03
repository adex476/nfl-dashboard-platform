import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@nfl/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@nfl/api-client": resolve(
        __dirname,
        "../../packages/api-client/src/index.ts",
      ),
      "@nfl/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Data lake — root-level paths forwarded to production server
      "/health": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/players": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/teams": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/query": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/graph": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/manage": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      // Model platform + NanoClaw
      "/api/models": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
      "/api/nanoclaw": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
