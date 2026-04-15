# 🚀 VPS Deployment Guide - COMPLETE SETUP

## ✅ Why VPS Instead of Vercel?

**Vercel Issue**: 404 NOT_FOUND error  
**Reason**: Vercel static build doesn't work well with dynamic CMS that needs API backend

**Solution**: Deploy to your own VPS (76.13.17.91) with Docker!

---

## 🎯 What You Get:

- ✅ **Frontend**: Nginx serving Vite build on port 80
- ✅ **Backend**: Express API server on port 3001
- ✅ **CMS**: Fully functional with real database (in-memory for now)
- ✅ **Auto-Restart**: Docker containers restart automatically
- ✅ **One-Click Deploy**: Simple deployment scripts

---

## 📦 Files Created:

### 1. `Dockerfile.frontend`
Builds and serves the Vite frontend with Nginx

### 2. `docker-compose.yml`
Orchestrates both frontend + backend containers

### 3. `deploy-to-vps.sh` (Linux/Mac)
Automated deployment script for Unix systems

### 4. `deploy-vps-windows.bat` (Windows)
One-click deployment for Windows

---

## 🔧 Prerequisites on Your VPS:

Your VPS (76.13.17.91) should have:
- ✅ Docker installed
- ✅ Docker Compose installed
- ✅ SSH access enabled
- ✅ Port 80 open (HTTP)
- ✅ Port 3001 open (API)

### Install Docker on VPS (if not installed):
```bash
# SSH into your VPS
ssh root@76.13.17.91

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

---

## 🚀 Deployment Methods:

### Method 1: Windows One-Click (EASIEST) ⭐ RECOMMENDED

1. **Double-click**: `deploy-vps-windows.bat`
2. Wait for build (~3-5 minutes)
3. Done! Access at http://76.13.17.91

The script will:
- ✅ Build frontend Docker image
- ✅ Build backend Docker image
- ✅ Transfer images to VPS via SCP
- ✅ Deploy containers on VPS
- ✅ Show you the status

---

### Method 2: Linux/Mac Script

```bash
cd UI-Mirror-Clone/UI-Mirror-Clone
chmod +x deploy-to-vps.sh
./deploy-to-vps.sh
```

---

### Method 3: Manual Deployment

#### Step 1: Build Images Locally
```bash
cd UI-Mirror-Clone/UI-Mirror-Clone

# Build frontend
docker build -f Dockerfile.frontend -t andaralab-frontend .

# Build backend
docker build -f Dockerfile -t andaralab-backend .
```

#### Step 2: Transfer to VPS
```bash
# Save images
docker save andaralab-frontend | gzip > frontend.tar.gz
docker save andaralab-backend | gzip > backend.tar.gz

# Transfer files
scp frontend.tar.gz backend.tar.gz docker-compose.yml root@76.13.17.91:/root/
```

#### Step 3: Deploy on VPS
```bash
# SSH into VPS
ssh root@76.13.17.91

# On VPS:
cd /root

# Load images
docker load < frontend.tar.gz
docker load < backend.tar.gz

# Start containers
docker compose up -d

# Check status
docker ps

# View logs
docker logs andaralab-app-frontend
docker logs andaralab-app-backend
```

---

## 🌐 After Deployment:

### Access URLs:
- **Frontend**: http://76.13.17.91
- **Admin Panel**: http://76.13.17.91/admin
- **API Server**: http://76.13.17.91:3001/api/datasets

### Test CMS:
1. Open http://76.13.17.91/admin
2. Go to Data Hub tab
3. Click "Edit" on any dataset
4. Modify data and click "Save"
5. Should save successfully! ✅

---

## 🔍 Troubleshooting:

### Issue: "Cannot connect to Docker daemon"
**Solution**: 
```bash
# On VPS
sudo systemctl start docker
sudo systemctl enable docker
```

### Issue: "Port already in use"
**Solution**: 
```bash
# Check what's using port 80
sudo lsof -i :80

# Stop conflicting service or change port in docker-compose.yml
```

### Issue: "Permission denied"
**Solution**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: "Connection timeout"
**Solution**:
```bash
# Check firewall on VPS
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 3001/tcp
```

---

## 📊 Container Management:

### View Running Containers
```bash
docker ps
```

### View Logs
```bash
# All logs
docker compose logs -f

# Frontend logs only
docker logs -f andaralab-app-frontend

# Backend logs only
docker logs -f andaralab-app-backend
```

### Restart Containers
```bash
docker compose restart
```

### Stop All
```bash
docker compose down
```

### Update Deployment
```bash
# Rebuild and redeploy
docker compose down
docker compose up -d --build
```

---

## 🔐 Security Recommendations:

### 1. Setup Firewall
```bash
# On VPS
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 3001/tcp  # API
ufw enable
```

### 2. Enable HTTPS (Optional but Recommended)
Install Certbot for Let's Encrypt:
```bash
# On VPS
apt update
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com
```

### 3. Regular Updates
```bash
# Keep VPS updated
apt update && apt upgrade -y
```

---

## 💾 Data Persistence:

Currently, the backend uses **in-memory storage**, which means:
- ❌ Data resets when container restarts
- ❌ No permanent database

### To Add Persistent Database:

1. **Add PostgreSQL to docker-compose.yml**:
```yaml
services:
  db:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: andaralab
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: andaralab_db
    networks:
      - andaralab-network

volumes:
  postgres_data:
```

2. **Update backend to use Drizzle ORM + PostgreSQL**

---

## 📈 Performance Tips:

### 1. Add Redis Caching
```yaml
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - andaralab-network
```

### 2. Enable Gzip Compression
Add to nginx config:
```nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

### 3. Add CDN (Cloudflare)
Point your domain through Cloudflare for caching and DDoS protection.

---

## 🎯 Success Checklist:

After deployment, verify:

- [ ] Can access http://76.13.17.91
- [ ] Homepage loads correctly
- [ ] Admin panel accessible at /admin
- [ ] Can view datasets in Data Hub
- [ ] Can edit and save datasets
- [ ] Can create new content
- [ ] Changes persist (until container restart)
- [ ] Docker containers running (`docker ps`)
- [ ] No errors in logs (`docker logs`)

---

## 📞 Quick Commands Reference:

### Deploy
```bash
# Windows
deploy-vps-windows.bat

# Linux/Mac
./deploy-to-vps.sh
```

### Check Status
```bash
ssh root@76.13.17.91 "docker ps"
```

### View Logs
```bash
ssh root@76.13.17.91 "docker compose logs -f"
```

### Restart
```bash
ssh root@76.13.17.91 "docker compose restart"
```

---

## 🌟 Next Steps:

1. ✅ Deploy using the Windows script
2. ✅ Test all CMS functionality
3. ✅ Add custom domain (optional)
4. ✅ Setup HTTPS (recommended)
5. ✅ Add persistent database (for production)

---

## 📝 Deployment Info:

**VPS IP**: 76.13.17.91  
**SSH Key**: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHiJ4FqnnJFpvAwvppiXJRDEP0BChI0qCdapjN7n8P7p  
**Email**: shafiradev62@gmail.com  

**Frontend Port**: 80  
**Backend Port**: 3001  
**Docker Network**: andaralab-network  

---

## ✨ Ready to Deploy!

Run the Windows batch file and watch it go! 🚀

**Estimated Time**: 5-10 minutes (first time)  
**Subsequent Deploys**: 2-3 minutes  

Good luck! 🎉
