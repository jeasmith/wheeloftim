import nextConfig from "@repo/eslint-config/next.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.{js,mjs,cjs,ts}",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
];
