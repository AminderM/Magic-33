# 🚀 AWS EC2 Deployment Guide

## Fleet Management System - Production Deployment

This guide will help you deploy the Fleet Management System to AWS EC2 using Docker Compose.

---

## 📋 Prerequisites

- ✅ AWS Account with EC2 access
- ✅ MongoDB Atlas account and cluster
- ✅ GitHub repository
- ✅ Domain name (optional)
- ✅ Basic knowledge of SSH and command line

---

## 🏗️ Architecture Overview

```
AWS EC2 Instance (t3.medium)
├── Docker Compose
│   ├── Frontend Container (React + Nginx)
│   └── Backend Container (FastAPI)
└── MongoDB Atlas (Cloud Database)
```

---

## 📝 Step-by-Step Deployment

### Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free M0 cluster or paid M10 cluster
   - Choose region: `us-east-1` (same as EC2)
   - Cluster name: `fleet-marketplace-prod`

2. **Create Database User**
   - Go to Database Access → Add New User
   - Username: `fleet_admin` (or your choice)
   - Password: Generate a strong password
   - Save credentials securely!

3. **Configure Network Access**
   - Go to Network Access → Add IP Address
   - Add: `0.0.0.0/0` (Allow from anywhere)
   - Later, restrict to your EC2 instance IP

4. **Get Connection String**
   - Go to Clusters → Connect → Connect your application
   - Copy connection string:
   ```
   mongodb+srv://fleet_admin:PASSWORD@cluster.mongodb.net/
   ```

### Step 2: Launch EC2 Instance

1. **Launch Instance**
   - Go to AWS EC2 Console
   - Click "Launch Instance"
   - Name: `fleet-management-prod`
   - AMI: **Ubuntu Server 22.04 LTS**
   - Instance type: **t3.medium** (2 vCPU, 4GB RAM)
   - Key pair: Create new or use existing
   - Storage: 30 GB gp3

2. **Configure Security Group**
   - Create new security group with these rules:
   ```
   SSH      | TCP | 22   | Your IP
   HTTP     | TCP | 80   | 0.0.0.0/0
   HTTPS    | TCP | 443  | 0.0.0.0/0
   Custom   | TCP | 8001 | 0.0.0.0/0 (Backend API)
   ```

3. **Launch and Connect**
   - Click "Launch Instance"
   - Wait for instance to be "Running"
   - Note down the **Public IPv4 address**
   - Connect via SSH:
   ```bash
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   ```

### Step 3: Set Up EC2 Instance

1. **Run Setup Script**
   ```bash
   # On EC2 instance
   curl -O https://raw.githubusercontent.com/YOUR_REPO/main/scripts/setup-ec2.sh
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

2. **Log out and log back in** (for Docker group to take effect)
   ```bash
   exit
   ssh -i your-key.pem ubuntu@YOUR_EC2_IP
   ```

3. **Clone Repository**
   ```bash
   cd ~
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git fleet-management-app
   cd fleet-management-app
   ```

### Step 4: Configure Environment

1. **Create Production Environment File**
   ```bash
   cp .env.production.template .env.production
   nano .env.production
   ```

2. **Fill in Your Values**
   ```bash
   MONGO_URL=mongodb+srv://fleet_admin:YOUR_PASSWORD@cluster.mongodb.net/
   DB_NAME=fleet_marketplace
   JWT_SECRET=YOUR_STRONG_RANDOM_SECRET_HERE
   CORS_ORIGINS=http://YOUR_EC2_IP,https://yourdomain.com
   REACT_APP_BACKEND_URL=http://YOUR_EC2_IP:8001
   ```

   **Generate strong JWT secret:**
   ```bash
   openssl rand -base64 32
   ```

### Step 5: Migrate Database

1. **Export Local Data** (Run on your local machine)
   ```bash
   ./scripts/migrate-db.sh
   ```
   - Enter your MongoDB Atlas connection string when prompted
   - This will export local data and import to Atlas

### Step 6: Deploy Application

1. **Make Scripts Executable**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Deploy**
   ```bash
   ./scripts/deploy-ec2.sh
   ```

3. **Wait for Deployment**
   - Script will build Docker images
   - Start containers
   - Show deployment status

4. **Verify Deployment**
   - Frontend: `http://YOUR_EC2_IP`
   - Backend: `http://YOUR_EC2_IP:8001/api/health`
   - Login with: `aminderpro@gmail.com` / `admin123`

---

## 🔄 Set Up CI/CD (GitHub Actions)

### Step 1: Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
EC2_SSH_KEY=<paste your private key>
EC2_HOST=YOUR_EC2_IP
EC2_USER=ubuntu
MONGO_URL=mongodb+srv://...
DB_NAME=fleet_marketplace
JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://YOUR_EC2_IP
REACT_APP_BACKEND_URL=http://YOUR_EC2_IP:8001
```

### Step 2: Enable GitHub Actions

- The workflow file is already in `.github/workflows/deploy.yml`
- Push to `main` or `master` branch to trigger deployment
- Or manually trigger from Actions tab

---

## 🔧 Useful Commands

### View Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### Restart Services
```bash
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose.prod.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker-compose.prod.yml down
```

### Update Application
```bash
cd ~/fleet-management-app
git pull
./scripts/deploy-ec2.sh
```

### Backup Database
```bash
./scripts/backup-db.sh
```

### Check Container Status
```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

---

## 🔒 Security Hardening

### 1. Update MongoDB Network Access
- Go to MongoDB Atlas → Network Access
- Remove `0.0.0.0/0`
- Add only your EC2 instance IP

### 2. Restrict EC2 Security Group
- Update SSH rule to only your IP
- Consider using AWS Systems Manager instead of SSH

### 3. Enable HTTPS
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### 4. Set Up Automated Backups
```bash
# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * cd ~/fleet-management-app && ./scripts/backup-db.sh
```

---

## 📊 Monitoring

### CloudWatch Agent (Optional)
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

### Check System Resources
```bash
htop              # CPU and Memory
df -h             # Disk space
docker stats      # Container resources
```

---

## 🐛 Troubleshooting

### Issue: Containers not starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check environment file
cat .env.production

# Rebuild images
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Issue: Can't connect to MongoDB
```bash
# Test connection
mongo "mongodb+srv://cluster.mongodb.net/" --username YOUR_USER

# Check network access in Atlas
```

### Issue: Frontend can't reach backend
- Check REACT_APP_BACKEND_URL in .env.production
- Check CORS_ORIGINS includes your frontend URL
- Verify security group allows port 8001

### Issue: Out of disk space
```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a
```

---

## 💰 Cost Optimization

1. **Use Spot Instances** - Save up to 70%
2. **Schedule shutdown** - Stop instance during off-hours
3. **Right-size instance** - Monitor and adjust if needed
4. **Use MongoDB Atlas M0** - Free tier for development

---

## 📈 Scaling

When you need to scale:

1. **Vertical Scaling** - Upgrade to larger instance (t3.large, t3.xlarge)
2. **Horizontal Scaling** - Add load balancer + multiple instances
3. **Database Scaling** - Upgrade MongoDB Atlas tier
4. **Use ECS** - Migrate to containerized orchestration

---

## 📞 Support

For issues:
1. Check logs first
2. Review troubleshooting section
3. Check GitHub Issues
4. Contact support team

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] EC2 instance launched
- [ ] Security group configured
- [ ] Connected to EC2 via SSH
- [ ] Ran setup-ec2.sh
- [ ] Cloned repository
- [ ] Created .env.production
- [ ] Migrated database
- [ ] Deployed application
- [ ] Verified frontend and backend
- [ ] Set up GitHub Actions
- [ ] Configured backups
- [ ] Applied security hardening

---

**🎉 Congratulations! Your Fleet Management System is now live on AWS!**
