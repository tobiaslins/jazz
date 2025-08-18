import { defineProject } from "vitest/config";

export default defineProject({
  resolve: {
    // 'browser' for Svelte Testing Library
    // 'node' for "msw/node"
    conditions: ["browser", "node"],
  },
  test: {
    name: "bench",
    include: ["*.bench.ts"],
  },
});
