FROM node:24-bookworm-slim

WORKDIR /workspace

COPY workers/operator/package.json workers/operator/package-lock.json ./workers/operator/
RUN cd workers/operator && npm ci

COPY shared ./shared
COPY workers/operator ./workers/operator
COPY workers/site-edge/src ./workers/site-edge/src
COPY src/data ./src/data

WORKDIR /workspace/workers/operator
RUN npm run corpus:check && npm run typecheck \
  && chmod 0755 docker-entrypoint.sh \
  && mkdir -p /var/lib/hyperion-worker .wrangler/tmp node_modules/.mf \
  && chown -R node:node /var/lib/hyperion-worker .wrangler node_modules/.mf

USER node

EXPOSE 8787

ENTRYPOINT ["./docker-entrypoint.sh"]
