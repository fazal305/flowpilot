# node:24-slim (Debian/glibc), not alpine — argon2's native addon has
# prebuilt binaries for glibc but not reliably for musl, and rebuilding it
# from source in Alpine means dragging in python3/make/g++ for no benefit.
FROM node:24-slim

WORKDIR /app

# Copy every workspace's package.json first (npm needs the full workspace
# graph to resolve, even for packages we don't install deps for) before any
# source, so this layer only rebuilds when dependencies actually change.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install --workspace=apps/api --workspace=packages/shared

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace=apps/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/src/server.js"]
