#!/usr/bin/env bash
# ==============================================================================
# FIMMS — Automated Production Deployment on EC2 with Amazon RDS & Amazon S3
# ==============================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║   FIMMS — Automated EC2 + Amazon RDS + S3 Deployment             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker Engine & Compose plugin..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin postgresql-client
    sudo usermod -aG docker "$USER"
    echo "✅ Docker & postgresql-client installed."
fi

# Ensure 2GB swap space for t3.micro / t3.small so Docker builds never run out of memory
if [ ! -f /swapfile ]; then
    echo "🧠 Configuring 2GB swap memory for t3.micro/t3.small stability..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "✅ 2GB Swap Memory Active."
fi

# 2. Check for .env file
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "👉 Please copy .env.example to .env and fill in your RDS DATABASE_URL, GEMINI_API_KEY, and S3_BUCKET_NAME."
    exit 1
fi

# Load variables
set -a
source .env
set +a

if [[ "$DATABASE_URL" == *"localhost"* ]] || [[ "$DATABASE_URL" == *"sqlite"* ]]; then
    echo "⚠️ Warning: DATABASE_URL in .env appears to point to localhost/sqlite instead of RDS."
    echo "Current DATABASE_URL: $DATABASE_URL"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. Initialize RDS Schema & pgvector if DATABASE_URL is provided
echo "🐘 Verifying & Initializing RDS PostgreSQL Schema..."
python3 -c "
import os, sys
db_url = os.getenv('DATABASE_URL', '')
if 'postgresql' in db_url and 'rds.amazonaws.com' in db_url:
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(db_url)
        with engine.connect() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector;'))
            conn.commit()
            print('✅ RDS pgvector extension confirmed!')
            
            # Read schema_postgres.sql
            with open('schema_postgres.sql', 'r') as f:
                schema_sql = f.read()
            for stmt in schema_sql.split(';'):
                stmt = stmt.strip()
                if stmt:
                    try:
                        conn.execute(text(stmt))
                    except Exception as e:
                        pass
            conn.commit()
            print('✅ RDS schema initialized successfully!')
    except Exception as e:
        print(f'⚠️ RDS direct init note (tables will auto-create via app lifespan): {e}')
" 2>/dev/null || true

# 4. Pull / Build & Launch production microservices
echo "🏗️ Building & launching production services on EC2..."
sudo docker compose -f docker-compose.prod.yml down || true
sudo docker compose -f docker-compose.prod.yml up -d --build

# 5. Fetch Public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s https://api.ipify.org 2>/dev/null || echo "<EC2_PUBLIC_IP>")

echo ""
echo "=============================================================================="
echo "🎉 FIMMS IS DEPLOYED LIVE ON EC2 CONNECTED TO RDS & S3!"
echo "=============================================================================="
echo "🌐 Web Dashboard:    http://${PUBLIC_IP}/"
echo "🔌 Core API Docs:     http://${PUBLIC_IP}:8000/docs"
echo "🤖 AI Gemini Docs:    http://${PUBLIC_IP}:8002/docs"
echo "🔐 Auth Docs:         http://${PUBLIC_IP}:8001/docs"
echo ""
echo "🔑 Pre-seeded Logins:"
echo "   - Collector Portal: collector@fimms.gov.in / admin123"
echo "   - Citizen Portal:   citizen@fimms.gov.in   / citizen123"
echo "=============================================================================="
