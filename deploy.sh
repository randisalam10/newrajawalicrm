#!/bin/bash
# ============================================================
# deploy.sh — Script Deploy ke Production (Ubuntu 20.04)
# Jalankan di server: bash deploy.sh
# ============================================================

set -e

APP_NAME="rajawali-app"
IMAGE_NAME="randisalam1007/rajawali-bp-erp"
IMAGE_TAG="v1.0.5"
ENV_FILE=".env.production"
PORT=3000

echo "================================================"
echo " 🚀 Deploying Rajawali BP ERP"
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

# ── 3. Pull Docker image from registry ──
echo ""
echo "[3/6] Pulling Docker image from registry..."
docker pull $IMAGE_NAME:$IMAGE_TAG
echo "   ✓ Image pulled: $IMAGE_NAME:$IMAGE_TAG"

# ── 4. Run DB migrations ──────────────────────────────────────────────────────
echo ""
echo "[4/6] Running database migrations..."

# Auto-resolve any previously failed migration (safe to run even if none failed)
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_NAME:$IMAGE_TAG \
    sh -c "npx prisma migrate resolve --rolled-back 20260228000000_add_invoice_payment_deposit_system 2>/dev/null || true"

docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_NAME:$IMAGE_TAG \
    npx prisma migrate deploy
echo "   ✓ Migrations applied"

# ── 5. Seed superadmin (idempotent — aman di-re-run) ──
echo ""
echo "[5/6] Ensuring superadmin account exists..."
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_NAME:$IMAGE_TAG \
    sh -c "node /app/prisma/seed.js" \
    || echo "   ⚠ Seed skipped (SuperAdmin mungkin sudah ada)"
echo "   ✓ Superadmin checked"

# ── 6. Stop old container & start new one ──
echo ""
echo "[6/6] Restarting application container..."
docker stop $APP_NAME 2>/dev/null && docker rm $APP_NAME 2>/dev/null || true

docker run -d \
    --network host \
    --name $APP_NAME \
    --restart unless-stopped \
    --env-file $ENV_FILE \
    --memory="512m" \
    --cpus="1.0" \
    -v /var/data/rajawali/uploads:/app/public/uploads \
    $IMAGE_NAME:$IMAGE_TAG

# Hapus dangling images lama
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo "================================================"
echo " ✅ Deployment selesai!"
echo "   Container : docker logs -f $APP_NAME"
echo "   Status    : docker ps"
echo "   App URL   : https://portal.rajawalimix.com"
echo "================================================"
