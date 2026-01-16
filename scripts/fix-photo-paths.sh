#!/bin/bash

# Script to fix photo paths in database if they're incorrect

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DB_PATH="$PROJECT_ROOT/server/data/coffee-timer.db"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

echo "=== Checking Photo Paths in Database ==="
echo ""

# Check current paths
echo "Current template photo paths:"
sqlite3 "$DB_PATH" "SELECT id, name, photo FROM recipe_templates WHERE photo IS NOT NULL;" | while IFS='|' read -r id name photo; do
    echo "  [$id] $name"
    echo "      Photo: $photo"
done
echo ""

echo "Current recipe photo paths:"
sqlite3 "$DB_PATH" "SELECT id, name, photo FROM recipes WHERE photo IS NOT NULL LIMIT 10;" | while IFS='|' read -r id name photo; do
    echo "  [$id] $name"
    echo "      Photo: $photo"
done
echo ""

# Check for incorrect paths
BAD_TEMPLATE_PATHS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM recipe_templates WHERE photo IS NOT NULL AND photo NOT LIKE '/template-images/%' AND photo NOT LIKE 'http%';")
BAD_RECIPE_PATHS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM recipes WHERE photo IS NOT NULL AND photo NOT LIKE '/recipe-images/%' AND photo NOT LIKE '/template-images/%' AND photo NOT LIKE 'http%';")

echo "Analysis:"
echo "  Templates with incorrect paths: $BAD_TEMPLATE_PATHS"
echo "  Recipes with incorrect paths: $BAD_RECIPE_PATHS"
echo ""

if [ "$BAD_TEMPLATE_PATHS" -eq 0 ] && [ "$BAD_RECIPE_PATHS" -eq 0 ]; then
    echo "✓ All photo paths look correct!"
    echo ""
    echo "If images still don't show, the issue is likely:"
    echo "  1. Server not serving the static files correctly"
    echo "  2. File permissions issue"
    echo "  3. Files don't exist in the directory"
    echo ""
    echo "Run: ./scripts/diagnose-photos.sh for more details"
    exit 0
fi

echo "⚠️  Found incorrect photo paths!"
echo ""
echo "Would you like to fix them? This will:"
echo "  - Update template photos to use /template-images/ prefix"
echo "  - Update recipe photos to use /recipe-images/ prefix"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Backup database first
BACKUP_FILE="$PROJECT_ROOT/server/data/coffee-timer.db.backup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup: $BACKUP_FILE"
cp "$DB_PATH" "$BACKUP_FILE"
echo "✓ Backup created"
echo ""

# Fix template paths
echo "Fixing template photo paths..."
sqlite3 "$DB_PATH" <<EOF
-- Fix paths that are just filenames
UPDATE recipe_templates 
SET photo = '/template-images/' || photo 
WHERE photo IS NOT NULL 
  AND photo NOT LIKE '/%' 
  AND photo NOT LIKE 'http%';

-- Fix paths that have wrong directory
UPDATE recipe_templates 
SET photo = '/template-images/' || substr(photo, instr(photo, '/') + 1)
WHERE photo IS NOT NULL 
  AND photo LIKE '/%'
  AND photo NOT LIKE '/template-images/%'
  AND photo NOT LIKE 'http%';
EOF
echo "✓ Template paths fixed"

# Fix recipe paths
echo "Fixing recipe photo paths..."
sqlite3 "$DB_PATH" <<EOF
-- Fix paths that are just filenames
UPDATE recipes 
SET photo = '/recipe-images/' || photo 
WHERE photo IS NOT NULL 
  AND photo NOT LIKE '/%' 
  AND photo NOT LIKE 'http%';

-- Fix paths that have wrong directory (but keep template-images paths)
UPDATE recipes 
SET photo = '/recipe-images/' || substr(photo, instr(photo, '/') + 1)
WHERE photo IS NOT NULL 
  AND photo LIKE '/%'
  AND photo NOT LIKE '/recipe-images/%'
  AND photo NOT LIKE '/template-images/%'
  AND photo NOT LIKE 'http%';
EOF
echo "✓ Recipe paths fixed"
echo ""

# Show results
echo "=== Results ==="
echo ""
echo "Updated template photo paths:"
sqlite3 "$DB_PATH" "SELECT id, name, photo FROM recipe_templates WHERE photo IS NOT NULL LIMIT 5;" | while IFS='|' read -r id name photo; do
    echo "  [$id] $name"
    echo "      Photo: $photo"
done
echo ""

echo "Updated recipe photo paths:"
sqlite3 "$DB_PATH" "SELECT id, name, photo FROM recipes WHERE photo IS NOT NULL LIMIT 5;" | while IFS='|' read -r id name photo; do
    echo "  [$id] $name"
    echo "      Photo: $photo"
done
echo ""

echo "✓ Photo paths have been fixed!"
echo ""
echo "Next steps:"
echo "  1. Restart the server: ./scripts/app.sh restart"
echo "  2. Test in browser"
echo "  3. If still not working, run: ./scripts/diagnose-photos.sh"
echo ""
echo "Backup saved at: $BACKUP_FILE"
