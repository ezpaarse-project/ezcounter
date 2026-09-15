# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:24.20.0-alpine3.24 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezcounter"

ENV PNPM_HOME="/pnpm" \
    TURBO_CACHE_DIR="/turbo" \
    PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a
# ---
# Base image for dependencies
FROM base AS pnpm
WORKDIR /usr/dev

COPY . .

RUN corepack enable && corepack install

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm ci

# Run check to ensure everything can be bundled safely
RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run check

# endregion
# ---
# region Database

# Prepare dependencies for database client
FROM pnpm AS database-pnpm
WORKDIR /usr/dev

RUN pnpm deploy --filter @ezreeport/database --prod /usr/build/database
# ---
# Final image to run migrations
FROM base AS migrate
ENV NODE_ENV=production
WORKDIR /usr/build/database

COPY --from=database-pnpm /usr/build/database .

CMD [ "npx", "prisma", "migrate", "deploy" ]

# endregion
# ---
# region API

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-api --prod /usr/build/api && \
  cp -r /usr/build/api/node_modules /usr/build/api/package.json /usr/build/api/dist

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

# Grab dependencies and bundled files
COPY --from=api-builder /usr/build/api/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Enricher

# Prepare prod dependencies for enricher
FROM pnpm AS enricher-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-enricher#build

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-enricher --prod /usr/build/enricher && \
  cp -r /usr/build/enricher/node_modules /usr/build/enricher/package.json /usr/build/enricher/dist

# ---
# Final image to run Enricher service
FROM base AS enricher
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/enricher

COPY --from=enricher-builder /usr/build/enricher/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region Harvester

# Prepare prod dependencies for Harvester
FROM pnpm AS harvester-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-harvester#build

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-harvester --prod /usr/build/harvester && \
  cp -r /usr/build/harvester/node_modules /usr/build/harvester/package.json /usr/build/harvester/dist

# ---
# Final image to run Harvester service
FROM base AS harvester
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/harvester

COPY --from=harvester-builder /usr/build/harvester/dist .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "app.cjs" ]

# endregion
# ---
# region All In One

# Final image to run all services
FROM base AS aio
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build

RUN npm install -g pm2@^7.0.3

COPY --from=api-builder /usr/build/api/dist ./api
COPY --from=enricher-builder /usr/build/enricher/dist ./enricher
COPY --from=harvester-builder /usr/build/harvester/dist ./harvester

COPY ./services/ecosystem.config.js .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
