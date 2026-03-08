# Wheel of Tim

Wheel of Tim is a spin-the-wheel app for picking a random name.

## MVP Features

- Add names through the UI
- Edit or remove existing names
- Keep your list between visits
- Spin an animated wheel to choose a winner at random
- Use the app on desktop or mobile

## Local Development

1. Enable Corepack if needed with `corepack enable`
2. Install dependencies with `pnpm install`
3. Start the app with `pnpm dev`
4. Open `http://localhost:3000`

## Testing

- Run unit and component tests with `pnpm test`
- Create a production build with `pnpm build`

## Deploying to Vercel

1. Push the repository to GitHub
2. Import the project into Vercel
3. Use the default Next.js build settings

No environment variables or backend services are required for the MVP.

## Package Manager

This repository is pinned to `pnpm` via the `packageManager` field in `package.json`.
Package installation is guarded by a `preinstall` check, so use `pnpm` for dependency changes going forward.

## License

MIT License — see [LICENSE](LICENSE) for details.
