# region Common

FROM node:26.12.1-alpine3.24 AS base

LABEL maintainer="ezTEAM <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezcounter"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

# ---
# Base image for dependencies
FROM base AS builder
WORKDIR /usr/dev

ENV TURBO_CACHE_DIR="/turbo"

COPY --from=ghcr.io/pnpm/pnpm:12-alpine /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done

COPY . .

RUN --mount=type=cache,id=pnpm,target=/var/cache/pnpm pnpm --store-dir /var/cache/pnpm ci

# Run check to ensure everything can be bundled safely
RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run check

# endregion
# ---
# region Database

# Prepare dependencies for database client
FROM builder AS database-builder
WORKDIR /usr/dev

RUN pnpm deploy --filter @ezreeport/database --prod /usr/build/database
# ---
# Final image to run migrations
FROM base AS migrate
ENV NODE_ENV=production
WORKDIR /usr/build/database

COPY --from=database-builder /usr/build/database .

CMD [ "npx", "prisma", "migrate", "deploy" ]

# endregion
# ---
# region API

# Prepare prod dependencies for api
FROM builder AS api-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-api#build

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-api --prod /usr/build/api

WORKDIR /usr/build/api

# Prepare for final stage
RUN mkdir ./out && \
    cp -r ./node_modules ./package.json ./dist ./out && \
    mv ./out/dist/config ./out/config

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

# Grab dependencies and bundled files
COPY --from=api-builder /usr/build/api/out .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "dist/app.mjs" ]

# endregion
# ---
# region Enricher

# Prepare prod dependencies for enricher
FROM builder AS enricher-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-enricher#build

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-enricher --prod /usr/build/enricher

WORKDIR /usr/build/enricher

# Prepare for final stage
RUN mkdir ./out && \
    cp -r ./node_modules ./package.json ./dist ./out && \
    mv ./out/dist/config ./out/config

# ---
# Final image to run Enricher service
FROM base AS enricher
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/enricher

COPY --from=enricher-builder /usr/build/enricher/out .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "dist/app.mjs" ]

# endregion
# ---
# region Harvester

# Prepare prod dependencies for Harvester
FROM builder AS harvester-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-harvester#build

# Resolve dependencies and add it to bundle
RUN pnpm deploy --filter ezcounter-harvester --prod /usr/build/harvester

WORKDIR /usr/build/harvester

# Prepare for final stage
RUN mkdir ./out && \
    cp -r ./node_modules ./package.json ./dist ./out && \
    mv ./out/dist/config ./out/config

# ---
# Final image to run Harvester service
FROM base AS harvester
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/harvester

COPY --from=harvester-builder /usr/build/harvester/out .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "dist/app.mjs" ]

# endregion
# ---
# region Registry

# Prepare prod dependencies for Registry
FROM builder AS registry-builder
WORKDIR /usr/dev

RUN --mount=type=cache,id=turbo,target=/turbo pnpm turbo run ezcounter-registry#build

# Resolve dependencies
RUN pnpm deploy --filter ezcounter-registry --prod /usr/build/registry

WORKDIR /usr/build/registry

# Prepare for final stage
RUN mkdir ./out && \
    cp -r ./node_modules ./package.json ./dist ./out && \
    mv ./out/dist/config ./out/config

# ---
# Final image to run Registry service
FROM base AS registry
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/registry

COPY --from=registry-builder /usr/build/registry/out .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "node", "--enable-source-maps", "dist/app.mjs" ]

# endregion
# ---
# region All In One

# Final image to run all services
FROM base AS aio
EXPOSE 8080
ENV NODE_ENV=production \
    NODE_USE_ENV_PROXY=1
WORKDIR /usr/build

RUN npm install -g pm2@^7.1.0

COPY --from=api-builder /usr/build/api/out ./api
COPY --from=enricher-builder /usr/build/enricher/out ./enricher
COPY --from=harvester-builder /usr/build/harvester/out ./harvester

COPY ./services/ecosystem.config.js .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD ["pm2-runtime", "ecosystem.config.js"]

# endregion
