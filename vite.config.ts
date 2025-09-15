// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "./",
  test: {
    projects: [
      "bench",
      "packages/*",
      "tests/browser-integration",
      "tests/cloudflare-workers",
      "tests/vercel-functions",
    ],
    maxConcurrency: 5,
  },
});
