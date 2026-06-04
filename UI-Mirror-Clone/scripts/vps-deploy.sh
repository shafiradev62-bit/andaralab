#!/usr/bin/env bash
# Host-side deploy — andaralab-rules.md (dipanggil systemd / .deploy-trigger)
set -euo pipefail
exec bash "$(dirname "$0")/vps-deploy-on-server.sh"
