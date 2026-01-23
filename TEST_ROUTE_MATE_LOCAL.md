# Test Integrated Route Mate Locally

## Quick Test Steps:

### 1. Check Services are Running

```bash
# Check backend
ps aux | grep uvicorn

# Check frontend
ps aux | grep node

# Or use supervisor
sudo supervisorctl status
```

### 2. Access Admin Console

1. Open browser: `http://localhost:3000/auth`
2. Login with admin credentials
3. Should redirect to Admin Console

### 3. Navigate to Products

1. Click **"Products"** in sidebar
2. You should see **"Integrated Route Mate"** card
3. Card should show:
   - Status: **ACTIVE** (green badge)
   - Price: **$449/month**
   - Button: **"Launch Route Mate →"**

### 4. Launch Route Mate

1. Click **"Launch Route Mate →"** button
2. Should transition to Route Mate dashboard
3. Should see:
   - Sidebar with: Dashboard, Routes, Territories, Customers, Vehicles, Drivers, Analytics
   - Stats cards showing 0 initially
   - Quick actions panel
   - Getting started guide

### 5. Test Navigation

Click through each section:
- ✅ **Dashboard** - Overview with stats
- ✅ **Routes** - Route optimization interface
- ✅ **Territories** - Territory management
- ✅ **Customers** - Customer database
- ✅ **Vehicles** - Fleet management
- ✅ **Drivers** - Driver roster
- ✅ **Analytics** - Performance dashboard

### 6. Test Back Navigation

Click **"← Back to Admin"** button at bottom of sidebar
- Should return to Admin Console

---

## Troubleshooting

### Issue: "Launch Route Mate" button is disabled or shows "Coming Soon"

**Solution**: Backend needs to be restarted to pick up the status change

```bash
# Restart backend
cd /app/backend
pkill -f uvicorn
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Issue: Blank screen after clicking Launch

**Solution**: Check browser console (F12) for errors

```bash
# Common fix: Rebuild frontend
cd /app/frontend
npm start
```

### Issue: API errors in Route Mate

**Solution**: Check backend logs

```bash
tail -50 /app/backend/backend.log
```

### Issue: "Module not found" errors

**Solution**: Components might not be imported correctly

```bash
# Check files exist
ls -la /app/frontend/src/components/route-mate/

# Should show:
# RouteMateApp.js
# RouteMateRoutes.js
# RouteMateTerritories.js
# RouteMateCustomers.js
# RouteMateVehicles.js
# RouteMateDrivers.js
# RouteMateAnalytics.js
```

---

## Test Data Creation

### Add Test Vehicle

1. Go to Route Mate → **Vehicles**
2. Click **"Add Vehicle"**
3. Fill in:
   - Vehicle Number: `TRK-001`
   - Type: `Delivery Van`
   - Weight Capacity: `10000 lbs`
   - Volume: `500 cu ft`
   - Pallets: `20`
   - MPG: `12`
   - Cost/Mile: `$1.50`
4. Click **"Add Vehicle"**

### Add Test Driver

1. Go to Route Mate → **Drivers**
2. Click **"Add Driver"**
3. Fill in:
   - Employee Number: `DRV-001`
   - Full Name: `John Doe`
4. Click **"Add Driver"**

### Add Test Customer

1. Go to Route Mate → **Customers**
2. Click **"Add Customer"**
3. Fill in:
   - Name: `Acme Corporation`
   - Street: `123 Main St`
   - City: `New York`
   - State: `NY`
   - ZIP: `10001`
   - Visit Frequency: `Weekly`
   - Priority: `High`
4. Click **"Add Customer"**

### Create Territory

1. Go to Route Mate → **Territories**
2. Click **"Create Territory"**
3. Fill in:
   - Name: `North District`
   - Type: `Delivery`
   - Stops/Day Target: `100`
   - Max Distance: `200 mi`
   - Revenue Target: `$500,000`
4. Click **"Create Territory"**

---

## Expected API Endpoints

Test these directly:

```bash
# Get dashboard analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/analytics/dashboard

# List vehicles
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/vehicles

# List drivers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/drivers

# List customers
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/customers

# List territories
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/territories

# List routes
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/route-mate/routes
```

---

## Success Criteria

✅ All sections load without errors
✅ Can add vehicles, drivers, customers
✅ Can create territories
✅ Stats cards update with data
✅ Navigation works smoothly
✅ Back button returns to Admin Console

---

## Next Steps After Testing

1. **If everything works**: Ready to deploy to EC2
2. **If issues found**: Share console errors for debugging
3. **For production**: Add real customer data and test route optimization
