# Quick Start - AWS EC2 Deployment

## 🎯 Summary

Deploy Fleet Management System to AWS EC2 with Docker Compose in **~1 hour**.

## 💰 Cost

**~$35/month**
- EC2 t3.medium: $30/month
- Storage: $5/month
- MongoDB Atlas M0: FREE

## ⚡ Quick Deploy

### 1. MongoDB Atlas (10 min)
```bash
1. Go to mongodb.com/cloud/atlas
2. Create free M0 cluster in us-east-1
3. Create database user
4. Allow access from anywhere (0.0.0.0/0)
5. Copy connection string
```

### 2. Launch EC2 (5 min)
```bash
1. AWS Console → EC2 → Launch Instance
2. Ubuntu 22.04 LTS
3. t3.medium instance
4. Open ports: 22, 80, 443, 8001
5. Launch and connect via SSH
```

### 3. Setup & Deploy (15 min)
```bash
# On EC2
curl -O https://raw.githubusercontent.com/YOUR_REPO/scripts/setup-ec2.sh
chmod +x setup-ec2.sh && ./setup-ec2.sh

# Log out and back in
exit && ssh ubuntu@YOUR_EC2_IP

# Clone repo
git clone YOUR_REPO fleet-management-app
cd fleet-management-app

# Configure
cp .env.production.template .env.production
nano .env.production  # Fill in MongoDB URL, JWT secret, etc.

# Deploy
chmod +x scripts/*.sh
./scripts/deploy-ec2.sh
```

### 4. Access Application
```
Frontend: http://YOUR_EC2_IP
Backend: http://YOUR_EC2_IP:8001
Login: aminderpro@gmail.com / admin123
```

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.

## 🔄 CI/CD Setup

1. Add GitHub Secrets (see DEPLOYMENT.md)
2. Push to main branch
3. Auto-deploys! ✅

## 🆘 Quick Troubleshooting

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart
./scripts/deploy-ec2.sh

# Check status
docker ps
```
