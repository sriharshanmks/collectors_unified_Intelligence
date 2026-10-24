#!/usr/bin/env bash
# =============================================================================
# FIMMS — Collector's Unified Application
# Local Development Startup Script
# Starts all 3 backend microservices + React frontend
# Usage: ./start_dev.sh
# =============================================================================

set -e
cd "$(dirname "$0")"   # Always run from project root

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   FIMMS — Collector's Unified Application            ║"
echo "║   Microservices Development Mode                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Free ports if previously running
lsof -ti:8000,8001,8002,5173 | xargs kill -9 2>/dev/null || true

# ── 1. Activate / Create Python virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
fi

# ── 2. Install Python dependencies (if needed)
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "📦 Installing Python dependencies..."
    pip install -q -r backend/requirements.txt
fi

# ── 3. Load .env environment variables
if [ -f ".env" ]; then
    echo "📋 Loading environment variables from .env..."
    set -a
    source .env
    set +a
else
    echo "📋 Copying .env.example → .env  (Edit to add your API keys)"
    cp .env.example .env
fi

# ── 4. Seed SQLite database (for dev — no PostgreSQL needed)
echo "🌱 Initializing & seeding local SQLite database..."
DATABASE_URL="sqlite:///./farmai.db" python3 -m backend.seed_data 2>/dev/null || true

echo ""
echo "🚀 Starting FIMMS Microservices..."
echo "   ┌─ Core Backend API    →  http://localhost:8000  (API docs: /docs)"
echo "   ├─ Auth Microservice   →  http://localhost:8001  (API docs: /docs)"
echo "   ├─ AI/RAG Microservice →  http://localhost:8002  (API docs: /docs)"
echo "   └─ React Frontend      →  http://localhost:5173"
echo ""
echo "   Demo Credentials:"
echo "   Collector : collector@fimms.gov.in / admin123"
echo "   Citizen   : citizen@fimms.gov.in   / citizen123"
echo ""

# ── 5. Start backend services in background
DATABASE_URL="sqlite:///./farmai.db" \
    python3 -m uvicorn backend.main:app --reload --port 8000 --log-level warning &
BACKEND_PID=$!

DATABASE_URL="sqlite:///./farmai.db" \
    python3 -m uvicorn services.auth_service.main:app --reload --port 8001 --log-level warning &
AUTH_PID=$!

DATABASE_URL="sqlite:///./farmai.db" \
    python3 -m uvicorn services.ai_service.main:app --reload --port 8002 --log-level warning &
AI_PID=$!

# ── 6. Cleanup on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Stopping all FIMMS services..."
    kill $BACKEND_PID $AUTH_PID $AI_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ── 7. Start React frontend
sleep 1
cd frontend
npm run dev
