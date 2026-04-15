FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@latest

# Copy entire monorepo so workspace:* refs resolve
COPY package.json          ./
COPY pnpm-lock.yaml        ./
COPY pnpm-workspace.yaml   ./
COPY lib/                  ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

WORKDIR /app/artifacts/api-server

# Use --no-frozen-lockfile because the lockfile was generated on a different OS
# and the platform-specific overrides may not match at pixel level
RUN pnpm install --no-frozen-lockfile

RUN pnpm run build

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
