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
      // All API calls — data lake, models, nanoclaw
      "/api": {
        target: "https://nfl-dashboard.duckdns.org",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
