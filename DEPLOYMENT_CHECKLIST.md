# Admin Console - Deployment Checklist

## Critical Files for EC2 Deployment

### Frontend Files (Must be updated on EC2)
```
frontend/src/App.js                                  ✓ Has /admin route
frontend/src/components/admin/AdminConsole.js        ✓ Main admin interface
frontend/src/components/admin/CRMView.js             ✓ Customer management
frontend/src/components/admin/SubscriptionManagerNew.js  ✓ Subscription management
frontend/src/components/admin/SalesAnalyticsNew.js   ✓ Analytics dashboard
frontend/src/components/admin/crm/DashboardTab.js    ✓ CRM dashboard tab
frontend/src/components/AuthPage.js                  ✓ Has redirect logic
```

### Backend Files (Must be updated on EC2)
```
backend/routes/admin_routes.py    ✓ Admin API endpoints
backend/routes/__init__.py         ✓ Routes initialization
backend/server.py                  ✓ Includes admin routes
backend/models.py                  ✓ Has PLANS data
backend/auth.py                    ✓ Has platform_admin check
backend/database.py                ✓ Database connection
```

### Configuration Files
```
backend/.env                       ✓ Environment variables
backend/requirements.txt           ✓ Python dependencies
frontend/package.json              ✓ Node dependencies
frontend/Dockerfile                ✓ Frontend build config
```

---

## Pre-Deployment Verification (Local)

Run these commands in your Emergent workspace to verify everything is ready:

```bash
cd /app

# 1. Check Admin Console exists
ls -la frontend/src/components/admin/AdminConsole.js

# 2. Check Admin routes exist
ls -la backend/routes/admin_routes.py

# 3. Verify App.js has /admin route
grep "/admin" frontend/src/App.js

# 4. Check models have PLANS
grep "PLANS = " backend/models.py

# 5. Test local admin console (should work)
curl http://localhost:3000/admin
```

---

## Post-Deployment Verification (EC2)

After deploying, run these commands on EC2 to verify:

```bash
# 1. Verify files exist
ls -la /home/ubuntu/fleet-management-app/frontend/src/components/admin/AdminConsole.js
ls -la /home/ubuntu/fleet-management-app/backend/routes/admin_routes.py

# 2. Check frontend container is running
sudo docker ps | grep tms-frontend

# 3. Check backend is running
ps aux | grep "python.*server.py"

# 4. Test admin API endpoint
curl http://localhost:8001/api/admin/plans

# 5. Check frontend serves admin route
curl -I http://localhost/admin

# 6. Verify backend logs for errors
tail -50 /home/ubuntu/fleet-management-app/backend/backend.log
```

---

## Quick Deployment Commands Summary

```bash
# === ON EC2 SERVER ===

# 1. Backup
cd /home/ubuntu
cp -r fleet-management-app fleet-management-app-backup-$(date +%Y%m%d-%H%M%S)

# 2. Pull latest code
cd fleet-management-app
git pull origin main

# 3. Rebuild frontend
sudo docker stop tms-frontend && sudo docker rm tms-frontend
sudo docker build --build-arg REACT_APP_BACKEND_URL=http://44.197.191.154:8001 -t tms-frontend -f frontend/Dockerfile frontend/
sudo docker run -d --name tms-frontend -p 80:80 tms-frontend

# 4. Restart backend
pkill -f "python.*server.py"
cd backend && source venv/bin/activate
nohup python server.py > backend.log 2>&1 &
deactivate

# 5. Verify
curl http://localhost:8001/api/admin/plans
sudo docker ps | grep tms-frontend
```

---

## Testing Checklist

After deployment, test these scenarios:

### Test 1: Admin Login & Redirect
- [ ] Go to `http://44.197.191.154/auth`
- [ ] Login with `aminderpro@gmail.com` / `admin123`
- [ ] Should redirect to `http://44.197.191.154/admin`
- [ ] Should see "Admin Console" interface, NOT TMS dashboard

### Test 2: Admin Dashboard
- [ ] Dashboard shows "Total Tenants" count
- [ ] Dashboard shows "Active Subscriptions" count
- [ ] Dashboard shows "Monthly Revenue"
- [ ] Dashboard shows "Available Plans"
- [ ] Recent Tenants list visible

### Test 3: Navigation
- [ ] Click "Subscription Manager" - loads subscription view
- [ ] Click "Sales Analytics" - loads analytics view
- [ ] Click "Products" - loads products page
- [ ] Click "CRM" - loads CRM view
- [ ] Click "Home" - returns to dashboard

### Test 4: Products Page - TMS Launch
- [ ] Navigate to "Products"
- [ ] See "Transportation Management System" card
- [ ] Card shows "ACTIVE" badge
- [ ] Click "Launch TMS →" button
- [ ] TMS opens in NEW browser tab
- [ ] TMS shows regular dashboard (Equipment, Bookings, etc.)

### Test 5: Regular User (Non-Admin)
- [ ] Logout from admin account
- [ ] Login with a tenant user (if exists)
- [ ] Should go to `/dashboard` (TMS), NOT `/admin`
- [ ] Should see regular TMS interface

### Test 6: API Endpoints
```bash
# Test admin endpoints (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://44.197.191.154:8001/api/admin/tenants
curl -H "Authorization: Bearer YOUR_TOKEN" http://44.197.191.154:8001/api/admin/plans
```

---

## Rollback Plan (If Something Goes Wrong)

If deployment fails:

```bash
# 1. Stop new services
sudo docker stop tms-frontend && sudo docker rm tms-frontend
pkill -f "python.*server.py"

# 2. Restore backup
cd /home/ubuntu
rm -rf fleet-management-app
mv fleet-management-app-backup-YYYYMMDD-HHMMSS fleet-management-app

# 3. Start old services
cd fleet-management-app
sudo docker run -d --name tms-frontend -p 80:80 tms-frontend
cd backend && source venv/bin/activate
nohup python server.py > backend.log 2>&1 &
```

---

## Success Criteria

✅ Admin can login and access `/admin` route
✅ Dashboard shows correct tenant/subscription counts
✅ Products page displays TMS with "Launch TMS →" button
✅ Clicking "Launch TMS →" opens TMS in new tab
✅ Regular tenant users still access `/dashboard` normally
✅ All admin APIs return 200 OK
✅ No errors in backend logs
✅ Frontend loads without console errors

---

## Support

If you encounter issues:
1. Check backend logs: `tail -f /home/ubuntu/fleet-management-app/backend/backend.log`
2. Check frontend console in browser (F12 → Console tab)
3. Verify services are running: `sudo docker ps` and `ps aux | grep python`
