#!/bin/bash

# Script to check image serving status

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Image Serving Status Check ==="
echo ""

# Check if directories exist
echo "1. Checking directories..."
if [ -d "$PROJECT_ROOT/server/data/recipe-images" ]; then
    RECIPE_COUNT=$(find "$PROJECT_ROOT/server/data/recipe-images" -type f | wc -l)
    echo "   ✓ Recipe images directory exists"
    echo "     Files: $RECIPE_COUNT"
    if [ $RECIPE_COUNT -eq 0 ]; then
        echo "     ⚠️  No recipe images found"
    fi
else
    echo "   ✗ Recipe images directory missing"
fi

if [ -d "$PROJECT_ROOT/server/data/template-images" ]; then
    TEMPLATE_COUNT=$(find "$PROJECT_ROOT/server/data/template-images" -type f | wc -l)
    echo "   ✓ Template images directory exists"
    echo "     Files: $TEMPLATE_COUNT"
    if [ $TEMPLATE_COUNT -eq 0 ]; then
        echo "     ⚠️  No template images found"
    fi
else
    echo "   ✗ Template images directory missing"
fi

echo ""
echo "2. Checking server status..."
if lsof -i :3005 > /dev/null 2>&1; then
    echo "   ✓ Server is running on port 3005"
    
    echo ""
    echo "3. Testing image endpoints..."
    
    # Test recipe images endpoint
    RECIPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/recipe-images/)
    if [ "$RECIPE_STATUS" = "200" ] || [ "$RECIPE_STATUS" = "301" ] || [ "$RECIPE_STATUS" = "403" ]; then
        echo "   ✓ Recipe images endpoint responding (HTTP $RECIPE_STATUS)"
    else
        echo "   ✗ Recipe images endpoint not responding (HTTP $RECIPE_STATUS)"
    fi
    
    # Test template images endpoint
    TEMPLATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/template-images/)
    if [ "$TEMPLATE_STATUS" = "200" ] || [ "$TEMPLATE_STATUS" = "301" ] || [ "$TEMPLATE_STATUS" = "403" ]; then
        echo "   ✓ Template images endpoint responding (HTTP $TEMPLATE_STATUS)"
    else
        echo "   ✗ Template images endpoint not responding (HTTP $TEMPLATE_STATUS)"
    fi
    
    # Test a specific image if any exist
    if [ $RECIPE_COUNT -gt 0 ]; then
        FIRST_IMAGE=$(find "$PROJECT_ROOT/server/data/recipe-images" -type f | head -1 | xargs basename)
        if [ -n "$FIRST_IMAGE" ]; then
            IMAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3005/recipe-images/$FIRST_IMAGE)
            echo "   Testing sample image: $FIRST_IMAGE (HTTP $IMAGE_STATUS)"
        fi
    fi
else
    echo "   ✗ Server is not running on port 3005"
    echo "     Start with: ./scripts/app.sh start"
fi

echo ""
echo "4. Checking file permissions..."
if [ -d "$PROJECT_ROOT/server/data/recipe-images" ]; then
    PERMS=$(stat -f "%Sp" "$PROJECT_ROOT/server/data/recipe-images" 2>/dev/null || stat -c "%A" "$PROJECT_ROOT/server/data/recipe-images" 2>/dev/null)
    echo "   Recipe images: $PERMS"
fi
if [ -d "$PROJECT_ROOT/server/data/template-images" ]; then
    PERMS=$(stat -f "%Sp" "$PROJECT_ROOT/server/data/template-images" 2>/dev/null || stat -c "%A" "$PROJECT_ROOT/server/data/template-images" 2>/dev/null)
    echo "   Template images: $PERMS"
fi

echo ""
echo "=== Recommendations ==="
if [ $RECIPE_COUNT -eq 0 ]; then
    echo "• No recipe images found. Upload images through the app or transfer from backup."
fi
if [ ! -d "$PROJECT_ROOT/server/data/recipe-images" ]; then
    echo "• Run ./scripts/deploy.sh to create required directories."
fi
if ! lsof -i :3005 > /dev/null 2>&1; then
    echo "• Start the server with ./scripts/app.sh start"
fi

echo ""
