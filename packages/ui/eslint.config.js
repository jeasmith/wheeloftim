import libraryConfig from "@repo/eslint-config/library.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.{js,mjs,cjs,ts}",
    ],
  },
  ...libraryConfig,
];
