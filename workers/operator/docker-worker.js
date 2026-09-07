// Local-only composition of the public edge APIs and the intake Worker.
// Production keeps their separate routes and bindings. Never forward preview
// requests to a private catalog, customer portal, or remote authority.
import operator from './src/index.ts';
import { handleForgeGuide } from '../site-edge/src/forge-guide.js';
import { handleForgeProducts } from '../site-edge/src/forge-products.js';
import { handleConfiguratorApi } from '../site-edge/src/configurator-api.js';
import { handleClientAccountApi } from '../site-edge/src/client-account-api.js';

const denyRemote = async () => { throw new Error('local_preview_remote_disabled'); };

export default {
  ...operator,
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    if (path === '/api/forge/guide') return handleForgeGuide(request);
    if (path === '/api/forge/products') return handleForgeProducts(request, {}, denyRemote);
    if (path.startsWith('/api/configurator/')) return handleConfiguratorApi(request, {}, denyRemote);
    if (path.startsWith('/api/client/')) return handleClientAccountApi(request, {}, denyRemote);
    return operator.fetch(request, env, ctx);
  },
};
