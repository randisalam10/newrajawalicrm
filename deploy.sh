#!/bin/bash
# ============================================================
# deploy.sh — Script Deploy ke Production (Ubuntu 20.04)
# Jalankan di server: bash deploy.sh
# ============================================================

set -e

APP_NAME="rajawali-app"
IMAGE_NAME="rajawali-bp-erp"
ENV_FILE=".env.production"
PORT=3000

# ── Deteksi IP host Docker (Linux tidak punya host.docker.internal otomatis) ──
# Docker bridge gateway biasanya 172.17.0.1
DOCKER_BRIDGE_IP=$(docker network inspect bridge \
    --format='{{range .IPAM.Config}}{{.Gateway}}{{end}}' 2>/dev/null || echo "172.17.0.1")
ADD_HOST_ARGS="--add-host=host.docker.internal:${DOCKER_BRIDGE_IP}"

echo "================================================"
echo " 🚀 Deploying Rajawali BP ERP"
echo "   Docker host IP: $DOCKER_BRIDGE_IP"
echo "================================================"

# ── 1. Pull latest code ──
echo ""
echo "[1/6] Pulling latest code from git..."
git pull origin main

# ── 2. Check env file ──
echo ""
echo "[2/6] Checking $ENV_FILE..."
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE tidak ditemukan!"
    echo "   Buat dari template: cp .env.production.example .env.production"
    echo "   Lalu isi semua nilai yang dibutuhkan."
    exit 1
fi
echo "   ✓ $ENV_FILE found"

# ── 3. Build Docker image ──
echo ""
echo "[3/6] Building Docker image..."
docker build -t $IMAGE_NAME:latest --no-cache .
echo "   ✓ Image built: $IMAGE_NAME:latest"

# ── 4. Run DB migrations ──
echo ""
echo "[4/6] Running database migrations..."
docker run --rm \
    --env-file $ENV_FILE \
    $ADD_HOST_ARGS \
    $IMAGE_NAME:latest \
    npx prisma migrate deploy
echo "   ✓ Migrations applied"

# ── 5. Seed superadmin (idempotent — aman di-re-run) ──
echo ""
echo "[5/6] Ensuring superadmin account exists..."
docker run --rm \
    --env-file $ENV_FILE \
    $ADD_HOST_ARGS \
    $IMAGE_NAME:latest \
    sh -c "cd /app && npx tsx prisma/seed.ts" \
    || echo "   ⚠ Seed skipped (SuperAdmin mungkin sudah ada)"
echo "   ✓ Superadmin checked"

# ── 6. Stop old container & start new one ──
echo ""
echo "[6/6] Restarting application container..."
docker stop $APP_NAME 2>/dev/null && docker rm $APP_NAME 2>/dev/null || true

docker run -d \
    --name $APP_NAME \
    --restart unless-stopped \
    -p 127.0.0.1:$PORT:3000 \
    --env-file $ENV_FILE \
    $ADD_HOST_ARGS \
    --memory="512m" \
    --cpus="1.0" \
    $IMAGE_NAME:latest

# Hapus dangling images lama
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo "================================================"
echo " ✅ Deployment selesai!"
echo "   Container : docker logs -f $APP_NAME"
echo "   Status    : docker ps"
echo "   App URL   : https://portal.rajawalimix.com"
echo "================================================"
