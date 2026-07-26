# Forge Product Views in Airtable

Airtable is an optional presentation overlay for the public Forge catalog. HypOM
remains the authority for configurations, compatibility, evidence, availability,
pricing, and quote revisions. A public record cannot create or modify any of
those domain facts.

## Table and view

Create a table named `Forge Product Views` and a view named `Published Catalog`.
The view should filter `Published` to checked and sort `Display order` ascending.

The Worker reads only these fields:

| Field | Airtable type | Required |
| --- | --- | --- |
| `Slug` | Single line text | Yes |
| `Published` | Checkbox | Yes |
| `Display order` | Integer | Yes |
| `Eyebrow` | Single line text | Yes |
| `Title` | Single line text | Yes |
| `Lane` | Single select or text | Yes |
| `Summary` | Long text | Yes |
| `Workload tags` | Multiple select or text | Yes |
| `Highlights` | Multiple select or text | Yes |
| `Media path` | Single line text | Yes |
| `Media alt` | Single line text | Yes |
| `Source projection hash` | Single line text | Yes |

`Media path` must be a same-origin path beneath `/assets/forge/`. Remote URLs,
path traversal, HTML, SVG, and unrecognized fields are rejected. The projection
hash must be the 64-character SHA-256 value exported by HypOM.

## Initial import

Use HypOM `GET /api/v1/product-views/airtable-export` to produce the allowlisted
records. Import those records into Airtable, then curate only the presentation
fields. Keep the HypOM projection hash unchanged until a new HypOM export is
admitted.

## Worker configuration

Create a personal access token limited to record-read scope and the single
catalog base. Add it as a secret:

```powershell
npx wrangler secret put AIRTABLE_PAT --config workers/site-edge/wrangler.toml
```

Configure these non-secret Worker variables in the Cloudflare dashboard or
deployment environment:

- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_ID`
- `AIRTABLE_VIEW_ID` (optional, recommended)

Do not use `VITE_` variables for Airtable credentials. The browser calls only
the same-origin `/api/forge/products` endpoint. If Airtable is unconfigured,
unavailable, malformed, or rate-limited, that endpoint serves the verified
bundled catalog with `source_posture=bundled_fallback`.

The edge adapter requests at most 100 records per page, stops after three pages
or 200 records, uses a five-second timeout, does not follow redirects, does not
retry `429` responses immediately, and never returns Airtable identifiers or
credentials to the browser.
