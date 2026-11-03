import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The app refuses to start or build if a variable is missing. env.ts validates on import;
// server-env.ts cannot be imported here because of its server-only guard.
import "./src/lib/env";
import { parseServerEnv } from "./src/lib/server-env-schema";

parseServerEnv(process.env);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  experimental: {
    // src/app/global-not-found.tsx: the 404 page for URLs outside the [locale] layout.
    globalNotFound: true,
    // FR-ACC-007: a profile photo goes through a Server Action (ADR-016), up to 2 MB plus the form's
    // own overhead. The default limit is 1 MB.
    serverActions: { bodySizeLimit: "3mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

export default withNextIntl(nextConfig);
