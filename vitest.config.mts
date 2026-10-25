import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // NFR-MNT-003: business logic (domain and services) and pure utilities stay at 80 % or more.
    // Framework glue (request config, route helpers, Supabase clients) is left to E2E tests.
    coverage: {
      provider: "v8",
      include: [
        "src/features/**/domain/**/*.ts",
        "src/features/**/service.ts",
        "src/lib/i18n/{format,locales,resolve-locale}.ts",
        "src/lib/{validate-env,server-env-schema}.ts",
        "src/design-system/*.ts",
      ],
      exclude: ["**/*.test.{ts,tsx}"],
      reporter: ["text", "html"],
      // Per file, so a weakly tested service cannot hide behind well-tested utilities.
      thresholds: { perFile: true, lines: 80, functions: 80, branches: 80, statements: 80 },
    },
    // Placeholder values so modules that read the environment can load; they are not secrets.
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      RESEND_API_KEY: "re_test",
    },
  },
});
