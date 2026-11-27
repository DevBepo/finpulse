import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig(({ mode }) => {
  const { API_PORT = "3000" } = loadEnv(mode, workspaceRoot, "API_PORT");

  return {
    plugins: [react()],
    server: {
      proxy: { "/api": `http://127.0.0.1:${API_PORT}` },
    },
  };
});
