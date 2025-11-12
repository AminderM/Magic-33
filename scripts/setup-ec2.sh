#!/bin/bash

# EC2 Initial Setup Script
# Run this script on a fresh EC2 instance to install all dependencies

set -e

echo "🔧 Setting up EC2 instance for Fleet Management System"
echo "======================================================"

# Update system
echo "Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Install other useful tools
echo "Installing additional tools..."
sudo apt-get install -y htop curl wget unzip

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8001/tcp  # Backend API
sudo ufw --force enable

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Log out and log back in for Docker group changes to take effect"
echo "2. Clone your repository"
echo "3. Copy .env.production.template to .env.production and fill in values"
echo "4. Run: ./scripts/deploy-ec2.sh"
echo ""
