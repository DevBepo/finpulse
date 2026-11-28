import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => {
  const apiPort = loadEnv(mode, workspaceRoot, "API_PORT").API_PORT || "3000";

  return {
    plugins: [react()],
    server: {
      proxy: { "/api": `http://127.0.0.1:${apiPort}` },
    },
  };
});
