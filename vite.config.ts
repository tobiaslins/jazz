// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./",
  test: {
    projects: [
      "packages/*",
      // "tests/browser-integration",
      "tests/cloudflare-workers",
    ],
    maxConcurrency: 5,
  },
});
