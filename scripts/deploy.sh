#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Brew Journal Deployment ==="
echo "Project root: $PROJECT_ROOT"

# Install server dependencies
echo ""
echo "=== Installing server dependencies ==="
cd "$PROJECT_ROOT/server"
npm install

# Build server
echo ""
echo "=== Building server ==="
npm run build

# Install client dependencies
echo ""
echo "=== Installing client dependencies ==="
cd "$PROJECT_ROOT/client"
npm install

# Build client
echo ""
echo "=== Building client ==="
npm run build

# Create data directory structure if it doesn't exist
echo ""
echo "=== Setting up data directory ==="
mkdir -p "$PROJECT_ROOT/server/data/recipe-images"
mkdir -p "$PROJECT_ROOT/server/data/template-images"
echo "Created data directories:"
echo "  - $PROJECT_ROOT/server/data/recipe-images"
echo "  - $PROJECT_ROOT/server/data/template-images"

echo ""
echo "=== Deployment complete! ==="
echo ""
echo "To start the application, run:"
echo "  ./scripts/app.sh start"
echo ""
echo "The application will be available at http://localhost:3005"
