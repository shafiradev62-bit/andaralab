# 🚀 AndaraLab - Quick Start Guide

## ⚡ FASTEST Way to Deploy (Windows):

### Just Double-Click This File:
👉 **`deploy-vps-windows.bat`**

That's it! The script will:
1. ✅ Build Docker images
2. ✅ Transfer to your VPS (76.13.17.91)
3. ✅ Deploy and start containers
4. ✅ Show you the live URLs

**Time**: ~5 minutes  
**Result**: Live app at http://76.13.17.91

---

## 📋 What You're Deploying:

### Frontend (Vite + React)
- Framework: Vite + React 18
- UI Library: shadcn/ui
- Routing: Wouter
- State: TanStack Query
- Port: 80 (via Nginx)

### Backend (Express API)
- Runtime: Node.js 20
- Framework: Express
- Logger: Pino
- Storage: In-memory (for demo)
- Port: 3001

### CMS Features
- Data Hub: Create/edit charts
- Pages: Manage static pages (EN/ID)
- Blog: Create blog posts
- Real-time updates
- localStorage fallback

---

## 🎯 After Deployment:

### Access Your App:
- **Homepage**: http://76.13.17.91
- **Admin Panel**: http://76.13.17.91/admin
- **API**: http://76.13.17.91:3001/api

### Test CMS:
1. Go to http://76.13.17.91/admin
2. Click "Data Hub" tab
3. Edit any dataset
4. Save changes ✅

---

## 🔧 Need Help?

### Full Documentation:
📖 **VPS-DEPLOYMENT-GUIDE.md** - Complete setup guide

### Troubleshooting:
- Check if Docker is running on VPS
- Verify ports 80 and 3001 are open
- Check container logs: `docker compose logs`

---

## 📞 Contact:

**Email**: shafiradev62@gmail.com  
**GitHub**: https://github.com/shafiradev62-bit  

---

## ✨ Ready?

**Double-click**: `deploy-vps-windows.bat`  
**Wait**: 5 minutes  
**Done**: Live at http://76.13.17.91 🎉

Good luck! 🚀
