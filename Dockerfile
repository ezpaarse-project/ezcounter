# region Common

# Base image for node, enable usage of pnpm and allow to run apps
FROM node:24.4.1-alpine3.22 AS base
LABEL maintainer="ezTeam <ezteam@couperin.org>"
LABEL org.opencontainers.image.source="https://github.com/ezpaarse-project/ezcounter"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Update APK registry
RUN apk update \
  && apk upgrade -U -a
# ---
# Base image for dependencies
FROM base AS pnpm
WORKDIR /usr/src

COPY ./package.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./

RUN corepack enable && corepack install

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm ci

COPY . .

# endregion
# ---
# region COUNTER

# Prepare dependencies for COUNTER schemas
FROM pnpm AS counter-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter @ezcounter/counter /usr/build/counter/dev
# ---
# Generate COUNTER schemas using dev dependencies
FROM base AS counter-builder
WORKDIR /usr/build/counter

COPY --from=counter-pnpm /usr/build/counter/dev .

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

# Generate COUNTER schemas
RUN npm run build:schemas

# endregion
# ---
# region Database

# Prepare dependencies for DATABASE
FROM pnpm AS database-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter @ezcounter/database /usr/build/database/dev
# ---
# Generate prisma client using dev dependencies
FROM base AS database-builder
WORKDIR /usr/build/database

# Install prisma dependencies
RUN apk add --no-cache --update python3 \
  && ln -sf python3 /usr/bin/python

COPY --from=database-pnpm /usr/build/database/dev .

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

# Generate prisma-client
RUN npm run db:generate
# ---
# Final image to run migrations
FROM database-builder AS migrate

CMD [ "npm", "run", "db:deploy" ]

# endregion
# ---
# region API

# Prepare prod dependencies for API
FROM pnpm AS api-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezcounter-api --prod /usr/build/api/prod

# Copy generated files
COPY --from=counter-builder /usr/build/counter/dist /usr/build/api/prod/node_modules/@ezcounter/counter/dist
COPY --from=database-builder /usr/build/database/.prisma /usr/build/api/prod/node_modules/@ezcounter/database/.prisma

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

# Prepare prod dependencies for enricher
FROM pnpm AS enricher-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezcounter-enricher --prod /usr/build/enricher/prod

# ---
# Final image to run Enricher service
FROM base AS enricher
EXPOSE 8080
ENV NODE_ENV=production
WORKDIR /usr/build/enricher

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

COPY --from=enricher-pnpm /usr/src/dist/enricher/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
# ---
# region Harvester

# Prepare prod dependencies for Harvester
FROM pnpm AS harvester-pnpm
WORKDIR /usr/src

RUN pnpm deploy --filter ezcounter-harvester --prod /usr/build/harvester/prod

# Copy generated files
COPY --from=counter-builder /usr/build/counter/dist /usr/build/harvester/prod/node_modules/@ezcounter/counter/dist

# ---
# Final image to run Harvester service
FROM base AS harvester
EXPOSE 8080
ENV NODE_ENV=production
ENV NODE_USE_ENV_PROXY=1
WORKDIR /usr/build/harvester

# Shared TS config
COPY ./tsconfig.json ../../tsconfig.json

COPY --from=harvester-pnpm /usr/src/dist/harvester/prod .

HEALTHCHECK --interval=1m --timeout=10s --retries=5 --start-period=20s \
  CMD wget -Y off --no-verbose --tries=1 --spider http://localhost:8080/health/probes/liveness || exit 1

CMD [ "npm", "run", "start" ]

# endregion
