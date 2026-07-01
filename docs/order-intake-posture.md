# Hyperion Order Intake Posture

Updated: 2026-06-25

Hyperion should enter live sales through operator-reviewed order intake, not a public cart. The public site can show real card finish pricing, but payment and fulfillment should move through Shopify draft orders after a human review.

## Public Commerce Stance

- Card Studio pricing is live: Matte PVC `$39`, Velvet soft `$49`, Brushed metal `$89`.
- The digital portrait card is the primary product surface; the physical NFC card is optional fulfillment.
- Forge builds, advisory work, and pilots remain inquiry-led because budget, room, workload, service access, and support expectations must be shaped before payment.
- The site must not store card/payment data. Shopify owns invoice delivery, checkout, payment, tax, and payment records.

## Shopify Lane

Recommended first lane: Shopify Draft Orders.

- Use Admin GraphQL `draftOrderCreate` for operator-approved invoices. Shopify documents draft orders as the path that can create an invoice, then send/complete/update/delete it as needed: <https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate>.
- Keep Storefront API carts staged for later stocked products. Shopify's Storefront cart flow can retrieve a `checkoutUrl`, but that should wait until Hyperion has true stocked SKUs: <https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/cart/manage>.
- Verify Shopify webhook HMAC and delivery ID before processing any webhook event: <https://shopify.dev/docs/apps/build/webhooks/verify-deliveries>.
- Minimum Shopify app scopes for this lane: `write_draft_orders`, `read_draft_orders`, and `read_orders`. Confirm scopes against Shopify's current access-scope docs during setup: <https://shopify.dev/docs/api/usage/access-scopes>.

## Backend Shape

Implemented staged endpoints:

- `POST /api/order-intake` accepts sanitized order intent and returns `submitted -> operator_review`.
- `POST /api/shopify/draft-order` is guarded by `ORDER_ADMIN_TOKEN`; without Shopify secrets it returns an explicit staged/not-configured response.
- `POST /api/shopify/webhook` verifies `X-Shopify-Hmac-Sha256` with `SHOPIFY_WEBHOOK_SECRET` before acknowledging an event.

Environment contract:

```env
SHOPIFY_SHOP_DOMAIN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_WEBHOOK_SECRET=
SHOPIFY_API_VERSION=2026-04
ORDER_ADMIN_TOKEN=
```

Order statuses:

`submitted`, `operator_review`, `quoted`, `invoice_sent`, `paid`, `production_queue`, `packaging_ready`, `shipped`, `delivered`, `cancelled`

Product lanes:

`card_studio_physical`, `build_archive_card`, `forge_build`, `chronos_download`, `pilot_advisory`

## Packaging Profiles

`flat-card`

- Use for Matte PVC or simple card orders.
- Sleeve, rigid mailer, branded insert, optional tracking.
- Evaluate USPS Priority Mail/free supplies for fast tests and low-volume fulfillment: <https://store.usps.com/store/results/free-shipping-supplies/shipping-supplies/_/N-alnx4jZ7d0v8v>.

`premium-card`

- Use for Velvet soft and Brushed metal finishes.
- Sleeve, presentation envelope or small presentation box, rigid mailer, tracking recommended.
- Evaluate custom branded mailers/boxes once dimensions are stable. EcoEnclose and Packlane are suitable research anchors for branded/custom packaging:
  - <https://www.ecoenclose.com/custom-packaging/>
  - <https://www.packlane.com/>

`electronics-small`

- Use for small electronics, NFC test lots, drives, or accessory kits.
- ESD shielding bag, anti-static foam, double-wall carton, tracking and insurance.
- Research anchors:
  - Uline static shielding bags: <https://www.uline.com/Grp_2/Static-Shielding-Bags>
  - Uline anti-static foam: <https://www.uline.com/Product/Detail/S-15324/Anti-Static-Foam/Anti-Static-Pick-and-Pack-Foam-Sheets-24-x-24-x-2>
  - Grainger static shielding bags: <https://www.grainger.com/category/test-instruments/electronic-bench-testing/antistatic-safety-equipment/static-shielding-bags-films>

`forge-system`

- Use for PCs, local AI boxes, sim rigs, and workstations.
- ESD handling, internal component support, foam/corner protection, double-boxing, insurance, signature, and operator photo proof before handoff.
- Carrier and packaging references:
  - UPS supplies and packaging options: <https://www.ups.com/us/en/shipping/order-supplies>
  - UPS packing guidance: <https://www.ups.com/us/en/support/shipping-support/packaging-tips>
  - FedEx supplies and professional packing: <https://www.fedex.com/en-us/shipping/packing/supplies.html>
  - FedEx packing/testing guidance: <https://www.fedex.com/en-us/shipping/packing.html>

## Launch Gates

Before public checkout:

- Confirm Shopify store, tax, shipping profiles, notification templates, refund policy, and support mailbox.
- Create Shopify products/variants only for truly stocked card finishes or repeatable physical goods.
- Verify draft-order creation in a development store, invoice sending, payment completion, and webhook delivery.
- Decide whether order metadata persists in Shopify only, Vercel KV, Supabase, or another private operator system.
- Confirm packaging dimensions, mailer supplier, NFC supplier, print vendor, and replacement/refund rules.
- Keep Forge and pilot/advisory lanes draft-invoice only until service terms and support boundaries are clear.
