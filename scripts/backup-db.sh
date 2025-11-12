#!/bin/bash

# Database Backup Script
# Creates a backup of MongoDB Atlas database

set -e

echo "💾 Database Backup Script"
echo "========================="

# Load environment
if [ -f .env.production ]; then
    source .env.production
else
    echo "Error: .env.production not found"
    exit 1
fi

# Check if mongodump is available
if ! command -v mongodump &> /dev/null; then
    echo "Error: mongodump not found"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Creating backup..."
mongodump --uri="$MONGO_URL" --db="$DB_NAME" --out="$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully!"
    echo "Location: $BACKUP_DIR"
    
    # Compress backup
    tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
    rm -rf "$BACKUP_DIR"
    echo "Compressed backup: ${BACKUP_DIR}.tar.gz"
else
    echo "❌ Backup failed"
    exit 1
fi
