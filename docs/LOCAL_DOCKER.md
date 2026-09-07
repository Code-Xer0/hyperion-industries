# Local Docker acceptance stack

This stack is a local acceptance surface for the compiled Hyperion flagship and
the public intake Worker. It is not a replacement for GitHub Pages, Cloudflare,
or the native Founder Command Windows service.

## Start

```powershell
docker compose up --build --wait
```

- Flagship: `http://localhost:8080`
- Worker diagnostics: `http://localhost:8790/api/intake/status`
- Commerce posture: `http://localhost:8080/api/commerce/readiness`

The Worker applies every D1 migration to the named local volume before it
starts. The local configuration contains no production tokens, email binding,
payment credentials, or Founder Command capability. Payment and operator-feed
features therefore stay visibly configuration-required.

The Docker-only Worker entrypoint also serves the existing public Forge guide,
curated product projections, and unconfigured client/configurator responses.
These handlers have no remote bindings and cannot reach private authority APIs.
Production continues using the separate Site Edge and intake Workers.

Run `npm run docker:smoke -- --restart` to check the compiled routes and API,
create one synthetic Forge configurator intake, verify idempotent replay, restart
the local Worker, and confirm the same receipt survives. This writes only to
the local acceptance volume using a reserved `.example` identity. It never
connects to Founder Command or a payment provider.

The Worker runs as `node`. Only its D1 volume and the Wrangler/Miniflare cache
directories are writable by that account. Keep the locked Wrangler runtime new
enough to support the compatibility date in `wrangler.docker.toml`.
The entrypoint uses the installed CLI directly; telemetry and the banner's
online package-version probe are disabled so offline registry checks cannot
delay migration-command exit and hold up local startup.

Use `docker compose down` to stop the stack. Add `--volumes` only when you
explicitly intend to erase the local D1 acceptance state.

## Authority boundary

Founder Command remains the native `HyperionFounderCommand` Windows service.
Its DPAPI vault, named-pipe bootstrap, SQLite writer, intake polling, proposal
planes, and operator authority are intentionally not mounted into Docker.
