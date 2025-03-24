import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "jazz-browser-media-images",
    browser: {
      enabled: true,
      provider: "playwright",
      instances: [{ browser: "chromium", headless: true }],
    },
  },
});
