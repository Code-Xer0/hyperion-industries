import Ajv2020 from 'ajv/dist/2020';
import checkoutCommandSchema from '../../../shared/commerce/contracts/commerce-checkout-command.v2.schema.json';
import { CARD_CATALOG, cardCatalogItem } from '../../../shared/card-studio/catalog';
import { authorizeCommerce } from './commerce-auth';
import { HttpError, jsonResponse, readJsonBody, requireObject } from './http';
import { constantTimeEqual, sha256 } from './operator-auth';
import { createPaymentCheckout, type PaymentProvider } from './payments';
import { capturePayPalOrder, verifyPayPalWebhook } from './paypal';
import { verifyStripeWebhook } from './stripe';
import type { Env, RuntimeDependencies } from './types';

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateCommand = ajv.compile(checkoutCommandSchema);
const REF_PATTERN = /^[A-Za-z0-9_-]{12,96}$/;

interface CommerceCommand {
  contract_version: 'commerce-checkout-command/2';
  proposal_ref: string;
  source_type: 'card_studio' | 'forge' | 'chronos' | 'live_site';
  source_ref: string;
  revision_hash: string;
  provider: PaymentProvider;
  action: 'stage_checkout' | 'create_checkout' | 'reconcile';
  amount_minor: number;
  currency: 'USD';
  description: string;
  idempotency_key: string;
}

function requireDb(env: Env): D1Database {
  if (!env.DB) throw new HttpError(503, 'commerce_unavailable', 'Commerce storage is unavailable.');
  return env.DB;
}

function generatedId(prefix: string, deps: RuntimeDependencies): string {
  return `${prefix}_${deps.randomUUID().replaceAll('-', '')}`;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

function commandFrom(value: unknown): CommerceCommand {
  const body = requireObject(value);
  if (!validateCommand(body)) throw new HttpError(400, 'commerce_command_invalid', 'The commerce command is invalid.');
  return body as unknown as CommerceCommand;
}

async function cardStudioAmount(db: D1Database, command: CommerceCommand) {
  const row = await db.prepare(
    `SELECT p.proposal_id, p.revision_hash, p.state AS proposal_state,
            o.intent_id, o.product_sku, o.quantity, o.status AS order_status,
            c.status AS projection_status
       FROM card_studio_design_proposals p
       JOIN card_studio_order_intents o ON o.intent_id = p.intent_id
       JOIN card_studio_checkout_projections c ON c.intent_id = o.intent_id
      WHERE p.proposal_id = ? AND o.intent_id = ? LIMIT 1`,
  ).bind(command.proposal_ref, command.source_ref).first<{
    proposal_id: string; revision_hash: string; proposal_state: string; intent_id: string;
    product_sku: string; quantity: number; order_status: string; projection_status: string;
  }>();
  if (!row) throw new HttpError(404, 'commerce_proposal_not_found', 'The released Card Studio proposal was not found.');
  if (!constantTimeEqual(row.revision_hash, command.revision_hash)) throw new HttpError(409, 'commerce_revision_stale', 'The proposal revision changed and must be reviewed again.');
  if (row.proposal_state !== 'checkout_released' || row.order_status !== 'checkout_pending' || row.projection_status !== 'staged') {
    throw new HttpError(409, 'commerce_not_released', 'Proof approval and checkout release are required before provider checkout.');
  }
  const item = cardCatalogItem(row.product_sku);
  if (!item || item.checkout_mode !== 'fixed_checkout' || item.unit_amount === null) throw new HttpError(409, 'commerce_product_not_fixed', 'This product remains proposal-only.');
  const amount = item.unit_amount * Number(row.quantity);
  if (amount !== command.amount_minor || command.currency !== CARD_CATALOG.currency) throw new HttpError(409, 'commerce_amount_conflict', 'The command amount does not match the released catalog projection.');
  return { amount, description: `${item.name} × ${row.quantity}` };
}

async function stagedRelease(db: D1Database, command: CommerceCommand) {
  return db.prepare(
    `SELECT release_id, source_ref, revision_hash, provider, amount_minor, currency, description, state
       FROM commerce_checkout_releases WHERE proposal_ref = ? LIMIT 1`,
  ).bind(command.proposal_ref).first<{
    release_id: string; source_ref: string; revision_hash: string; provider: string; amount_minor: number;
    currency: string; description: string; state: string;
  }>();
}

export async function handleCommerceCommand(request: Request, env: Env, requestId: string, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorizeCommerce(request, env);
  const db = requireDb(env);
  const command = commandFrom(await readJsonBody(request, 16 * 1024));
  const now = deps.now().toISOString();
  const commandHash = await sha256(canonical(command));

  if (command.action === 'stage_checkout') {
    const existing = await stagedRelease(db, command);
    if (existing) {
      const matches = constantTimeEqual(existing.revision_hash, command.revision_hash)
        && existing.source_ref === command.source_ref && existing.provider === command.provider
        && Number(existing.amount_minor) === command.amount_minor && existing.currency === command.currency;
      if (!matches) throw new HttpError(409, 'commerce_release_conflict', 'A different staged release already exists for this proposal.');
      return jsonResponse({ ok: true, duplicate: true, release_id: existing.release_id, state: existing.state, provider_network_called: false });
    }
    const releaseId = generatedId('cmr', deps);
    await db.prepare(
      `INSERT INTO commerce_checkout_releases
       (release_id, proposal_ref, source_type, source_ref, revision_hash, provider, amount_minor, currency,
        description, state, command_hash, consumer_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'staged', ?, ?, ?, ?)`,
    ).bind(releaseId, command.proposal_ref, command.source_type, command.source_ref, command.revision_hash,
      command.provider, command.amount_minor, command.currency, command.description, commandHash,
      authorization.consumerId, now, now).run();
    return jsonResponse({ ok: true, duplicate: false, release_id: releaseId, state: 'staged', provider_network_called: false }, 201);
  }

  if (command.action === 'reconcile') {
    throw new HttpError(409, 'commerce_reconciliation_requires_receipt', 'Reconciliation requires provider receipt evidence and remains operator-gated.');
  }

  const release = await stagedRelease(db, command);
  if (!release || release.state !== 'staged') throw new HttpError(409, 'commerce_release_required', 'A staged checkout release is required before provider checkout.');
  if (!constantTimeEqual(release.revision_hash, command.revision_hash) || release.source_ref !== command.source_ref
    || release.provider !== command.provider || Number(release.amount_minor) !== command.amount_minor || release.currency !== command.currency) {
    throw new HttpError(409, 'commerce_release_conflict', 'The checkout command does not match the staged release.');
  }
  let description = release.description;
  if (command.source_type === 'card_studio') description = (await cardStudioAmount(db, command)).description;

  const prior = await db.prepare(
    `SELECT attempt_id, provider, state, provider_checkout_ref, checkout_url FROM commerce_checkout_attempts
      WHERE source_ref = ? LIMIT 1`,
  ).bind(command.source_ref).first<{ attempt_id: string; provider: string; state: string; provider_checkout_ref: string | null; checkout_url: string | null }>();
  if (prior) {
    if (prior.provider !== command.provider) throw new HttpError(409, 'commerce_provider_switch_blocked', 'A provider attempt already exists; reconcile it before switching providers.');
    if (prior.state === 'approval_pending' && prior.provider_checkout_ref) return jsonResponse({ ok: true, duplicate: true, ...prior });
    throw new HttpError(409, 'commerce_attempt_requires_reconciliation', 'The prior provider attempt requires reconciliation before retry.');
  }

  const attemptId = generatedId('cpa', deps);
  const returnState = deps.randomUUID().replaceAll('-', '');
  const stateHash = await sha256(returnState);
  const idempotencyHash = await sha256(command.idempotency_key);
  const requestHash = await sha256(canonical({ ...command, description }));
  await db.prepare(
    `INSERT INTO commerce_checkout_attempts
     (attempt_id, source_type, source_ref, proposal_ref, revision_hash, provider, state, idempotency_hash,
      request_hash, provider_checkout_ref, checkout_url, return_state_hash, amount_minor, currency,
      error_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'reserved', ?, ?, NULL, NULL, ?, ?, ?, NULL, ?, ?)`,
  ).bind(attemptId, command.source_type, command.source_ref, command.proposal_ref, command.revision_hash,
    command.provider, idempotencyHash, requestHash, stateHash, command.amount_minor, command.currency, now, now).run();

  const origin = new URL(env.SITE_ORIGIN || 'https://hyperion-industries.dev').origin;
  const successUrl = command.provider === 'paypal'
    ? `${origin}/api/commerce/paypal/return?attempt=${encodeURIComponent(attemptId)}&state=${encodeURIComponent(returnState)}`
    : `${origin}/store?payment=processing&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = command.provider === 'paypal'
    ? `${origin}/api/commerce/paypal/cancel?attempt=${encodeURIComponent(attemptId)}&state=${encodeURIComponent(returnState)}`
    : `${origin}/store?payment=cancelled`;
  try {
    const checkout = await createPaymentCheckout(env, deps, {
      provider: command.provider,
      referenceId: command.source_ref,
      description,
      amountMinor: command.amount_minor,
      currency: command.currency,
      idempotencyKey: command.idempotency_key,
      successUrl,
      cancelUrl,
    });
    const appliedAt = deps.now().toISOString();
    await db.batch([
      db.prepare(`UPDATE commerce_checkout_attempts SET state = 'approval_pending', provider_checkout_ref = ?, checkout_url = ?, updated_at = ? WHERE attempt_id = ? AND state = 'reserved'`)
        .bind(checkout.checkoutId, checkout.checkoutUrl, appliedAt, attemptId),
      db.prepare(`UPDATE commerce_checkout_releases SET state = 'checkout_created', updated_at = ? WHERE release_id = ? AND state = 'staged'`)
        .bind(appliedAt, release.release_id),
    ]);
    return jsonResponse({ ok: true, duplicate: false, attempt_id: attemptId, provider: checkout.provider, provider_checkout_ref: checkout.checkoutId, checkout_url: checkout.checkoutUrl, source_outbox_mutated: false }, 201);
  } catch (error) {
    const code = error instanceof HttpError ? error.code : 'provider_network_ambiguous';
    const deterministic = ['paypal_not_configured', 'paypal_live_not_authorized', 'stripe_not_configured', 'stripe_live_not_authorized'].includes(code);
    if (deterministic) await db.prepare(`DELETE FROM commerce_checkout_attempts WHERE attempt_id = ? AND state = 'reserved'`).bind(attemptId).run();
    else await db.prepare(`UPDATE commerce_checkout_attempts SET state = 'ambiguous', error_code = ?, updated_at = ? WHERE attempt_id = ?`).bind(code, deps.now().toISOString(), attemptId).run();
    throw error;
  }
}

export async function handlePayPalReturn(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const db = requireDb(env);
  const url = new URL(request.url);
  const attemptId = url.searchParams.get('attempt') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const orderId = url.searchParams.get('token') ?? '';
  if (!/^cpa_[A-Za-z0-9]{12,80}$/.test(attemptId) || !REF_PATTERN.test(orderId) || state.length < 16) throw new HttpError(400, 'paypal_return_invalid', 'The PayPal return could not be verified.');
  const row = await db.prepare(`SELECT attempt_id, source_type, source_ref, proposal_ref, provider, state, provider_checkout_ref, return_state_hash, amount_minor, currency FROM commerce_checkout_attempts WHERE attempt_id = ? LIMIT 1`)
    .bind(attemptId).first<{ attempt_id: string; source_type: string; source_ref: string; proposal_ref: string; provider: string; state: string; provider_checkout_ref: string; return_state_hash: string; amount_minor: number; currency: string }>();
  if (!row || row.provider !== 'paypal' || row.state !== 'approval_pending' || row.provider_checkout_ref !== orderId || !constantTimeEqual(await sha256(state), row.return_state_hash)) throw new HttpError(409, 'paypal_return_conflict', 'The PayPal return does not match the pending approval.');
  const capture = await capturePayPalOrder(env, deps, orderId, `capture:${attemptId}`);
  const captureRecord = (((capture.purchase_units as Array<Record<string, unknown>> | undefined)?.[0]?.payments as { captures?: Array<Record<string, unknown>> } | undefined)?.captures ?? [])[0];
  const eventId = String(captureRecord?.id ?? orderId);
  const payloadHash = await sha256(canonical(capture));
  const now = deps.now().toISOString();
  const receiptId = generatedId('cpr', deps);
  const outboxId = generatedId('cro', deps);
  await db.batch([
    db.prepare(`INSERT INTO commerce_payment_receipts (receipt_id, attempt_id, proposal_ref, provider, provider_event_id, state, amount_minor, currency, payload_hash, occurred_at, created_at) VALUES (?, ?, ?, 'paypal', ?, 'paid', ?, ?, ?, ?, ?)`)
      .bind(receiptId, attemptId, row.proposal_ref, eventId, row.amount_minor, row.currency, payloadHash, now, now),
    db.prepare(`INSERT INTO commerce_receipt_outbox (outbox_id, receipt_id, state, created_at) VALUES (?, ?, 'held_for_review', ?)`).bind(outboxId, receiptId, now),
    db.prepare(`UPDATE commerce_checkout_attempts SET state = 'paid', updated_at = ? WHERE attempt_id = ? AND state = 'approval_pending'`).bind(now, attemptId),
    ...(row.source_type === 'card_studio' ? [
      db.prepare(`UPDATE card_studio_order_intents SET status = 'paid', updated_at = ? WHERE intent_id = ?`).bind(now, row.source_ref),
      db.prepare(`UPDATE card_studio_projects SET status = 'paid', updated_at = ? WHERE project_id = (SELECT project_id FROM card_studio_order_intents WHERE intent_id = ?)`).bind(now, row.source_ref),
    ] : []),
  ]);
  return Response.redirect(`${new URL(env.SITE_ORIGIN || 'https://hyperion-industries.dev').origin}/${row.source_type === 'card_studio' ? 'card-studio' : 'store'}?payment=confirmed`, 303);
}

export async function handlePayPalCancel(request: Request, env: Env): Promise<Response> {
  const db = requireDb(env);
  const url = new URL(request.url);
  const attemptId = url.searchParams.get('attempt') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const row = await db.prepare(`SELECT return_state_hash FROM commerce_checkout_attempts WHERE attempt_id = ? AND provider = 'paypal' LIMIT 1`).bind(attemptId).first<{ return_state_hash: string }>();
  if (!row || state.length < 16 || !constantTimeEqual(await sha256(state), row.return_state_hash)) throw new HttpError(400, 'paypal_cancel_invalid', 'The PayPal cancellation could not be verified.');
  await db.prepare(`UPDATE commerce_checkout_attempts SET state = 'cancelled', updated_at = ? WHERE attempt_id = ? AND state = 'approval_pending'`).bind(new Date().toISOString(), attemptId).run();
  return Response.redirect(`${new URL(env.SITE_ORIGIN || 'https://hyperion-industries.dev').origin}/store?payment=cancelled`, 303);
}

function bytesHash(raw: ArrayBuffer): Promise<string> {
  return crypto.subtle.digest('SHA-256', raw).then((digest) => Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(''));
}

async function receiptAttempt(db: D1Database, provider: string, checkoutRef: string | null, sourceRef: string | null) {
  if (checkoutRef) {
    const row = await db.prepare(`SELECT attempt_id, source_type, source_ref, proposal_ref, state, amount_minor, currency FROM commerce_checkout_attempts WHERE provider = ? AND provider_checkout_ref = ? LIMIT 1`)
      .bind(provider, checkoutRef).first<{ attempt_id: string; source_type: string; source_ref: string; proposal_ref: string; state: string; amount_minor: number; currency: string }>();
    if (row) return row;
  }
  return sourceRef ? db.prepare(`SELECT attempt_id, source_type, source_ref, proposal_ref, state, amount_minor, currency FROM commerce_checkout_attempts WHERE provider = ? AND source_ref = ? LIMIT 1`)
    .bind(provider, sourceRef).first<{ attempt_id: string; source_type: string; source_ref: string; proposal_ref: string; state: string; amount_minor: number; currency: string }>() : null;
}

async function applyProviderReceipt(
  db: D1Database,
  deps: RuntimeDependencies,
  input: { provider: 'paypal' | 'stripe'; eventId: string; state: 'paid' | 'cancelled' | 'refunded'; payloadHash: string; checkoutRef: string | null; sourceRef: string | null },
) {
  const prior = await db.prepare(`SELECT receipt_id, payload_hash, state FROM commerce_payment_receipts WHERE provider = ? AND provider_event_id = ? LIMIT 1`)
    .bind(input.provider, input.eventId).first<{ receipt_id: string; payload_hash: string; state: string }>();
  if (prior) {
    if (constantTimeEqual(prior.payload_hash, input.payloadHash)) return { duplicate: true, receiptId: prior.receipt_id, state: prior.state };
    await db.prepare(`UPDATE commerce_payment_receipts SET state = 'conflict_quarantined' WHERE receipt_id = ?`).bind(prior.receipt_id).run();
    throw new HttpError(409, 'commerce_webhook_conflict', 'A conflicting provider event was quarantined.');
  }
  const attempt = await receiptAttempt(db, input.provider, input.checkoutRef, input.sourceRef);
  if (!attempt) return { duplicate: false, applied: false, reason: 'unmatched_attempt' } as const;
  const now = deps.now().toISOString();
  const receiptId = generatedId('cpr', deps);
  const outboxId = generatedId('cro', deps);
  const nextAttemptState = input.state === 'paid' ? 'paid' : 'cancelled';
  const statements = [
    db.prepare(`INSERT INTO commerce_payment_receipts (receipt_id, attempt_id, proposal_ref, provider, provider_event_id, state, amount_minor, currency, payload_hash, occurred_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(receiptId, attempt.attempt_id, attempt.proposal_ref, input.provider, input.eventId, input.state, attempt.amount_minor, attempt.currency, input.payloadHash, now, now),
    db.prepare(`INSERT INTO commerce_receipt_outbox (outbox_id, receipt_id, state, created_at) VALUES (?, ?, 'held_for_review', ?)`).bind(outboxId, receiptId, now),
    db.prepare(`UPDATE commerce_checkout_attempts SET state = ?, updated_at = ? WHERE attempt_id = ?`).bind(nextAttemptState, now, attempt.attempt_id),
  ];
  if (attempt.source_type === 'card_studio') {
    const orderStatus = input.state === 'paid' ? 'paid' : input.state;
    const projectStatus = input.state === 'paid' ? 'paid' : 'cancelled';
    statements.push(
      db.prepare(`UPDATE card_studio_order_intents SET status = ?, updated_at = ? WHERE intent_id = ?`).bind(orderStatus, now, attempt.source_ref),
      db.prepare(`UPDATE card_studio_projects SET status = ?, updated_at = ? WHERE project_id = (SELECT project_id FROM card_studio_order_intents WHERE intent_id = ?)`).bind(projectStatus, now, attempt.source_ref),
    );
  }
  await db.batch(statements);
  return { duplicate: false, applied: true, receiptId, state: input.state } as const;
}

export async function handlePayPalWebhook(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const db = requireDb(env);
  const raw = await request.arrayBuffer();
  if (!raw.byteLength || raw.byteLength > 512 * 1024) throw new HttpError(413, 'commerce_webhook_too_large', 'The PayPal webhook body is outside the supported limit.');
  let event: Record<string, unknown>;
  try { event = requireObject(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw))); } catch { throw new HttpError(400, 'paypal_webhook_json_invalid', 'The PayPal webhook body is invalid.'); }
  if (!await verifyPayPalWebhook(env, deps, request, event)) throw new HttpError(401, 'paypal_webhook_invalid', 'PayPal webhook verification failed.');
  const eventId = String(event.id ?? '');
  const eventType = String(event.event_type ?? '').toUpperCase();
  if (!REF_PATTERN.test(eventId)) throw new HttpError(400, 'paypal_webhook_id_invalid', 'The PayPal webhook identifier is invalid.');
  const resource = requireObject(event.resource);
  const related = ((resource.supplementary_data as Record<string, unknown> | undefined)?.related_ids ?? {}) as Record<string, unknown>;
  const checkoutRef = String(related.order_id ?? resource.id ?? '') || null;
  const sourceRef = String(resource.custom_id ?? resource.invoice_id ?? '') || null;
  const state = eventType === 'PAYMENT.CAPTURE.COMPLETED' ? 'paid'
    : eventType === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded'
      : ['CHECKOUT.ORDER.VOIDED', 'PAYMENT.CAPTURE.DENIED'].includes(eventType) ? 'cancelled' : null;
  if (!state) return jsonResponse({ ok: true, applied: false, reason: 'event_not_actionable' });
  return jsonResponse({ ok: true, ...await applyProviderReceipt(db, deps, { provider: 'paypal', eventId, state, payloadHash: await bytesHash(raw), checkoutRef, sourceRef }) });
}

export async function handleStripeWebhook(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const db = requireDb(env);
  const raw = await request.text();
  if (!raw.length || raw.length > 512 * 1024) throw new HttpError(413, 'commerce_webhook_too_large', 'The Stripe webhook body is outside the supported limit.');
  const signature = request.headers.get('stripe-signature')?.trim() ?? '';
  let event;
  try { event = await verifyStripeWebhook(env, deps, raw, signature); } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'stripe_webhook_invalid', 'Stripe webhook verification failed.');
  }
  const object = event.data.object as unknown as Record<string, unknown>;
  const metadata = (object.metadata ?? {}) as Record<string, unknown>;
  const eventType = event.type;
  const state = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(eventType) ? 'paid'
    : ['checkout.session.expired', 'checkout.session.async_payment_failed'].includes(eventType) ? 'cancelled'
      : eventType === 'charge.refunded' ? 'refunded' : null;
  if (!state) return jsonResponse({ ok: true, applied: false, reason: 'event_not_actionable' });
  const checkoutRef = eventType.startsWith('checkout.session') ? String(object.id ?? '') || null : null;
  const sourceRef = String(object.client_reference_id ?? metadata.hyperion_reference ?? '') || null;
  const rawBytes = new TextEncoder().encode(raw).buffer;
  return jsonResponse({ ok: true, ...await applyProviderReceipt(db, deps, { provider: 'stripe', eventId: event.id, state, payloadHash: await bytesHash(rawBytes), checkoutRef, sourceRef }) });
}

export async function handleCommerceReceiptFeed(request: Request, env: Env): Promise<Response> {
  const authorization = await authorizeCommerce(request, env);
  const db = requireDb(env);
  const rows = await db.prepare(
    `SELECT o.outbox_id, o.created_at, r.receipt_id, r.proposal_ref, r.provider, r.provider_event_id,
            r.state, r.amount_minor, r.currency, r.payload_hash, r.occurred_at
       FROM commerce_receipt_outbox o JOIN commerce_payment_receipts r ON r.receipt_id = o.receipt_id
       LEFT JOIN commerce_consumer_receipts c ON c.outbox_id = o.outbox_id AND c.consumer_id = ?
      WHERE o.state = 'held_for_review' AND c.outbox_id IS NULL ORDER BY o.created_at, o.outbox_id LIMIT 100`,
  ).bind(authorization.consumerId).all();
  return jsonResponse({ contract_version: 'commerce-receipt-feed/1', consumer_id: authorization.consumerId, items: rows.results ?? [], source_outbox_mutated: false });
}

export async function handleCommerceReceiptAck(request: Request, env: Env, deps: RuntimeDependencies): Promise<Response> {
  const authorization = await authorizeCommerce(request, env);
  const db = requireDb(env);
  const body = requireObject(await readJsonBody(request, 32 * 1024));
  const receipts = Array.isArray(body.receipts) ? body.receipts : [];
  if (!receipts.length || receipts.length > 100) throw new HttpError(400, 'commerce_ack_invalid', 'One to one hundred commerce acknowledgements are required.');
  const now = deps.now().toISOString();
  const statements = receipts.map((value) => {
    const item = requireObject(value);
    const outboxId = String(item.outbox_id ?? '');
    const localReceiptId = String(item.local_receipt_id ?? '');
    const outcome = String(item.outcome ?? '');
    const payloadHash = String(item.payload_hash ?? '');
    if (!/^cro_[A-Za-z0-9_-]{12,80}$/.test(outboxId) || !REF_PATTERN.test(localReceiptId) || !['received', 'duplicate', 'conflict_quarantined', 'rejected'].includes(outcome) || !/^[a-f0-9]{64}$/.test(payloadHash)) {
      throw new HttpError(400, 'commerce_ack_invalid', 'A commerce acknowledgement item is invalid.');
    }
    return db.prepare(`INSERT OR IGNORE INTO commerce_consumer_receipts (consumer_id, outbox_id, local_receipt_id, outcome, payload_hash, acknowledged_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(authorization.consumerId, outboxId, localReceiptId, outcome, payloadHash, now);
  });
  await db.batch(statements);
  return jsonResponse({ ok: true, acknowledged: statements.length, source_outbox_mutated: false });
}
