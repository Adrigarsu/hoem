import type { NextConfig } from "next";

// The app refuses to start or build if a variable is missing. env.ts validates on import;
// server-env.ts cannot be imported here because of its server-only guard.
import "./src/lib/env";
import { parseServerEnv } from "./src/lib/server-env-schema";

parseServerEnv(process.env);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
