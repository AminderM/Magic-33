# \ud83d\udccb YOUR ACTION ITEMS - Complete These While I Finish Up

## \u23f1\ufe0f Estimated Time: 30-45 minutes

---

## \u2705 Step 1: MongoDB Atlas Setup (15-20 min)

### Create MongoDB Atlas Account & Cluster

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up (or login if you have account)

2. **Create New Cluster**
   - Click "Build a Database"
   - Choose: **M0 FREE** tier (or M10 if you prefer)
   - **IMPORTANT:** Select region: **us-east-1** (Virginia)
   - Cluster Name: `fleet-marketplace-prod`
   - Click "Create"
   - \u23f3 Wait 5-10 minutes for cluster to provision

3. **Create Database User**
   - Go to: Security \u2192 Database Access
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `fleet_admin` (or your choice)
   - Password: Click "Autogenerate Secure Password" OR create your own
   - **\u26a0\ufe0f CRITICAL:** Copy and save this password securely!
   - User Privileges: Select "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to: Security \u2192 Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (adds 0.0.0.0/0)
   - Click "Confirm"
   - \u26a0\ufe0f Note: We'll restrict this to EC2 IP later for security

5. **Get Connection String**
   - Go to: Database \u2192 Clusters
   - Click "Connect" button on your cluster
   - Click "Connect your application"
   - Driver: Python, Version: 3.6 or later
   - Copy the connection string (looks like):
   ```
   mongodb+srv://fleet_admin:<password>@cluster.mongodb.net/
   ```
   - **Replace `<password>` with your actual password**
   - **Save this complete connection string!**

**\u2705 Checklist:**
- [ ] Cluster created and running
- [ ] Database user created
- [ ] Password saved securely
- [ ] Network access configured
- [ ] Connection string saved

---

## \u2705 Step 2: AWS Account Setup (10-15 min)

### Create IAM User for Deployment

1. **Login to AWS Console**
   - Go to: https://console.aws.amazon.com/

2. **Create IAM User**
   - Services \u2192 IAM \u2192 Users \u2192 "Create user"
   - User name: `fleet-management-deployer`
   - AWS access type: Programmatic access
   - Click "Next"

3. **Set Permissions**
   - Click "Attach policies directly"
   - Search and select these policies:
     - `AmazonEC2FullAccess`
     - `AmazonECS_FullAccess`
     - (Or use `AdministratorAccess` for simplicity)
   - Click "Next" and "Create user"

4. **Save Credentials**
   - \u26a0\ufe0f **CRITICAL:** Download or copy these credentials:
   - **AWS Access Key ID**: AKIA...
   - **AWS Secret Access Key**: (shown only once!)
   - **Save these securely - you'll need them!**

**\u2705 Checklist:**
- [ ] IAM user created
- [ ] Access Key ID saved
- [ ] Secret Access Key saved

---

## \u2705 Step 3: Generate JWT Secret (2 min)

Run this command on your local machine or use online generator:

```bash
# On Mac/Linux
openssl rand -base64 32

# Or use online: https://generate-secret.vercel.app/32
```

**Copy and save the generated secret!**

**\u2705 Checklist:**
- [ ] JWT secret generated and saved

---

## \u2705 Step 4: Prepare GitHub Repository (5 min)

### Check Repository Access

1. **Verify Code is in GitHub**
   - Go to your repository
   - Make sure latest code is pushed

2. **Prepare GitHub Secrets** (Don't add yet - I'll tell you when)
   - Go to: Repository \u2192 Settings \u2192 Secrets and variables \u2192 Actions
   - Click "New repository secret"
   - **We'll add these after EC2 is ready**

**Secrets you'll need to add:**
```
AWS_ACCESS_KEY_ID = (from Step 2)
AWS_SECRET_ACCESS_KEY = (from Step 2)
AWS_REGION = us-east-1
MONGO_URL = (from Step 1)
DB_NAME = fleet_marketplace
JWT_SECRET = (from Step 3)
```

**\u2705 Checklist:**
- [ ] Repository accessible
- [ ] Ready to add secrets (after EC2 setup)

---

## \u2705 Step 5: Domain Name (Optional - Can Do Later)

If you want a custom domain:

1. **Option A: Buy domain on AWS Route 53**
   - Services \u2192 Route 53 \u2192 Register Domain
   - Search for available domain
   - Cost: ~$12/year for .com

2. **Option B: Use existing domain**
   - Just have the domain ready
   - We'll configure DNS later

3. **Option C: Skip for now**
   - Use EC2 IP address initially
   - Add domain later

**\u2705 Checklist:**
- [ ] Domain decided (or using IP for now)

---

## \ud83d\udcdd Information Summary Sheet

**Fill this out as you complete steps above:**

```
=== MONGODB ATLAS ===
Connection String: mongodb+srv://fleet_admin:___________@cluster.mongodb.net/
Database Name: fleet_marketplace

=== AWS CREDENTIALS ===
Access Key ID: AKIA________________
Secret Access Key: ____________________________
Region: us-east-1

=== JWT SECRET ===
JWT Secret: _________________________________

=== GITHUB ===
Repository URL: https://github.com/___________/___________

=== DOMAIN (optional) ===
Domain: ___________________ (or "Using EC2 IP for now")

=== EC2 (will get after launch) ===
EC2 Public IP: ___.___.___.___
EC2 SSH Key: ____________.pem
```

---

## \u26a1 Quick Reference - What Each Thing Does

| Item | Why We Need It | Where It's Used |
|------|----------------|-----------------|
| **MongoDB Atlas** | Cloud database to store all data | Backend connects to this |
| **AWS IAM Credentials** | Deploy and manage EC2 instance | GitHub Actions uses this |
| **JWT Secret** | Secure user authentication tokens | Backend security |
| **EC2 Instance** | Server to run your application | Hosts frontend + backend |
| **Domain** | Professional URL (optional) | Instead of IP address |

---

## \u2753 Questions? Common Issues:

**Q: MongoDB cluster taking forever?**
- Usually takes 5-10 min. Refresh the page. Get coffee \u2615

**Q: Can't find IAM in AWS?**
- Use search bar at top: type "IAM"

**Q: What if I mess up?**
- Everything can be deleted and recreated
- No permanent damage possible

**Q: Cost concerns?**
- MongoDB M0: FREE forever
- AWS: ~$35/month, can stop instance when not using

---

## \u2705 Final Checklist

Before you say "I'm done":

- [ ] MongoDB Atlas cluster is **RUNNING** (not provisioning)
- [ ] Database user created and password **SAVED**
- [ ] Connection string **SAVED** with password filled in
- [ ] AWS IAM user created
- [ ] AWS Access Key ID and Secret **SAVED**
- [ ] JWT secret generated and **SAVED**
- [ ] GitHub repository accessible
- [ ] All info filled in the summary sheet above

---

## \ud83d\ude80 What Happens Next?

Once you complete these steps:

1. **Tell me you're done**
2. **I'll help you launch the EC2 instance** (5 min)
3. **We'll deploy together** (10 min)
4. **Your app will be LIVE!** \ud83c\udf89

---

## \ud83d\udcde Need Help?

Just ask! Common questions:
- "How do I get to IAM?" \u2192 AWS Console \u2192 Search "IAM"
- "Where's the connection string?" \u2192 MongoDB Atlas \u2192 Connect button
- "Lost my password" \u2192 Can create new database user anytime

**Take your time, and let me know when you're ready!** \ud83d\ude80
