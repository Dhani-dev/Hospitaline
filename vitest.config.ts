import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/bootstrap/**",
        "src/config/**",
        "src/db/**",
        "src/repositories/**",
        "src/server.ts",
        "src/types/**"
      ],
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage"
    }
  }
});
