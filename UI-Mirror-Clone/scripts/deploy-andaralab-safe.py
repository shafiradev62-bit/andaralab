#!/usr/bin/env python3
"""Deploy aman — andaralab-rules.md. SSH key: id_ed25519_andaralab_new"""

from __future__ import annotations

import os
import sys
from datetime import datetime
from pathlib import Path

import paramiko

HOST = "177.7.55.182"
USER = "root"
REMOTE_ROOT = "/opt/andara-lab"
DATA_DIR = "/opt/andaralab-data"
CONTAINER = "andaralab-frontend-1"

REPO = Path(__file__).resolve().parent.parent
ANDARALAB = REPO / "artifacts/andaralab"
API_SRC = REPO / "artifacts/api-server/src"

FE_FILES = [
    "src/components/AboutSection.tsx",
    "src/components/DataHub.tsx",
    "src/components/FeaturedInsights.tsx",
    "src/components/HomeAboutSection.tsx",
    "src/components/LatestInsights.tsx",
    "src/components/Navbar.tsx",
    "src/components/NewsletterSection.tsx",
    "src/lib/cms-store.ts",
    "src/lib/locale.tsx",
    "src/pages/AboutPage.tsx",
    "src/pages/AdminPage.tsx",
    "src/pages/ContactPage.tsx",
    "src/pages/SectionPage.tsx",
]
BE_FILES = ["routes/pages.ts"]


def load_key() -> paramiko.PKey:
    for name in ("id_ed25519_andaralab_new", "id_ed25519_andaralab", "id_rsa_andaralab"):
        p = Path.home() / ".ssh" / name
        if not p.is_file():
            continue
        try:
            return paramiko.Ed25519Key.from_private_key_file(str(p))
        except Exception:
            return paramiko.RSAKey.from_private_key_file(str(p))
    raise SystemExit("SSH key tidak ditemukan")


def connect() -> paramiko.SSHClient:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, USER, pkey=load_key(), timeout=60, banner_timeout=60, auth_timeout=60)
    return c


def run(c: paramiko.SSHClient, cmd: str, timeout: int = 600) -> str:
    print(f">> {cmd[:100]}...")
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out)
    if err:
        print(err, file=sys.stderr)
    if code != 0:
        raise RuntimeError(f"exit {code}: {err or out}")
    return out


def get_counts(c: paramiko.SSHClient) -> dict[str, int]:
    out = run(
        c,
        "python3 - <<'PY'\nimport json, os\n"
        f"base='{DATA_DIR}'\n"
        "for name in ('datasets','posts','pages'):\n"
        " p=os.path.join(base, f'{name}.json')\n"
        " print(f'{name}='+str(len(json.load(open(p)))))\nPY",
    )
    result: dict[str, int] = {}
    for line in out.splitlines():
        if "=" in line:
            k, v = line.strip().split("=", 1)
            result[k] = int(v)
    return result


def sftp_upload(sftp: paramiko.SFTPClient, c: paramiko.SSHClient, local: Path, remote: str) -> None:
    run(c, f"mkdir -p {remote.rsplit('/', 1)[0]}")
    sftp.put(str(local), remote)


def main() -> None:
    print("=== deploy-andaralab-safe.py ===")
    c = connect()
    print("SSH OK")
    sftp = c.open_sftp()
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = f"{DATA_DIR}-backup-{ts}"

    before = get_counts(c)
    print("BEFORE:", before)
    run(c, f"cp -r {DATA_DIR} {backup}")

    for rel in FE_FILES:
        local = ANDARALAB / rel.replace("/", os.sep)
        if local.is_file():
            sftp_upload(sftp, c, local, f"{REMOTE_ROOT}/artifacts/andaralab/{rel}")

    for rel in BE_FILES:
        local = API_SRC / rel.replace("/", os.sep)
        if local.is_file():
            sftp_upload(sftp, c, local, f"{REMOTE_ROOT}/artifacts/api-server/src/{rel}")

    run(c, f"cd {REMOTE_ROOT}/artifacts/andaralab && pnpm run build", timeout=900)
    run(
        c,
        f"docker cp {REMOTE_ROOT}/artifacts/andaralab/dist/public/. {CONTAINER}:/usr/share/nginx/html/ && "
        f"docker exec {CONTAINER} nginx -s reload",
    )
    run(
        c,
        "pm2 restart api-server 2>/dev/null || "
        f"(cd {REMOTE_ROOT}/artifacts/api-server && "
        f"PORT=3001 NODE_ENV=production DATA_DIR={DATA_DIR} CORS_ALLOW_ALL=true "
        "pm2 start --interpreter ./node_modules/.bin/tsx src/index.ts --name api-server)",
    )

    after = get_counts(c)
    print("AFTER:", after)
    for k in ("datasets", "posts", "pages"):
        if k in before and k in after and after[k] < before[k]:
            raise SystemExit(f"ABORT {k}: {before[k]}->{after[k]}. Restore {backup}")

    sftp.close()
    c.close()
    print("=== Deploy selesai ===")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FAIL:", e, file=sys.stderr)
        sys.exit(1)
