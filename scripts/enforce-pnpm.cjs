const userAgent = process.env.npm_config_user_agent || "";

if (!userAgent.startsWith("pnpm/")) {
  console.error("This repository uses pnpm. Run commands with `pnpm`, not npm or yarn.");
  process.exit(1);
}
