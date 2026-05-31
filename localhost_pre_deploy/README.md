# AndaraLab Localhost - Pre-Deploy State (5 Mei 7:52 PM)

## Setup

This directory contains the production state BEFORE deploy on 5 Mei 2026, 7:52 PM.

### Prerequisites
- Docker and Docker Compose installed
- AndaraLab Docker images available (andaralab-backend:latest, andaralab-frontend:latest)

### Run Localhost

```bash
# Start containers
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Access

- Frontend: http://localhost:8081
- Backend API: http://localhost:3002/api/datasets
- Admin: http://localhost:8081/admin

### Data

All data files are in `./data/` directory:
- datasets.json (55 datasets)
- pages.json (32 pages)
- posts.json (18 posts)
- images/ (uploaded images)

### Comparison

Compare this localhost with current production:
- Production: http://andaralab.id
- Localhost: http://localhost:8081

Look for:
- Missing datasets
- Modified content
- Changed layouts
