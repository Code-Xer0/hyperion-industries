import { describe, expect, it } from 'vitest';
import { createWorker } from '../src/index';
import { baseEnv, executionContext, postJson } from './helpers';

const worker = createWorker();
const context = () => executionContext().ctx;

describe('digital commerce preview boundary', () => {
  it('reports sandbox-only provider readiness and fixed server-owned prices', async () => {
    const response = await worker.fetch(new Request('https://hyperion-industries.dev/api/commerce/readiness'), baseEnv(), context());
    const result = await response.json() as { release_state: string; public_checkout_enabled: boolean; digital_products: Array<{ id: string; price_minor: number }>; providers: { paypal: { role: string }; stripe: { role: string } } };
    expect(response.status).toBe(200);
    expect(result.release_state).toBe('sandbox_setup_required');
    expect(result.public_checkout_enabled).toBe(false);
    expect(result.digital_products.map((product) => product.price_minor)).toEqual([1900, 2900, 4900]);
    expect(result.providers.paypal.role).toBe('primary');
    expect(result.providers.stripe.role).toBe('standby');
  });

  it('validates an adaptive configuration without returning the compiled package', async () => {
    const response = await worker.fetch(postJson('/api/commerce/products/preview', {
      product_id: 'agent-policy',
      configuration: { business: 'Example Co', project: 'Internal application', canonical: 'AGENTS.md', authorityOwner: 'Project owner' },
      projections: ['codex', 'claude-code'],
    }), baseEnv(), context());
    const result = await response.json() as { contract_version: string; checkout_enabled: boolean; preview: { artifact_names: string[]; summary: string; configuration_sha256: string } };
    expect(response.status).toBe(200);
    expect(result.contract_version).toBe('hyperion.digital-product-preview/1');
    expect(result.checkout_enabled).toBe(false);
    expect(result.preview.artifact_names).toContain('CLAUDE.md');
    expect(result.preview.artifact_names).toContain('AGENTS.md');
    expect(result.preview.summary).toContain('runtime permissions');
    expect(result.preview.configuration_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(result)).not.toContain('<!-- Hyperion license');
  });

  it('rejects incomplete and unknown product configurations', async () => {
    const invalid = await worker.fetch(postJson('/api/commerce/products/preview', {
      product_id: 'flight-pack', configuration: { project: 'Underspecified project' },
    }), baseEnv(), context());
    expect(invalid.status).toBe(422);
    const badField = await worker.fetch(postJson('/api/commerce/products/preview', {
      product_id: 'flight-pack', configuration: { project: 'X', objective: 'Y', scope: 'Z', acceptance: 'A', verification: 'npm test', buyerEmail: 'attacker@example.com' },
    }), baseEnv(), context());
    expect(badField.status).toBe(422);
  });

  it('does not create a purchase or return customer artifacts from the preview route', async () => {
    const response = await worker.fetch(postJson('/api/commerce/products/preview', {
      product_id: 'routing-kit',
      configuration: { hardware: '64 GB RAM', localRuntime: 'Ollama', subscriptions: 'ChatGPT Plus', workloads: 'private summaries', monthlyBudget: '20', constraints: 'No public data' },
    }), baseEnv(), context());
    const result = await response.json() as Record<string, unknown>;
    expect(response.status).toBe(200);
    expect(result).not.toHaveProperty('files');
    expect(result).not.toHaveProperty('checkout_url');
    expect(result).not.toHaveProperty('entitlement');
  });
});
