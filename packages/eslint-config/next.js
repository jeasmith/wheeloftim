import library from "./library.js";
import prettier from "eslint-config-prettier";
import nextPlugin from "@next/eslint-plugin-next";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...library,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["**/*.config.{js,mjs,cjs,ts}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  prettier,
];
