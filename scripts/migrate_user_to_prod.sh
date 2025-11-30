#!/bin/bash

# User Data Migration Script - Migrate user data from dev to production
# 
# Usage:
#   ./scripts/migrate_user_to_prod.sh                           # Show help
#   ./scripts/migrate_user_to_prod.sh --dry-run                 # Preview export
#   ./scripts/migrate_user_to_prod.sh --export                  # Export to JSON
#   ./scripts/migrate_user_to_prod.sh --import /path/to/prod.db # Import to production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/server"

cd "$SERVER_DIR"

echo "========================================"
echo "  User Data Migration Script"
echo "  Source: admin@admin.com"
echo "========================================"
echo ""

if [ "$1" == "--dry-run" ]; then
    echo "🔍 DRY RUN MODE - Preview what would be exported"
    echo ""
    npx tsx scripts/migrate-user-to-production.ts --dry-run

elif [ "$1" == "--export" ]; then
    echo "📤 EXPORT MODE - Exporting user data to JSON"
    echo ""
    npx tsx scripts/migrate-user-to-production.ts --export
    echo ""
    echo "Next step: Copy the export file and run --import on production"

elif [ "$1" == "--import" ]; then
    if [ -z "$2" ] || [ -z "$3" ]; then
        echo "❌ Error: Production database and uploads paths required"
        echo "Usage: $0 --import /path/to/prod.db /path/to/uploads"
        exit 1
    fi
    
    PROD_DB="$2"
    PROD_UPLOADS="$3"
    
    if [ ! -f "$PROD_DB" ]; then
        echo "❌ Error: Production database not found: $PROD_DB"
        exit 1
    fi
    
    if [ ! -d "$PROD_UPLOADS" ]; then
        echo "❌ Error: Production uploads directory not found: $PROD_UPLOADS"
        exit 1
    fi
    
    echo "📥 IMPORT MODE - Importing to production"
    echo "Production DB: $PROD_DB"
    echo "Production uploads: $PROD_UPLOADS"
    echo ""
    read -p "⚠️  This will add data to production. Continue? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi
    echo ""
    npx tsx scripts/migrate-user-to-production.ts --import --prod-db="$PROD_DB" --prod-uploads="$PROD_UPLOADS"

else
    echo "Usage:"
    echo "  $0 --dry-run                                  Preview what would be exported"
    echo "  $0 --export                                   Export user data + photos"
    echo "  $0 --import /path/to/prod.db /path/to/uploads Import to production"
    echo ""
    echo "Workflow:"
    echo "  1. Run --dry-run to preview"
    echo "  2. Run --export to create JSON export and copy photos"
    echo "  3. Copy server/data/user-export.json and server/data/user-export-photos/ to production"
    echo "  4. Run --import with production database and uploads paths"
    echo ""
    echo "Note: The target user (admin@admin.com) must exist in production."
    echo "      Equipment IDs, brew IDs, and photo paths will be handled automatically."
fi

echo ""
echo "Done!"
