# Hyperion Public Retrieval MCP

Stateless Streamable HTTP MCP for Hyperion's approved public retrieval projection and governed intake edge.

- Public endpoint: `https://mcp.hyperion-industries.dev/mcp`
- Metadata: `https://mcp.hyperion-industries.dev/server.json`
- Documentation: `https://hyperion-industries.dev/mcp`
- Server identity: `dev.hyperion-industries/public-retrieval`

The generated public manifest is the only retrieval authority. The Worker has no browser, model, source-code, private-memory, telemetry, file-upload, or saved-draft access. Intake calls are forwarded to the existing Operator Worker through a Cloudflare service binding.

Run `npm run check` after the root `npm run build`, which regenerates `src/generated/public-retrieval.generated.ts`.
