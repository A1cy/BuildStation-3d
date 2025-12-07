#!/bin/bash
# Build-Station 3D - Local Development Server

echo "🚀 Starting Build-Station 3D development server..."
echo "📂 Serving from: public/"
echo "🌐 URL: http://localhost:3000"
echo ""

http-server public -p 3000 -c-1 --cors
