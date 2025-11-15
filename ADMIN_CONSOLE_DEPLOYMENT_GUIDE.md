# Admin Console Deployment Guide

## Overview
This guide will help you deploy the complete Admin Console to your EC2 server.

## What's Included in This Update:
✅ **Admin Console Frontend**
- Dashboard with analytics (Tenants, Subscriptions, Revenue, Plans)
- CRM for managing customers (activate/deactivate)
- Products Page with TMS launcher (opens in new window)
- Subscription Manager
- Sales Analytics

✅ **Backend Admin APIs**
- `/api/admin/tenants` - List and manage tenants
- `/api/admin/plans` - List subscription plans
- `/api/admin/analytics` - Get analytics data
- Role-based access control for platform_admin

✅ **Routing & Authentication**
- `/admin/*` routes protected for platform_admin only
- Automatic redirect after login based on role

---

## Step 1: Push Code to GitHub

On your **local machine** (where you have GitHub access):

```bash
# Navigate to your local repo
cd /path/to/fleet-management-app

# Pull latest changes from Emergent workspace
# (You'll need to add this workspace as a remote or download the files)

# Add all changes
git add .

# Commit
git commit -m "Add complete Admin Console with Products page"

# Push to GitHub
git push origin main
```

---

## Step 2: Deploy to EC2 Server

SSH into your EC2 instance:

```bash
ssh -i TMS-Key.pem ubuntu@44.197.191.154
```

### 2.1: Backup Current Code (Safety First!)

```bash
cd /home/ubuntu
cp -r fleet-management-app fleet-management-app-backup-$(date +%Y%m%d-%H%M%S)
```

### 2.2: Pull Latest Code

```bash
cd /home/ubuntu/fleet-management-app
git pull origin main
```

### 2.3: Update Backend Dependencies (if needed)

```bash
cd /home/ubuntu/fleet-management-app/backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
```

### 2.4: Rebuild Frontend Docker Container

```bash
cd /home/ubuntu/fleet-management-app

# Stop and remove old container
sudo docker stop tms-frontend
sudo docker rm tms-frontend

# Rebuild with correct backend URL
sudo docker build \
  --build-arg REACT_APP_BACKEND_URL=http://44.197.191.154:8001 \
  -t tms-frontend \
  -f frontend/Dockerfile \
  frontend/

# Run new container
sudo docker run -d \
  --name tms-frontend \
  -p 80:80 \
  tms-frontend
```

### 2.5: Restart Backend Service

```bash
# Find the backend process
ps aux | grep "python.*server.py"

# Kill the old process (replace <PID> with actual process ID)
kill <PID>

# Start backend with new code
cd /home/ubuntu/fleet-management-app/backend
source venv/bin/activate
nohup python server.py > backend.log 2>&1 &
deactivate
```

---

## Step 3: Verify Deployment

### 3.1: Check Services are Running

```bash
# Check frontend container
sudo docker ps | grep tms-frontend

# Check backend process
ps aux | grep "python.*server.py"

# Check backend logs
tail -f /home/ubuntu/fleet-management-app/backend/backend.log
```

### 3.2: Test Admin Console

1. Open browser: `http://44.197.191.154/auth`
2. Login with admin credentials:
   - Email: `aminderpro@gmail.com`
   - Password: `admin123`
3. You should be redirected to: `http://44.197.191.154/admin`
4. Verify you see:
   - Dashboard with tenant statistics
   - Sidebar navigation (Home, Subscription Manager, Sales Analytics, Products, CRM)

### 3.3: Test Products Page

1. Click **"Products"** in the sidebar
2. You should see **"Transportation Management System"** card
3. Click **"Launch TMS →"** button
4. TMS Dashboard should open in a **new browser tab**

---

## Troubleshooting

### Issue: 404 on /admin route
**Solution**: Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: Backend API errors
**Solution**: 
```bash
# Check backend logs
tail -50 /home/ubuntu/fleet-management-app/backend/backend.log

# Verify backend is running on port 8001
curl http://localhost:8001/api/admin/plans
```

### Issue: Frontend shows old version
**Solution**:
```bash
# Force rebuild without cache
sudo docker build --no-cache \
  --build-arg REACT_APP_BACKEND_URL=http://44.197.191.154:8001 \
  -t tms-frontend \
  -f frontend/Dockerfile \
  frontend/

# Remove old container and run new one
sudo docker stop tms-frontend && sudo docker rm tms-frontend
sudo docker run -d --name tms-frontend -p 80:80 tms-frontend
```

### Issue: Products page not showing TMS
**Solution**: Check that plans exist in MongoDB:
```bash
# On EC2 server
cd /home/ubuntu/fleet-management-app/backend
source venv/bin/activate
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models import PLANS

async def check():
    print('Available Plans:')
    for plan in PLANS:
        print(f'  - {plan[\"label\"]} ({plan[\"tier\"]}): ${plan[\"price\"]}/mo - Status: {plan[\"status\"]}')

asyncio.run(check())
"
```

---

## Next Steps

After successful deployment:

1. ✅ Admin Console is live at `http://44.197.191.154/admin`
2. ✅ TMS Dashboard is accessible from Products page
3. 🔄 Consider containerizing the backend (move from nohup to Docker)
4. 🔄 Set up proper CI/CD pipeline
5. 🔄 Configure HTTPS with SSL certificate
6. 🔄 Set up custom domain

---

## Important Notes

- **Admin Access**: Only users with `role: "platform_admin"` or email `aminderpro@gmail.com` can access `/admin` routes
- **Products Page**: Opens TMS in new window - existing TMS users won't be affected
- **Data**: Existing tenants, subscriptions, and user data remain unchanged
- **Backward Compatible**: Regular tenant users still access TMS via `/dashboard` as before

---

## File Transfer Alternative (If GitHub Push Fails)

If you can't push to GitHub, you can transfer files directly:

1. **Download files from this workspace** to your local machine
2. **SCP files to EC2**:

```bash
# From your local machine
scp -i TMS-Key.pem -r /path/to/downloaded/files/* ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/
```

Then follow Step 2.4 onwards.
