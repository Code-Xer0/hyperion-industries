# Hyperion Site Builder public contract

The public site accepts governed content through `site-content/` and
`contracts/site-builder/v1/`. The private Workbench may create drafts and
release branches, but this repository remains the renderer and deployment
authority.

## Editable surface

- `site-content/collections/*.json` contains the canonical legacy collections.
- `site-content/pages/*.json` contains controlled, contract-rendered pages.
- `site-content/themes/*.json` contains allowlisted semantic theme tokens.
- Files prefixed with `_` are templates and are never published.

The compiler validates these documents, rejects duplicate routes and identifiers,
refuses reserved route prefixes, canonicalizes the bundle, and generates:

- `src/generated/siteContent.js`
- `contracts/site-builder/v1/MANIFEST.json`
- contract examples under `contracts/site-builder/v1/examples/`

Run `npm run site-content:generate` after an intentional edit and
`npm run site-content:check` to prove there is no generated drift.

## Code-owned boundary

The following are application surfaces and cannot be created or shadowed by a
content document:

- `/api`
- `/assets`
- `/intake`
- `/forge/catalog`
- `/forge/configurator`
- `/card-studio`
- `/dxcard`
- `/mcp`

Additional existing React routes remain code-owned until they are explicitly
migrated. The Workbench validates this boundary before draft creation, and the
public compiler enforces it again during release audit.

## Release posture

The legacy development editor may still read and save allowlisted collections
for migration compatibility. Its direct Git publishing endpoint is retired and
returns `workbench_required`.

Builder branches run the complete site, SEO, edge, operator-worker, and
public-MCP suite. Successful runs upload a private CI artifact for seven days.
They do not create a public preview URL and do not deploy.
