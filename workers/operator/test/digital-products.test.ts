import { describe, expect, it } from 'vitest';
import { compileDigitalProduct, DigitalProductValidationError, productPreview } from '../src/digital-products';

const buyer = { name: 'Victor Amani', verifiedEmail: 'buyer@example.com', licenseId: 'lic_abcd1234' };
const policy = {
  product_id: 'agent-policy',
  configuration: { business: 'Northstar', project: 'web application', canonical: 'AGENTS.md', authorityOwner: 'Operations lead' },
  projections: ['codex', 'claude-code', 'gemini-cli', 'generic'],
  buyer,
};
const flight = {
  product_id: 'flight-pack',
  configuration: { project: 'Public site', objective: 'Publish a validated product page', scope: 'StorePage.jsx and product config', acceptance: 'Responsive and keyboard usable', verification: 'npm run check' },
  buyer,
};
const routing = {
  product_id: 'routing-kit',
  configuration: { hardware: 'RTX 4080, 64 GB RAM', localRuntime: 'Ollama', subscriptions: 'ChatGPT Plus, Anthropic API', workloads: 'classification, coding, local private summaries', monthlyBudget: '120', constraints: 'Keep private records local; stop at monthly limit.' },
  buyer,
};

describe('compiled digital products', () => {
  it('compiles three materially distinct products with a complete buyer and artifact manifest', async () => {
    const [policyPackage, flightPackage, routingPackage] = await Promise.all([
      compileDigitalProduct(policy), compileDigitalProduct(flight), compileDigitalProduct(routing),
    ]);
    expect(policyPackage.manifest.price_minor).toBe(1900);
    expect(flightPackage.manifest.price_minor).toBe(2900);
    expect(routingPackage.manifest.price_minor).toBe(4900);
    expect(Object.keys(policyPackage.files)).toContain('CLAUDE.md');
    expect(Object.keys(flightPackage.files)).toContain('FLIGHT_PLAN.md');
    expect(Object.keys(routingPackage.files)).toContain('routing-policy.json');
    for (const product of [policyPackage, flightPackage, routingPackage]) {
      expect(product.manifest.contract_version).toBe('hyperion.digital-product-manifest/1');
      expect(product.manifest.generation_id).toMatch(/^gen_[a-f0-9]{24}$/);
      expect(product.manifest.buyer).toEqual(buyer);
      expect(JSON.parse(product.files['manifest.json'] ?? '{}')).toEqual(product.manifest);
      expect(product.manifest.artifacts.map((artifact) => artifact.path)).not.toContain('manifest.json');
      for (const artifact of product.manifest.artifacts) {
        expect(product.files[artifact.path]).toBeTruthy();
        expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(artifact.byte_length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic and keeps provider adapters aligned to one canonical authority', async () => {
    const first = await compileDigitalProduct(policy);
    const second = await compileDigitalProduct(policy);
    expect(first.manifest).toEqual(second.manifest);
    expect(first.files).toEqual(second.files);
    const canonical = first.files['AGENTS.md'];
    expect(canonical).toContain('Ask the named human owner');
    expect(canonical).toContain('Runtime permissions and approval controls');
    for (const projection of ['CLAUDE.md', 'GEMINI.md', 'AGENT_INSTRUCTIONS.md']) {
      expect(first.files[projection]).toContain('AGENTS.md');
      expect(first.files[projection]).toContain('adds no authority beyond that policy');
      expect(first.files[projection]).toContain(buyer.verifiedEmail);
    }
  });

  it('uses format-valid buyer watermarks in markdown and JSON artifacts', async () => {
    const [agentPackage, routingPackage] = await Promise.all([compileDigitalProduct(policy), compileDigitalProduct(routing)]);
    expect(agentPackage.files['AGENTS.md'] ?? '').toMatch(/<!-- Hyperion license \| Victor Amani \| buyer@example\.com/);
    const routingJson = JSON.parse(routingPackage.files['routing-policy.json'] ?? '{}');
    expect(routingJson._hyperion_license.license_id).toBe(buyer.licenseId);
    expect(routingJson._hyperion_license.compiler_version).toBe('1.0.0');
    expect(routingJson._hyperion_license.configuration_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(agentPackage.files['AGENTS.md']).toContain(`config sha256 ${agentPackage.configuration_sha256}`);
    expect(agentPackage.files['manifest.json']).toContain(agentPackage.configuration_sha256);
    expect(routingPackage.files['budget-gates.env']).toContain(`config sha256 ${routingPackage.configuration_sha256}`);
    expect(productPreview(routingPackage).artifact_names).toContain('manifest.json');
  });

  it('keeps buyer identity from terminating the Markdown watermark comment', async () => {
    const personalized = await compileDigitalProduct({ ...policy, buyer: { ...buyer, name: 'Buyer -->\n<!-- forged' } });
    const markedPolicy = personalized.files['AGENTS.md'] ?? '';
    expect(markedPolicy.match(/<!--/g)).toHaveLength(1);
    expect(markedPolicy).not.toContain('<!-- forged');
  });

  it('rejects incomplete, conflicting, contradictory, or undeclared projections', async () => {
    await expect(compileDigitalProduct({ ...flight, configuration: { project: 'Only a name' } })).rejects.toBeInstanceOf(DigitalProductValidationError);
    await expect(compileDigitalProduct({ ...policy, configuration: { ...policy.configuration, canonical: '../outside/AGENTS.md' } })).rejects.toThrow(/repository-relative/);
    await expect(compileDigitalProduct({ ...policy, configuration: { ...policy.configuration, canonical: 'authority-matrix.md' } })).rejects.toThrow(/collide/);
    await expect(compileDigitalProduct({ ...policy, configuration: { ...policy.configuration, existingRules: 'Agents may deploy without approval.' } })).rejects.toThrow(/human approval/);
    await expect(compileDigitalProduct({ ...policy, projections: ['codex', 'made-up-agent'] })).rejects.toThrow(/Unsupported instruction projection/);
    await expect(compileDigitalProduct({ ...routing, configuration: { ...routing.configuration, constraints: 'Frontier API prohibited', monthlyBudget: '120' } })).rejects.toThrow(/conflicts with a constraint/);
  });
});
