# Andaralab Platform

Enterprise data visualization and content management platform.

## Architecture

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express
- **Database:** SQLite with JSON storage
- **Infrastructure:** Docker with bind mount persistence

## Project Structure

```
andaralab/
├── UI-Mirror-Clone/             # Main application directory
│   ├── artifacts/andaralab/     # Application source code
│   ├── deployment/              # Production deployment scripts
│   ├── infrastructure/          # Docker configurations
│   ├── docs/                    # Technical documentation
│   ├── scripts/                 # Build automation
│   ├── docker-compose.yml       # Container orchestration
│   ├── Dockerfile               # Backend image
│   └── Dockerfile.frontend      # Frontend image
├── continue_deployment.py       # Resume interrupted deployments
├── deploy_to_new_vps.py         # VPS migration utility
├── DEPLOYMENT.md                # Complete deployment guide
└── hostinger_nameserver_setup.md # DNS configuration
```

## Quick Start

### Local Development
```bash
cd UI-Mirror-Clone
npm install
npm run dev
```

### Production Deployment
```bash
cd UI-Mirror-Clone/deployment
python vps_deploy.py
```

## Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment procedures
- [DNS Setup](hostinger_nameserver_setup.md) - Domain configuration
- [Agent Contract](UI-Mirror-Clone/AGENTS.md) - Development guidelines

## Data Safety

Production data is stored using bind mounts at `/opt/andaralab-data` on the VPS host, ensuring data persistence across container rebuilds. Automated daily backups with 14-day retention.

## API Endpoints

- `GET /api/datasets` - List datasets
- `GET /api/posts` - List blog posts
- `GET /api/pages` - List CMS pages
- `GET /api/health` - Health check

## License

Proprietary
