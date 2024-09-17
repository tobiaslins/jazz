// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
    root: "./",
    test: {
        coverage: {
            enabled: true,
            provider: "istanbul",
            include: ["packages/*/src/**/*.ts"],
            exclude: ["packages/*/src/tests"],
            reporter: ["html"],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
        include: ["packages/*/tests/**/*.test.ts"],
        watch: false,
        watchExclude: ["**/node_modules/**", "**/dist/**"],
        maxConcurrency: 5,
    },
});