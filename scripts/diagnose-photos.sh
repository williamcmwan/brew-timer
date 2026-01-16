#!/bin/bash

# Comprehensive photo diagnostic script for AWS production

echo "=== Photo Serving Diagnostics ==="
echo ""

# Check if sqlite3 is available
if ! command -v sqlite3 &> /dev/null; then
    echo "⚠️  sqlite3 not installed. Install with: sudo yum install sqlite"
    echo ""
fi

# 1. Check directories
echo "1. Checking directories..."
echo ""
if [ -d "server/data/template-images" ]; then
    TEMPLATE_COUNT=$(find server/data/template-images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | wc -l)
    echo "   ✓ Template images directory exists"
    echo "     Image files: $TEMPLATE_COUNT"
    if [ $TEMPLATE_COUNT -gt 0 ]; then
        echo "     Sample files:"
        find server/data/template-images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | head -3 | while read file; do
            echo "       - $(basename "$file")"
        done
    fi
else
    echo "   ✗ Template images directory missing"
fi
echo ""

if [ -d "server/data/recipe-images" ]; then
    RECIPE_COUNT=$(find server/data/recipe-images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | wc -l)
    echo "   ✓ Recipe images directory exists"
    echo "     Image files: $RECIPE_COUNT"
    if [ $RECIPE_COUNT -gt 0 ]; then
        echo "     Sample files:"
        find server/data/recipe-images -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | head -3 | while read file; do
            echo "       - $(basename "$file")"
        done
    fi
else
    echo "   ✗ Recipe images directory missing"
fi
echo ""

# 2. Check database
echo "2. Checking database photo paths..."
echo ""
if [ -f "server/data/coffee-timer.db" ]; then
    echo "   Recipe Templates:"
    sqlite3 server/data/coffee-timer.db "SELECT id, name, photo FROM recipe_templates LIMIT 5;" 2>/dev/null | while IFS='|' read -r id name photo; do
        echo "     [$id] $name"
        echo "         Photo: $photo"
    done
    echo ""
    
    echo "   User Recipes:"
    sqlite3 server/data/coffee-timer.db "SELECT id, name, photo FROM recipes WHERE photo IS NOT NULL LIMIT 5;" 2>/dev/null | while IFS='|' read -r id name photo; do
        echo "     [$id] $name"
        echo "         Photo: $photo"
    done
else
    echo "   ✗ Database not found"
fi
echo ""

# 3. Check server status
echo "3. Checking server..."
echo ""
if lsof -i :3005 > /dev/null 2>&1; then
    echo "   ✓ Server is running on port 3005"
    
    # Check server logs for image serving
    if [ -f "server/app.log" ]; then
        echo ""
        echo "   Server log (image serving):"
        grep -i "serving.*images" server/app.log | tail -3 | sed 's/^/     /'
    fi
else
    echo "   ✗ Server is not running"
    echo "     Start with: ./scripts/app.sh start"
fi
echo ""

# 4. Test endpoints
echo "4. Testing image endpoints..."
echo ""
if lsof -i :3005 > /dev/null 2>&1; then
    # Test template images endpoint
    TEMPLATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/template-images/ 2>/dev/null)
    echo "   Template images endpoint: HTTP $TEMPLATE_STATUS"
    
    # Test recipe images endpoint
    RECIPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/recipe-images/ 2>/dev/null)
    echo "   Recipe images endpoint: HTTP $RECIPE_STATUS"
    
    # Test a specific template image if any exist
    FIRST_TEMPLATE=$(find server/data/template-images -type f \( -name "*.jpg" -o -name "*.png" \) | head -1)
    if [ -n "$FIRST_TEMPLATE" ]; then
        FILENAME=$(basename "$FIRST_TEMPLATE")
        IMAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/template-images/$FILENAME 2>/dev/null)
        echo "   Sample image ($FILENAME): HTTP $IMAGE_STATUS"
        
        if [ "$IMAGE_STATUS" != "200" ]; then
            echo "     ⚠️  Image not accessible!"
        fi
    fi
    
    # Test API
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/health 2>/dev/null)
    echo "   API health: HTTP $API_STATUS"
    
    # Test templates API
    TEMPLATES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/api/recipes/templates 2>/dev/null)
    echo "   Templates API: HTTP $TEMPLATES_STATUS"
    
    if [ "$TEMPLATES_STATUS" = "200" ]; then
        echo ""
        echo "   Template data sample:"
        curl -s http://localhost:3005/api/recipes/templates 2>/dev/null | head -c 500
        echo ""
    fi
else
    echo "   ⚠️  Server not running, cannot test endpoints"
fi
echo ""

# 5. Check file permissions
echo "5. Checking permissions..."
echo ""
if [ -d "server/data/template-images" ]; then
    PERMS=$(stat -c "%a %U:%G" server/data/template-images 2>/dev/null || stat -f "%Lp %Su:%Sg" server/data/template-images 2>/dev/null)
    echo "   Template images: $PERMS"
fi
if [ -d "server/data/recipe-images" ]; then
    PERMS=$(stat -c "%a %U:%G" server/data/recipe-images 2>/dev/null || stat -f "%Lp %Su:%Sg" server/data/recipe-images 2>/dev/null)
    echo "   Recipe images: $PERMS"
fi
echo ""

# 6. Check for common issues
echo "6. Common issues check..."
echo ""

# Check if photos have correct path format
if [ -f "server/data/coffee-timer.db" ]; then
    BAD_PATHS=$(sqlite3 server/data/coffee-timer.db "SELECT COUNT(*) FROM recipe_templates WHERE photo IS NOT NULL AND photo NOT LIKE '/template-images/%';" 2>/dev/null)
    if [ "$BAD_PATHS" -gt 0 ]; then
        echo "   ⚠️  Found $BAD_PATHS template(s) with incorrect photo paths"
        echo "       Expected format: /template-images/filename.jpg"
        echo "       Run fix script to correct paths"
    else
        echo "   ✓ All template photo paths look correct"
    fi
fi
echo ""

# 7. Recommendations
echo "=== Recommendations ==="
echo ""

if ! lsof -i :3005 > /dev/null 2>&1; then
    echo "• Start the server: ./scripts/app.sh start"
fi

if [ -f "server/data/coffee-timer.db" ] && [ "$BAD_PATHS" -gt 0 ]; then
    echo "• Fix photo paths in database (see below for SQL)"
fi

if [ "$TEMPLATE_COUNT" -eq 0 ]; then
    echo "• No template images found - check if files were transferred"
fi

echo ""
echo "=== Quick Fixes ==="
echo ""
echo "# Restart server"
echo "./scripts/app.sh restart"
echo ""
echo "# Fix permissions"
echo "chmod -R 755 server/data/template-images/"
echo "chmod -R 755 server/data/recipe-images/"
echo ""
echo "# Test image access"
echo "curl -I http://localhost:3005/template-images/[filename].jpg"
echo ""

# If bad paths found, show SQL to fix
if [ -f "server/data/coffee-timer.db" ] && [ "$BAD_PATHS" -gt 0 ]; then
    echo "# Fix database photo paths (if needed)"
    echo "sqlite3 server/data/coffee-timer.db"
    echo "  SELECT id, name, photo FROM recipe_templates WHERE photo IS NOT NULL;"
    echo "  -- If paths are wrong, update them:"
    echo "  UPDATE recipe_templates SET photo = '/template-images/' || substr(photo, instr(photo, '/') + 1) WHERE photo NOT LIKE '/template-images/%';"
    echo ""
fi

echo "=== End Diagnostics ==="
