# MCP (Model Context Protocol) Setup for Next.js

## Status: ✅ Configured

MCP is already set up and ready to use with your Next.js 16 application.

## Configuration Details

### 1. MCP Server Configuration

The MCP server is configured in your Cursor settings at `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

This configuration uses the official `next-devtools-mcp` package which provides:
- Runtime diagnostics and live state access
- Development automation tools
- Knowledge base and documentation access

### 2. Next.js Configuration

Your Next.js 16 app is properly configured:

**File**: `apps/web/next.config.js`
```javascript
const nextConfig = {
  cacheComponents: true,  // Enables Partial Prerendering
  reactStrictMode: true,
};
```

**Important**: Next.js 16+ has MCP enabled by default in the dev server. No additional configuration is needed in `next.config.js`.

### 3. How It Works

According to the [next-devtools-mcp documentation](https://github.com/vercel/next-devtools-mcp):

1. **Auto-Discovery**: When you run `bun dev`, the Next.js dev server starts with MCP enabled at `http://localhost:3000/_next/mcp`
2. **MCP Server Connection**: The `next-devtools-mcp` package automatically discovers and connects to your running dev server
3. **Runtime Access**: Coding agents can query:
   - Real-time build and runtime errors
   - Application routes, pages, and component metadata
   - Development server logs and diagnostics
   - Server Actions and component hierarchies

## Available MCP Tools

Once your dev server is running, the following tools are available:

### Runtime Diagnostics (Next.js 16+)
- `get_errors` - Get current build, runtime, and type errors
- `get_logs` - Get path to development log file
- `get_page_metadata` - Query application routes, pages, and component metadata
- `get_project_metadata` - Get project structure, config, and dev server URL
- `get_server_action_by_id` - Look up Server Actions by ID

### Development Automation
- `upgrade_nextjs_16` - Automated Next.js 16 upgrades with codemods
- `enable_cache_components` - Cache Components migration and setup with automated fixes

### Browser Testing
- Browser automation via Playwright integration

## Usage

### Starting the Dev Server

```bash
cd /Users/jamessmith/Documents/GitHub/wheeloftim
bun dev
```

The dev server will start on `http://localhost:3000` with MCP enabled automatically.

### Using MCP Tools

Once the dev server is running, you can use MCP tools through your coding agent (Cursor). For example:

- "Next Devtools, what errors are in my Next.js app?"
- "Next Devtools, show me my application routes"
- "Next Devtools, what's in the dev server logs?"

## Verification

To verify MCP is working:

1. **Start the dev server**:
   ```bash
   bun dev
   ```

2. **Check MCP endpoint** (in another terminal):
   ```bash
   curl http://localhost:3000/_next/mcp
   ```
   You should see a response indicating the MCP endpoint is active.

3. **Use MCP tools in Cursor**: Ask questions about your Next.js app, and the agent should be able to query runtime information.

## Troubleshooting

### MCP Not Working?

1. **Verify Next.js version**: Ensure you're using Next.js 16+
   ```bash
   cd apps/web && cat package.json | grep next
   ```

2. **Check dev server is running**: MCP only works when the dev server is active
   ```bash
   lsof -i :3000
   ```

3. **Verify MCP server configuration**: Check `~/.cursor/mcp.json` is correct

4. **Restart Cursor**: After configuring MCP, restart Cursor to load the new configuration

### Port Conflicts

If port 3000 is in use, Next.js will use the next available port. The MCP server will auto-discover the correct port.

## Additional Resources

- [next-devtools-mcp GitHub Repository](https://github.com/vercel/next-devtools-mcp)
- [Next.js MCP Documentation](https://nextjs.org/docs)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

## Privacy & Telemetry

The `next-devtools-mcp` package collects anonymous usage telemetry. To disable:

```bash
export NEXT_TELEMETRY_DISABLED=1
```

Add this to your `~/.zshrc` or `~/.bashrc` to make it permanent.

