import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    workspace: [
      {
        test: {
          typecheck: {
            enabled: true,
            checker: "tsc",
          },
          include: ["src/**/*.test.ts"],
          name: "unit",
        },
      },
      {
        test: {
          include: ["src/**/*.test.browser.ts"],
          name: "browser",
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            screenshotFailures: false,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
