# syntax=docker/dockerfile:1

# ---- Build stage: compile TypeScript -> dist/ with SWC ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Match the npm major that generated package-lock.json so `npm ci` stays in sync.
RUN npm i -g npm@11
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage: production-only deps + compiled output ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies only (rebuilds native modules e.g. argon2).
RUN npm i -g npm@11
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled app, i18n catalogs, migration runner config (all live under dist/).
COPY --from=build /app/dist ./dist
COPY --from=build /app/i18n ./i18n
# nestjs-i18n regenerates this types file at boot via process.cwd(); ship it so
# the write target exists and the container stays read-friendly.
COPY --from=build /app/src/modules/i18n/i18n.generated.ts ./src/modules/i18n/i18n.generated.ts
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh \
 && mkdir -p static \
 && chown -R node:node /app

USER node
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
