# Public corpus contract

`public-corpus.source.json` is the only knowledge source compiled into Operator chat. Every entry is an explicit, human-reviewable allowlist item with `visibility: "public"` and a public route. Runtime requests cannot add context, URLs, files, system messages, tools, plugins, or provider options.

Run `npm run corpus:generate` after reviewing a source change. The generator enforces the JSON contract, size limits, unique IDs, public visibility, route-only source paths, and deterministic output. `npm run corpus:check` fails when the generated TypeScript or its SHA-256 digest is stale.

Do not put private operator data, source code, credentials, telemetry, unpublished diligence, or customer inquiry records in this directory.
