# Hyperion Forge Mail Router

Cloudflare Email Worker for the single public address `forge@hyperion-industries.dev`.

Delivery order:

1. Primary owner: the verified destination stored in `FORGE_PRIMARY_DESTINATION`.
2. Operator copy: the verified destination stored in `FORGE_OPERATOR_COPY_DESTINATION`.

The Worker reads no message body, stores no content, and logs no sender, subject,
recipient, or attachment metadata. Unsupported recipients are rejected. A failed
primary forward is surfaced to Cloudflare. A failed operator copy is recorded only
as the bounded event `forge_mail_operator_copy_failed` so a retry cannot duplicate
the primary delivery.

The Cloudflare Email Routing rule for `forge@hyperion-industries.dev` must target
the Worker `hyperion-forge-mail-router`. Both destination addresses must remain
verified in the Cloudflare account. Destination values are Cloudflare Worker
secrets and must never be committed to this repository.
