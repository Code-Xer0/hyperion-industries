# Hyperion Public Retrieval MCP

Stateless Streamable HTTP MCP for Hyperion's approved public retrieval projection and governed intake edge.

- Public endpoint: `https://mcp.hyperion-industries.dev/mcp`
- Metadata: `https://mcp.hyperion-industries.dev/server.json`
- Documentation: `https://hyperion-industries.dev/mcp`
- Server identity: `dev.hyperion-industries/public-retrieval`

The generated public manifest is the only retrieval authority. The Worker has no browser, model, source-code, private-memory, telemetry, file-upload, or saved-draft access. Intake calls are forwarded to the existing Operator Worker through a Cloudflare service binding.

Run `npm run check` after the root `npm run build`, which regenerates `src/generated/public-retrieval.generated.ts`.

## Soft-launch acceptance gate

Registry publication remains operator-gated. Keep the server unlisted until seven consecutive days of recorded smoke runs show successful real-client connection, no critical custody or disclosure incident, error rate below two percent, stable rate limiting, and explicit approval of the final `server.json`. Cloudflare Workers Logs are enabled at full sampling during this bounded soft-launch window; custom log events contain request ID, tool, status, duration, and corpus revision only.
