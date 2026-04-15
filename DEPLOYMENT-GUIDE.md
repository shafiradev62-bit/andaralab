# 🚀 Auto-Deploy Setup Guide - Andara Lab UI

## ✅ Deployment Status
- **Production URL**: https://andaralab-ui.vercel.app
- **Preview URL**: https://andaralab-lkxp7b875-rahmis-projects-881d2cc1.vercel.app
- **Access IP**: http://76.13.17.91/

## 🔑 SSH Key Configuration

Your SSH public key has been configured:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHiJ4FqnnJFpvAwvppiXJRDEP0BChI0qCdapjN7n8P7p shafiradev62@gmail.com
```

### Step 1: Add SSH Key to GitHub
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Title: `UI-Mirror-Clone Deployment Key`
4. Paste the SSH key above
5. Click "Add SSH key"

### Step 2: Connect GitHub to Vercel for Auto-Deploy

**Option A: Through Vercel Dashboard (Recommended)**
1. Visit https://vercel.com/new
2. Import your Git repository: `shafiradev62-bit/andara-lab`
3. Select the existing project or create new one
4. Vercel will automatically deploy on every push!

**Option B: Using Vercel CLI**
```bash
cd UI-Mirror-Clone
vercel link
vercel --prod
```

## 🔄 Automatic Deployment Workflow

Once connected, the workflow is:
1. Make changes to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. Vercel automatically builds and deploys!
4. Get preview URL for every PR/push

## 📁 Project Structure
```
UI-Mirror-Clone/
├── artifacts/
│   └── andaralab/          # Main application (Vite + React)
│       ├── src/
│       ├── dist/public/    # Build output
│       └── package.json
├── vercel.json             # Vercel configuration
└── .vercelignore           # Files to exclude from deployment
```

## ⚙️ Build Configuration
- **Framework**: Vite
- **Build Command**: `pnpm --filter @workspace/andaralab run build`
- **Output Directory**: `artifacts/andaralab/dist/public`
- **Install Command**: `pnpm install`

## 🌐 Environment Variables

If you need to add environment variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `VITE_API_BASE_URL` if needed
3. Redeploy

## 🎯 Quick Commands

### Local Development
```bash
cd UI-Mirror-Clone
pnpm install
pnpm --filter @workspace/andaralab run dev
```

### Manual Deploy to Vercel
```bash
cd UI-Mirror-Clone
vercel --archive=tgz --yes
```

### Deploy to Production
```bash
cd UI-Mirror-Clone
vercel --prod --archive=tgz --yes
```

## 📞 Support
For issues or questions, contact: shafiradev62@gmail.com

---
**Happy Deploying! 🎉**
