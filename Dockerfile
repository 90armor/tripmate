# syntax=docker/dockerfile:1

# Local development image for TripMate (ROADMAP D23). Runs `next dev` with the
# project source bind-mounted by docker-compose.yml. This is NOT a production
# image; no hosting decision has been made (ARCHITECTURE §87).

# --- base: Node 24 (matches .nvmrc) + pnpm, running as the non-root node user ---
FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
# Pre-create the directories the compose file mounts anonymous volumes on, owned
# by node, so those volumes are writable by the app instead of root-owned.
RUN corepack enable \
  && mkdir -p /app/.next /app/node_modules /home/node/.pnpm-store \
  && chown -R node:node /app /home/node/.pnpm-store
USER node
WORKDIR /app

# --- deps: install from the lockfile only, so this layer is rebuilt only when ---
# --- package.json, pnpm-lock.yaml or pnpm-workspace.yaml change                ---
FROM base AS deps
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Download the pnpm version pinned in package.json "packageManager" into the node
# user's corepack cache now, so the container never downloads it at runtime and
# the version has a single source of truth.
RUN corepack install
# The cache mount target is the node user's pnpm store (passed explicitly), so
# repeated builds reuse downloaded packages. The store stays out of the image.
RUN --mount=type=cache,target=/home/node/.pnpm-store,uid=1000,gid=1000 \
  pnpm install --frozen-lockfile --store-dir /home/node/.pnpm-store

# --- dev: inherits /app/node_modules (Linux binaries) from deps as a layer ---
FROM deps AS dev
# .dockerignore excludes the host node_modules, so this copy cannot overwrite
# the Linux node_modules inherited from deps. compose bind-mounts the source over
# /app at runtime; this copy lets the image also work on its own (CI, migrate).
COPY --chown=node:node . .
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
