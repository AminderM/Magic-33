#!/bin/bash

# Database Migration Script
# Exports data from local MongoDB and imports to MongoDB Atlas

set -e

echo "📦 Database Migration Script"
echo "============================="

# Check if mongodump and mongorestore are available
if ! command -v mongodump &> /dev/null; then
    echo "Error: mongodump not found. Please install MongoDB Database Tools"
    echo "Visit: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Source database (local)
SOURCE_DB="mongodb://localhost:27017"
SOURCE_DB_NAME="fleet_marketplace"

# Prompt for target database
echo ""
echo "Enter your MongoDB Atlas connection string:"
echo "(Format: mongodb+srv://username:password@cluster.mongodb.net/)"
read -r TARGET_DB

if [ -z "$TARGET_DB" ]; then
    echo "Error: MongoDB Atlas connection string is required"
    exit 1
fi

TARGET_DB_NAME="fleet_marketplace"

# Create backup directory
BACKUP_DIR="./db_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "Step 1: Exporting data from local MongoDB..."
mongodump --uri="$SOURCE_DB/$SOURCE_DB_NAME" --out="$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✓ Export successful"
else
    echo "✗ Export failed"
    exit 1
fi

echo ""
echo "Step 2: Importing data to MongoDB Atlas..."
mongorestore --uri="$TARGET_DB" --nsInclude="$SOURCE_DB_NAME.*" "$BACKUP_DIR"

if [ $? -eq 0 ]; then
    echo "✓ Import successful"
    echo ""
    echo "✅ Database migration complete!"
    echo "Backup saved in: $BACKUP_DIR"
else
    echo "✗ Import failed"
    exit 1
fi
