#!/bin/bash

# Script to start both backend and frontend servers
# Usage: ./start-server.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🛑 Stopping any existing servers..."
pkill -f "go run.*main.go" || pkill -f "next dev" || echo "No existing servers found"

echo "🚀 Starting backend server..."
cd "$SCRIPT_DIR/backend"
go run cmd/server/main.go > "$SCRIPT_DIR/backend-server.log" 2>&1 &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🚀 Starting frontend server..."
cd "$SCRIPT_DIR/frontend"
npm run dev > "$SCRIPT_DIR/frontend-server.log" 2>&1 &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 5

if ps -p $BACKEND_PID > /dev/null && ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Both servers started successfully!"
    echo "📝 Backend logs: tail -f backend-server.log"
    echo "📝 Frontend logs: tail -f frontend-server.log"
    echo "🌐 Backend: http://localhost:8080"
    echo "🌐 Frontend: http://localhost:3000"
    echo ""
    echo "To view logs:"
    echo "  Backend:  tail -f backend-server.log"
    echo "  Frontend: tail -f frontend-server.log"
    echo ""
    echo "To stop servers:"
    echo "  pkill -f 'go run.*main.go'"
    echo "  pkill -f 'next dev'"
else
    echo "❌ One or more servers failed to start. Check logs for errors."
    exit 1
fi
