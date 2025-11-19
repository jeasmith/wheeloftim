/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["./library.js", "next/core-web-vitals", "prettier"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
  },
};

