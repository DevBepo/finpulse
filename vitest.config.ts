import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));
const { TEST_DATABASE_URL } = loadEnv(
  "test",
  workspaceRoot,
  "TEST_DATABASE_URL",
);

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "apps/api/test/**/*.test.ts",
            "packages/contracts/test/**/*.test.ts",
          ],
          exclude: ["**/*.integration.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["apps/api/test/**/*.integration.test.ts"],
          env: { TEST_DATABASE_URL: TEST_DATABASE_URL ?? "" },
        },
      },
      {
        test: {
          name: "web",
          environment: "jsdom",
          include: ["apps/web/test/**/*.test.tsx"],
        },
      },
    ],
  },
});
