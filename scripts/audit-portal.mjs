import fs from 'fs';
import path from 'path';
import process from 'process';

const root = process.cwd();
const portal = JSON.parse(fs.readFileSync(path.join(root, 'src/data/portal.json'), 'utf8'));
const commerce = JSON.parse(fs.readFileSync(path.join(root, 'src/data/commerce.json'), 'utf8'));

// This audits the staged backend/data substrate contract only.
// It does not assert that the current live-style React UI exposes these routes.
const errors = [];
const requiredRoutes = [
  '/',
  '/systems',
  '/studio',
  '/studio/card-studio',
  '/field',
  '/field/build-archive',
  '/doctrine',
  '/access',
  '/access/contact',
  '/access/chronos-public-beta',
  '/status'
];
const requiredLegacy = [
  '/card-studio',
  '/forge',
  '/store',
  '/contact',
  '/build-archive',
  '/systems.html',
  '/forge.html',
  '/showcase.html',
  '/gallery.html',
  '/contact.html',
  '/builds.html',
  '/build-archive.html',
  '/dev-diary.html',
  '/newsletter.html',
  '/store.html'
];
const statusValues = new Set(portal.statusVocabulary);
const forbiddenRouteTokens = ['admin', 'console', 'vault', 'secret', 'telemetry', 'slack', 'memory-commit'];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

for (const route of requiredRoutes) {
  const meta = portal.routeMetadata[route];
  assert(Boolean(meta), `missing route metadata for ${route}`);
  if (meta) {
    assert(Boolean(meta.title), `missing title for ${route}`);
    assert(Boolean(meta.description), `missing description for ${route}`);
    assert(Boolean(meta.canonicalUrl), `missing canonical URL for ${route}`);
  }
}

for (const redirect of requiredLegacy) {
  assert(
    portal.legacyRedirects.some((item) => item.from === redirect),
    `missing legacy redirect for ${redirect}`
  );
}

for (const redirect of portal.legacyRedirects) {
  assert(!redirect.to.endsWith('.html'), `legacy redirect ${redirect.from} points to old html route`);
}

for (const route of Object.keys(portal.routeMetadata)) {
  for (const token of forbiddenRouteTokens) {
    assert(!route.toLowerCase().includes(token), `private-looking token "${token}" appears in route ${route}`);
  }
}

for (const zone of portal.zones) {
  assert(statusValues.has(zone.status), `zone ${zone.id} has invalid status ${zone.status}`);
  assert(statusValues.has(zone.launchReadiness), `zone ${zone.id} has invalid launch readiness ${zone.launchReadiness}`);
}

for (const room of portal.rooms) {
  assert(statusValues.has(room.status), `room ${room.id} has invalid status ${room.status}`);
}

for (const system of portal.systems) {
  assert(statusValues.has(system.posture), `system ${system.id} has invalid posture ${system.posture}`);
  assert(system.hidePrivateControls === true, `system ${system.id} must hide private controls`);
  assert(Boolean(system.authorityBoundary), `system ${system.id} is missing authorityBoundary`);
  if (system.posture === 'public_beta') {
    assert(Boolean(system.truthSource), `system ${system.id} public_beta missing truthSource`);
    assert(Boolean(system.lastVerified), `system ${system.id} public_beta missing lastVerified`);
  }
}

const chronosLane = portal.accessLanes.find((lane) => lane.id === 'chronos-public-beta');
assert(Boolean(chronosLane), 'missing CHR0N public beta lane');
if (chronosLane) {
  assert(chronosLane.publicBeta.version === 'v0.2.2-beta.1', 'unexpected CHR0N public beta version');
  assert(chronosLane.publicBeta.knownIssues.status === 'manual_update_required', 'CHR0N known issues must require manual update');
  const kinds = new Set(chronosLane.publicBeta.assets.map((asset) => asset.kind));
  for (const kind of ['installer', 'portable', 'msi']) {
    assert(kinds.has(kind), `missing CHR0N ${kind} asset`);
  }
  for (const asset of chronosLane.publicBeta.assets) {
    assert(/^https:\/\/github\.com\/Code-Xer0\/CHR0N\.OS-Preview\/releases\/download\//.test(asset.url), `CHR0N ${asset.kind} URL is not the public release asset URL`);
    assert(/^[a-f0-9]{64}$/.test(asset.sha256), `CHR0N ${asset.kind} SHA256 is invalid`);
  }
}

const cardRoom = portal.rooms.find((room) => room.id === 'card-studio');
assert(Boolean(cardRoom), 'missing Card Studio room');
if (cardRoom) {
  assert(cardRoom.zoneId === 'studio', 'Card Studio must live in Studio zone');
  assert(cardRoom.pricing.publicCheckoutEnabled === false, 'Card Studio public checkout must be disabled');
  const portalPrices = new Map(cardRoom.pricing.physicalFinishes.map((finish) => [finish.key, finish.price]));
  const commercePrices = new Map(commerce.finishes.map((finish) => [finish.key, finish.price]));
  for (const [key, price] of portalPrices) {
    assert(commercePrices.has(key), `commerce.json missing Card Studio finish ${key}`);
    assert(commercePrices.get(key) === price, `Card Studio price drift for ${key}`);
  }
  assert(cardRoom.pricing.plans.some((plan) => plan.key === 'pro' && plan.price === '$9' && plan.note === 'or $90/yr'), 'Card Studio Pro pricing mismatch');
}

for (const model of portal.intakeModels) {
  assert(model.publicSafeOnly === true, `intake model ${model.id} must be publicSafeOnly`);
  assert(model.externalService === 'none', `intake model ${model.id} wires an external service`);
  assert(model.persistence === 'staged_memory_only', `intake model ${model.id} has unexpected persistence`);
}

assert(
  portal.safetyRules.publicMustNotAccess.includes('real operator consoles'),
  'safety rules must block operator consoles'
);
assert(
  portal.safetyRules.publicMustNotAccess.includes('private memory'),
  'safety rules must block private memory'
);
assert(
  portal.safetyRules.publicMustNotAccess.includes('remote command surfaces'),
  'safety rules must block remote command surfaces'
);

if (errors.length) {
  console.error('substrate contract audit failed');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`substrate contract audit passed (${requiredRoutes.length} contract routes, ${portal.systems.length} systems, ${portal.intakeModels.length} intake models)`);
