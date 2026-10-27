import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app is per-user (reads the session cookie), so
  // Cache Components' static shell gives no benefit here. Kept off so
  // pages and layouts can read the session directly without Suspense.
  cacheComponents: false,
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
