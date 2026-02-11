# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:24.4.1-alpine3.22 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
# LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/..."

ENV HUSKY=0
ENV TURBO_UI=false
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a

RUN corepack enable \
  && corepack prepare pnpm@10.28.2 --activate

# endregion
# ---
# region Turbo

# Base image for turbo, allow to properly install split each service
FROM base AS turbo
WORKDIR /usr/src

COPY ./package.json ./

RUN pnpm run turbo:install

COPY . .

# endregion
# ---
# region Models

# Extract models from repo
FROM turbo AS models-turbo

RUN turbo prune @ezcounter/models --docker --out-dir ./models
# ---
# Prepare dependencies for models
FROM turbo AS models-pnpm
WORKDIR /usr/build/models

COPY --from=models-turbo /usr/src/models/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=models-turbo /usr/src/models/full .

RUN pnpm deploy --legacy --filter @ezcounter/models ./dev
# ---
# Generate COUNTER schemas using dev dependencies
FROM turbo AS models-builder
WORKDIR /usr/build/models/dev

COPY --from=models-pnpm /usr/build/models/dev .

# Shared TS config
COPY ./tsconfig.json /usr/build/tsconfig.json

# Generate COUNTER schemas
RUN pnpm run build:schemas

# endregion
# ---
# region API

# Extract api from repo
FROM turbo AS api-turbo

RUN turbo prune ezcounter-api --docker --out-dir ./api
# ---
# Prepare prod dependencies for API
FROM turbo AS api-pnpm
WORKDIR /usr/build/api

# Shared TS config
COPY ./tsconfig.json .
COPY --from=api-turbo /usr/src/api/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=api-turbo /usr/src/api/full .

COPY --from=models-builder /usr/build/models/dev/dist ./packages/models/dist

RUN pnpm deploy --legacy --filter ezcounter-api --prod ./prod

# ---
# Final image to run API service
FROM base AS api
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/api

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

COPY --from=api-pnpm /usr/build/api/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Enricher

# Extract enricher from repo
FROM turbo AS enricher-turbo

RUN turbo prune ezcounter-enricher --docker --out-dir ./enricher
# ---
# Prepare prod dependencies for enricher
FROM turbo AS enricher-pnpm
WORKDIR /usr/build/enricher

# Shared TS config
COPY ./tsconfig.json .
COPY --from=enricher-turbo /usr/src/enricher/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=enricher-turbo /usr/src/enricher/full .

COPY --from=models-builder /usr/build/models/dev/dist ./packages/models/dist

RUN pnpm deploy --legacy --filter ezcounter-enricher --prod ./prod

# ---
# Final image to run Enricher service
FROM base AS enricher
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/enricher

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

COPY --from=enricher-pnpm /usr/build/enricher/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Harvester

# Extract harvester from repo
FROM turbo AS harvester-turbo

RUN turbo prune ezcounter-harvester --docker --out-dir ./harvester
# ---
# Prepare prod dependencies for Harvester
FROM turbo AS harvester-pnpm
WORKDIR /usr/build/harvester

# Shared TS config
COPY ./tsconfig.json .
COPY --from=harvester-turbo /usr/src/harvester/json .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY --from=harvester-turbo /usr/src/harvester/full .

COPY --from=models-builder /usr/build/models/dev/dist ./packages/models/dist

RUN pnpm deploy --legacy --filter ezcounter-harvester --prod ./prod

# ---
# Final image to run Harvester service
FROM base AS harvester
EXPOSE 8080
ENV NODE_ENV=production
ENV NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/harvester

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

COPY --from=harvester-pnpm /usr/build/harvester/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
