import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "jazz-tools",
    include: ["src/**/*.test.{js,ts,svelte}"],
    typecheck: {
      enabled: true,
      checker: "tsc",
    },
  },
});
