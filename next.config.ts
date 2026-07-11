import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // TypeScript 7 ships the native Go compiler without the legacy JS API
  // that Next.js uses by default. Opt into the project-local `tsc` CLI.
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli
  experimental: {
    useTypeScriptCli: true,
  },
};

export default nextConfig;
