#!/usr/bin/env bash
# ==============================================================================
# FIMMS — 1-Click Automated Deployment Script for Amazon EC2 (Ubuntu / Debian)
# ==============================================================================
set -e

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   FIMMS — Collector's Unified Application            ║"
echo "║   Automated EC2 Production Deployment                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. Check & Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker Engine & Compose Plugin..."
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "✅ Docker installed successfully."
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
    echo "📋 Creating .env from .env.example..."
    cp .env.example .env
fi

# 3. Pull / Build & Start all multi-container services
echo "🏗️ Building & launching microservices (Postgres pgvector, Auth, AI Gemini, Backend, React Nginx)..."
sudo docker compose down || true
sudo docker compose up -d --build

# 4. Display status & Public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || curl -s https://api.ipify.org 2>/dev/null || echo "<EC2_PUBLIC_IP>")

echo ""
echo "=============================================================================="
echo "🎉 FIMMS APPLICATION IS DEPLOYED AND LIVE ON EC2!"
echo "=============================================================================="
echo "🌐 Web Application: http://${PUBLIC_IP}/"
echo "🔌 API Docs:         http://${PUBLIC_IP}:8000/docs"
echo "🤖 AI Service Docs:  http://${PUBLIC_IP}:8002/docs"
echo "🔐 Auth Docs:        http://${PUBLIC_IP}:8001/docs"
echo ""
echo "🔑 Pre-seeded Demo Logins:"
echo "   - Collector Portal: collector@fimms.gov.in  /  admin123"
echo "   - Citizen Portal:   citizen@fimms.gov.in    /  citizen123"
echo "=============================================================================="
