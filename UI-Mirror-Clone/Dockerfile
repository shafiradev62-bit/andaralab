# API Server Dockerfile — builds and runs the Express API
# Deploy this separately on Railway/Render/Fly.io

FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@latest

# Copy entire monorepo so workspace:* references resolve
COPY package.json          ./
COPY pnpm-workspace.yaml   ./
COPY lib/                  ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

WORKDIR /app/artifacts/api-server

# Install dependencies (no lockfile — pnpm resolves fresh in Linux)
# @tanstack/react-query has devDependency @tanstack/query-test-utils NOT on npm.
# Fix: create local stub and add override entry to pnpm-workspace.yaml.
RUN mkdir -p /app/stub/@tanstack/query-test-utils && \
    printf '{"name":"@tanstack/query-test-utils","version":"0.0.0","main":"index.js"}' > /app/stub/@tanstack/query-test-utils/package.json && \
    printf '// stub' > /app/stub/@tanstack/query-test-utils/index.js && \
    printf '\n  "@tanstack/query-test-utils": "file:/app/stub"\n' >> /app/pnpm-workspace.yaml && \
    pnpm install

RUN pnpm run build

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080
ENV DEPLOY_WEBHOOK_SECRET=${DEPLOY_WEBHOOK_SECRET:-}

CMD ["sh", "-c", "node --enable-source-maps ./dist/index.mjs"]
