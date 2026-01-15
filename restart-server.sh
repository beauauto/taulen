#!/bin/bash

# Script to restart the Next.js development server
# Usage: ./restart-server.sh

set -e

echo "🛑 Stopping existing Next.js server..."
pkill -f "next dev" || pkill -f "next-server" || echo "No server process found"

echo "🧹 Clearing build cache..."
cd "$(dirname "$0")/frontend"
rm -rf .next node_modules/.cache 2>/dev/null || true
echo "✓ Cache cleared"

echo "🚀 Starting Next.js dev server..."
npm run dev > ../frontend-dev.log 2>&1 &
SERVER_PID=$!

echo "⏳ Waiting for server to start..."
sleep 5

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server started successfully!"
    echo "📝 Logs: tail -f frontend-dev.log"
    echo "🌐 Server: http://localhost:3000"
    echo ""
    echo "To view logs: tail -f frontend-dev.log"
    echo "To stop server: pkill -f 'next dev'"
else
    echo "❌ Server failed to start. Check frontend-dev.log for errors."
    exit 1
fi
