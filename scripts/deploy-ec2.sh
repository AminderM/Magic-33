#!/bin/bash

# EC2 Deployment Script for Fleet Management System
# This script automates deployment to AWS EC2

set -e

echo "🚀 Fleet Management System - EC2 Deployment"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found!${NC}"
    echo "Please copy .env.production.template to .env.production and fill in your values"
    exit 1
fi

echo -e "${GREEN}✓ Environment file found${NC}"

# Load environment variables
source .env.production

# Check if required variables are set
if [ -z "$MONGO_URL" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}Error: Required environment variables not set${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment variables loaded${NC}"

# Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "Pulling latest code..."
    git pull origin main || git pull origin master
    echo -e "${GREEN}✓ Code updated${NC}"
fi

# Build and start containers
echo "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 10

# Check if containers are running
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo ""
    echo "Services Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo -e "${GREEN}🎉 Your application is now running!${NC}"
    echo "Frontend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
    echo "Backend: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8001"
else
    echo -e "${RED}✗ Deployment failed!${NC}"
    echo "Checking logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
fi
