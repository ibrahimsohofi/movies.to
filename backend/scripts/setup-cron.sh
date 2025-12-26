#!/bin/bash

##
# Setup Automated Database Backups
#
# This script sets up a cron job to run database backups automatically
##

echo "========================================="
echo "🎬 Movies.to - Setup Automated Backups"
echo "========================================="
echo ""

# Get the absolute path to the backup script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.js"
NODE_BIN=$(which node)

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Check if node is installed
if [ -z "$NODE_BIN" ]; then
    echo "❌ Error: Node.js not found. Please install Node.js first."
    exit 1
fi

echo "📍 Backup script: $BACKUP_SCRIPT"
echo "📍 Node binary: $NODE_BIN"
echo ""

# Prompt for backup frequency
echo "Select backup frequency:"
echo "1) Daily at 2 AM"
echo "2) Daily at 12 AM (midnight)"
echo "3) Every 12 hours"
echo "4) Every 6 hours"
echo "5) Weekly (Sunday at 2 AM)"
echo "6) Custom"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2 AM"
        ;;
    2)
        CRON_SCHEDULE="0 0 * * *"
        DESCRIPTION="Daily at midnight"
        ;;
    3)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="Every 12 hours"
        ;;
    4)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="Every 6 hours"
        ;;
    5)
        CRON_SCHEDULE="0 2 * * 0"
        DESCRIPTION="Weekly on Sunday at 2 AM"
        ;;
    6)
        echo ""
        echo "Enter custom cron schedule (e.g., '0 2 * * *' for daily at 2 AM):"
        echo "Format: minute hour day month weekday"
        read -p "> " CRON_SCHEDULE
        DESCRIPTION="Custom: $CRON_SCHEDULE"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Create log directory
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup.log"

# Build cron command
CRON_COMMAND="$CRON_SCHEDULE cd $SCRIPT_DIR/.. && $NODE_BIN $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

echo ""
echo "📋 Backup Configuration:"
echo "   Schedule: $DESCRIPTION"
echo "   Cron: $CRON_SCHEDULE"
echo "   Script: $BACKUP_SCRIPT"
echo "   Log: $LOG_FILE"
echo ""

read -p "Install this cron job? [y/N]: " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
        echo "⚠️  Existing backup cron job found. Removing..."
        crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT" | crontab -
    fi

    # Add new cron job
    (crontab -l 2>/dev/null; echo "# Movies.to Database Backup - $DESCRIPTION"; echo "$CRON_COMMAND") | crontab -

    echo ""
    echo "✅ Cron job installed successfully!"
    echo ""
    echo "📋 Current crontab:"
    crontab -l
    echo ""
    echo "💡 Tips:"
    echo "   - View logs: tail -f $LOG_FILE"
    echo "   - Edit crontab: crontab -e"
    echo "   - Remove crontab: crontab -r"
    echo "   - Test backup: node $BACKUP_SCRIPT"
    echo ""

    # Test run (optional)
    read -p "Run a test backup now? [y/N]: " test_run
    if [[ $test_run =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 Running test backup..."
        cd "$SCRIPT_DIR/.."
        $NODE_BIN $BACKUP_SCRIPT
    fi
else
    echo "❌ Installation cancelled"
    exit 0
fi

echo ""
echo "========================================="
echo "✅ Setup Complete!"
echo "========================================="
