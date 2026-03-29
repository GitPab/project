# 🚀 Deployment Guide - SACMA to Render + Vercel + Supabase (Free Tier)

## Overview
- **Frontend**: Vercel (Free forever)
- **Backend**: Render (Free tier - sleeps after 15min idle)
- **Database**: Supabase PostgreSQL (500MB free)
- **Images**: Cloudflare R2 (10GB free/month)

---

## Step 1: Setup Cloudflare R2 (Image Storage)

### 1.1 Create R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name: `sacma-images`
5. Click **Create bucket**

### 1.2 Create API Token
1. In R2, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Name: `sacma-upload`
4. Permissions: **Object Read & Write**
5. Click **Create API Token**
6. **SAVE THESE VALUES** (you won't see them again):
   - **Access Key ID**
   - **Secret Access Key**
   - **Jurisdiction-specific endpoint** (S3 API)

### 1.3 Enable Public Access
1. Go to your bucket settings
2. Click **Settings** tab
3. Scroll to **Bucket Access**
4. Click **Allow public access**
5. Click **Connect a domain** or use the default public URL
6. Copy the **Public URL** (looks like `https://pub-xxx.r2.dev`)

---

## Step 2: Setup Supabase PostgreSQL (Database)

### 2.1 Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub

### 2.2 Create New Project
1. Click **"New Project"**
2. Configure:
   - **Name**: `sacma-db`
   - **Database Password**: Generate strong password (save this!)
   - **Region**: Choose closest to your users (Singapore for Asia)
   - **Plan**: Free Tier
3. Click **"Create new project"**
4. Wait 2-3 minutes for setup

### 2.3 Get Database Connection URL
1. Click **"Settings"** (bottom left)
2. Click **"Database"** tab
3. Find **"Connection string"** section
4. Click **"URI"** tab
5. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual password

**Save this URL - you'll need it in Step 3**

---

## Step 3: Deploy Backend to Render

### 3.1 Prepare Backend for PostgreSQL

**Switch to PostgreSQL server:**
```bash
cd server
mv server.js server-sqlite-backup.js
mv server-pg.js server.js
```

**Or update package.json:**
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 3.2 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click **New Web Service**

### 3.3 Configure Backend
1. Connect your GitHub repo
2. Select the repository
3. Configure:
   - **Name**: `sacma-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3.4 Add Environment Variables

Click **Advanced** → **Environment Variables** and add:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-random-secret-key-at-least-32-characters
DATABASE_URL=postgresql://postgres:your-password@db.xxxxxx.supabase.co:5432/postgres
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key-from-step-1
R2_SECRET_ACCESS_KEY=your-secret-key-from-step-1
R2_BUCKET_NAME=sacma-images
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

**Important**: 
- Replace `your-password` with your Supabase password
- Replace database URL with your actual Supabase URL from Step 2
- Generate a random JWT_SECRET (32+ characters)
- Remove `DATABASE_PATH` (not needed for PostgreSQL)

### 3.5 Deploy
Click **Create Web Service**

**Note**: Copy your backend URL (e.g., `https://sacma-backend.onrender.com`)

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **Add New Project**

### 4.2 Configure Frontend
1. Import your GitHub repository
2. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Root Directory**: `./` (leave empty)

### 4.3 Add Environment Variables
Add:
```
VITE_API_URL=https://your-render-backend-url.onrender.com/api
```

Replace `your-render-backend-url` with your actual Render URL from Step 3.

### 4.4 Deploy
Click **Deploy**

---

## Step 5: Update Frontend Config (Important!)

### 5.1 Update vercel.json
Edit `vercel.json` in your project root:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-render-backend-url.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

### 5.2 Push Changes
```bash
git add .
git commit -m "Update deployment config for PostgreSQL"
git push
```

Vercel will automatically redeploy.

---

## Step 6: Test Everything

### 6.1 Test Backend
Open: `https://your-render-backend-url.onrender.com/api/universities`
Should return: `[]` (empty array initially)

### 6.2 Check Logs
In Render dashboard, check **Logs** tab for:
```
✅ Server running: http://localhost:10000/api
✅ Cloudflare R2 configured
✅ PostgreSQL configured
```

### 6.3 Test Frontend
Open: `https://your-vercel-app.vercel.app`

### 6.4 Test Image Upload
1. Go to Admin → Universities
2. Edit a university
3. Upload an image
4. Check if it appears (stored in R2)

---

## 📁 Project Structure After Deployment

```
project/
├── src/                    # Frontend code
├── server/                 # Backend code
│   ├── server.js          # PostgreSQL server (main)
│   ├── server-pg.js       # PostgreSQL version
│   ├── server-sqlite-backup.js  # SQLite backup
│   ├── package.json
│   └── render.yaml        # Render config
├── vercel.json            # Vercel frontend config
├── package.json           # Frontend deps
└── .env.local             # Local dev env
```

---

## 🔄 Common Issues & Solutions

### Issue 1: "Failed to connect to database"
**Solution**: 
- Check `DATABASE_URL` is correct in Render
- Verify Supabase project is active (not paused)
- Ensure password doesn't have special characters that need URL encoding

### Issue 2: "Failed to upload image"
**Solution**: Check R2 credentials in Render environment variables

### Issue 3: "CORS error"
**Solution**: Backend already has CORS enabled. If issue persists, update `server.js`:
```javascript
app.use(cors({
  origin: ['https://your-vercel-app.vercel.app', 'http://localhost:5173']
}));
```

### Issue 4: "Cannot connect to backend"
**Solution**: 
- Check `VITE_API_URL` is correct in Vercel
- Backend URL should be `https://...onrender.com/api` (include `/api`)

### Issue 5: Tables not created
**Solution**: Server auto-creates tables on startup. Check Render logs for "PostgreSQL tables initialized"

---

## 💰 Cost Summary

| Service | Free Tier | When to Upgrade |
|---------|-----------|-----------------|
| **Vercel** | Unlimited deployments | $20/mo for team features |
| **Render** | 750 hrs/month, sleeps after 15min | $7/mo for always-on |
| **Supabase** | 500MB storage, 2GB bandwidth | $25/mo for more storage |
| **Cloudflare R2** | 10GB storage, 10M reads | $0.015/GB after |

**Total: FREE** for small-medium usage

---

## 🔒 Security Checklist

- [ ] Never commit `.env` files
- [ ] Use strong JWT_SECRET (32+ random characters)
- [ ] Rotate R2 keys periodically
- [ ] Enable 2FA on all accounts (GitHub, Render, Vercel, Supabase, Cloudflare)
- [ ] Use Supabase Row Level Security (RLS) for sensitive data

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Cloudflare R2**: https://developers.cloudflare.com/r2

---

## 📝 Quick Reference: Environment Variables

### Render (Backend)
```
NODE_ENV=production
PORT=10000
JWT_SECRET=<random-32-char-string>
DATABASE_URL=postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-key>
R2_SECRET_ACCESS_KEY=<your-secret>
R2_BUCKET_NAME=sacma-images
R2_PUBLIC_URL=https://pub-<hash>.r2.dev
```

### Vercel (Frontend)
```
VITE_API_URL=https://<your-app>.onrender.com/api
```

### Local Development (.env.local)
```
VITE_API_URL=http://localhost:3001/api
```
