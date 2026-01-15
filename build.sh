#!/bin/bash

echo "🏗️  Building Coffee Brew Timer..."

# Build client
echo "📦 Building client..."
cd client
npm run build
cd ..

# Build server
echo "🚀 Building server..."
cd server
npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "📁 Client build: client/dist/"
echo "📁 Server build: server/dist/"
echo ""
echo "🚀 To run in production:"
echo "   cd server && npm start"