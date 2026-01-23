# GitHub Push Guide - Admin Console

## Overview
This guide explains how to push the Admin Console code from the Emergent workspace to your GitHub repository, then deploy to EC2.

---

## Option 1: Direct GitHub Push (If you have Git configured)

If your local GitHub repo is already set up:

```bash
# 1. Download or clone this Emergent workspace to your local machine
# (Files are located in /app directory)

# 2. On your local machine where you have GitHub access
cd /path/to/your/fleet-management-app

# 3. Create a new branch for this update
git checkout -b admin-console-deployment

# 4. Copy updated files from Emergent workspace
# (You'll need to download these files from Emergent and copy them over)

# Key files to update:
#   - frontend/src/App.js
#   - frontend/src/components/admin/* (entire directory)
#   - frontend/src/components/AuthPage.js  
#   - backend/routes/admin_routes.py
#   - backend/routes/__init__.py
#   - backend/server.py
#   - backend/models.py
#   - backend/auth.py

# 5. Stage all changes
git add .

# 6. Commit
git commit -m "Add Admin Console with Products page

Features:
- Admin dashboard with tenant/subscription analytics
- CRM for customer management (activate/deactivate)
- Products page with TMS launcher (opens in new window)
- Subscription manager
- Sales analytics
- Role-based access control for platform_admin
- Admin API endpoints for tenant and plan management"

# 7. Push to GitHub
git push origin admin-console-deployment

# 8. (Optional) Merge to main
git checkout main
git merge admin-console-deployment
git push origin main
```

---

## Option 2: Download & Upload Method

If direct git push is complex, use this simpler approach:

### Step A: Get Files from Emergent Workspace

You need to download these directories/files:

**Frontend:**
```
frontend/src/App.js
frontend/src/components/admin/
frontend/src/components/AuthPage.js
frontend/src/contexts/
```

**Backend:**
```
backend/server.py
backend/models.py
backend/auth.py
backend/database.py
backend/routes/
```

**Config:**
```
backend/requirements.txt
frontend/package.json
```

### Step B: Upload to GitHub

1. Go to your GitHub repository in a web browser
2. Navigate to each file location
3. Click "Upload files" or "Edit file"
4. Upload/paste the new content
5. Commit changes with message: "Add Admin Console"

### Step C: Pull on EC2

```bash
ssh -i TMS-Key.pem ubuntu@44.197.191.154
cd /home/ubuntu/fleet-management-app
git pull origin main
```

Then follow the deployment steps in `ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md`

---

## Option 3: Direct File Transfer to EC2 (Bypass GitHub)

If GitHub is unavailable, you can directly transfer files from your local machine to EC2:

### 1. Download files from Emergent workspace to your local machine

### 2. SCP files to EC2:

```bash
# Frontend files
scp -i TMS-Key.pem -r frontend/src/App.js ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/frontend/src/
scp -i TMS-Key.pem -r frontend/src/components/admin ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/frontend/src/components/
scp -i TMS-Key.pem -r frontend/src/components/AuthPage.js ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/frontend/src/components/

# Backend files  
scp -i TMS-Key.pem -r backend/routes/admin_routes.py ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/backend/routes/
scp -i TMS-Key.pem -r backend/server.py ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/backend/
scp -i TMS-Key.pem -r backend/models.py ubuntu@44.197.191.154:/home/ubuntu/fleet-management-app/backend/
```

### 3. Rebuild on EC2:

Follow steps in `ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md` starting from Step 2.4

---

## Quick File List for Transfer

### Critical Frontend Files:
```
/app/frontend/src/App.js
/app/frontend/src/components/AuthPage.js
/app/frontend/src/components/admin/AdminConsole.js
/app/frontend/src/components/admin/CRMView.js
/app/frontend/src/components/admin/SubscriptionManagerNew.js
/app/frontend/src/components/admin/SalesAnalyticsNew.js
/app/frontend/src/components/admin/crm/DashboardTab.js
/app/frontend/src/contexts/AuthContext.js
/app/frontend/src/contexts/FeaturesContext.js
```

### Critical Backend Files:
```
/app/backend/server.py
/app/backend/models.py
/app/backend/auth.py
/app/backend/database.py
/app/backend/routes/__init__.py
/app/backend/routes/admin_routes.py
/app/backend/routes/auth_routes.py
/app/backend/routes/company_routes.py
/app/backend/routes/crm_routes.py
/app/backend/routes/misc_routes.py
```

---

## Verify Before Pushing

Run these checks in the Emergent workspace:

```bash
cd /app

# 1. Ensure Admin Console component exists
test -f frontend/src/components/admin/AdminConsole.js && echo "✓ AdminConsole.js exists" || echo "✗ Missing"

# 2. Ensure admin routes exist
test -f backend/routes/admin_routes.py && echo "✓ admin_routes.py exists" || echo "✗ Missing"

# 3. Check App.js has admin route
grep -q "/admin" frontend/src/App.js && echo "✓ /admin route configured" || echo "✗ Route missing"

# 4. Check models have PLANS
grep -q "PLANS = " backend/models.py && echo "✓ PLANS defined" || echo "✗ PLANS missing"

# 5. Check auth has platform_admin check
grep -q "platform_admin" backend/auth.py && echo "✓ Admin auth configured" || echo "✗ Auth missing"
```

All should show ✓ before proceeding.

---

## After GitHub Push

Once code is in GitHub:

1. SSH to EC2: `ssh -i TMS-Key.pem ubuntu@44.197.191.154`
2. Pull changes: `cd fleet-management-app && git pull origin main`
3. Follow: `ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md` from Step 2.3 onwards

---

## Troubleshooting

### "Permission denied" on git push
- Ensure you're authenticated with GitHub (SSH key or token)
- Check: `git config --list | grep user`

### "Files too large"
- Git might reject large files
- Use `.gitignore` to exclude `node_modules/` and `venv/`

### "Merge conflict"
- If EC2 code differs: `git stash` → `git pull` → `git stash pop`
- Resolve conflicts manually

### "Branch not found"
- Ensure you're on the correct branch: `git branch`
- Switch if needed: `git checkout main`

---

## Need Help?

Check these files in the workspace:
- `ADMIN_CONSOLE_DEPLOYMENT_GUIDE.md` - Detailed deployment steps
- `DEPLOYMENT_CHECKLIST.md` - Verification checklist
- `GITHUB_PUSH_GUIDE.md` - This file

---

## Summary of Workflow

```
Emergent Workspace → Your Local Machine → GitHub → EC2 Server

1. Download files from /app
2. Push to GitHub (or transfer directly to EC2)
3. Pull on EC2 / Rebuild containers
4. Test admin console
```
