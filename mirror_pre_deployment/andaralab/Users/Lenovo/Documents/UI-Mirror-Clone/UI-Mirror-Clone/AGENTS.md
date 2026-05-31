# Agent Operating Contract (DO NOT CHANGE STRATEGY)

This repository has a fixed production recovery strategy for VPS deploys.
All code assistants (Cursor, Codex, Claude, etc.) MUST follow this contract.

## 1) Single Deploy Method (Mandatory)

- Deploy only with:
  - `python vps_deploy.py`
- Do not introduce alternative deploy flows unless explicitly requested by maintainer.
- Do not replace with ad-hoc manual docker commands as default workflow.

## 2) Data Source of Truth (Mandatory)

- Backend live data is source of truth:
  - `http://76.13.17.91:3001/api/*`
- Frontend must render the same live data counts (datasets/pages/posts), not stale local cache.
- Never switch frontend back to localhost-only API defaults in production builds.

## 3) Frontend API Routing Policy (Mandatory)

- Keep production API routing resilient:
  - Primary: same-origin `/api`
  - Fallback: `http://76.13.17.91:3001/api`
- Do not remove API fallback logic without explicit maintainer approval.

## 4) Persistence Policy (Mandatory)

- Backend data must stay on VPS host bind mount:
  - `/opt/andaralab-data:/data`
- Never move persistent data back into ephemeral container filesystem.

## 5) CORS Policy (Current Incident Recovery Mode)

- Current production incident mode keeps CORS open for fast recovery.
- Do not tighten CORS or origin allowlist during active incident handling unless requested.

## 6) Validation Required After Every Deploy

Assistants must verify all of the following after deploy:

- `http://76.13.17.91:3001/api/datasets` returns expected live count
- `http://76.13.17.91:3001/api/pages` returns expected live count
- `http://76.13.17.91` returns HTTP 200
- `http://76.13.17.91/admin` returns HTTP 200

If any check fails, continue fixing and redeploying until all pass.

## 7) Prohibited Changes (unless explicitly requested)

- Do not change VPS host target (`76.13.17.91`) for production path.
- Do not remove deploy verification steps in `vps_deploy.py`.
- Do not silently re-enable stale frontend fallback behavior as default.

## 8) Hook Enforcement (all laptops)

- Every laptop must install repo hooks:
  - `pnpm run hooks:install`
- Hooks block commit/push when deployment contract drifts.
- Assistants must keep `.githooks/*` and `scripts/verify-deploy-contract.mjs` intact.

