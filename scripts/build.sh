#!/bin/bash
# ============================================================
# build.sh — Build & Push Docker image ke registry
# Jalankan di mesin lokal / CI sebelum deploy
# Usage: bash build.sh [TAG]
#   TAG default: v1.0.4
# ============================================================

set -e

IMAGE_NAME="randisalam1007/rajawali-bp-erp"
TAG="${1:-v2.0.6}"

echo "================================================"
echo " 🔨 Building Rajawali BP ERP — $IMAGE_NAME:$TAG"
echo "================================================"

# Load Pusher keys for client build
PUSHER_KEY="bc74d4540fb90aef4aa1"
PUSHER_CLUSTER="ap1"
if [ -f .env ]; then
    PK=$(grep '^NEXT_PUBLIC_PUSHER_APP_KEY=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || true)
    PC=$(grep '^NEXT_PUBLIC_PUSHER_CLUSTER=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' || true)
    [ -n "$PK" ] && PUSHER_KEY="$PK"
    [ -n "$PC" ] && PUSHER_CLUSTER="$PC"
fi

# ── 1. Build Docker image (multi-platform atau single)
echo ""
echo "[1/3] Building Docker image..."
docker build \
    --platform linux/amd64 \
    --build-arg NEXT_PUBLIC_PUSHER_APP_KEY="$PUSHER_KEY" \
    --build-arg NEXT_PUBLIC_PUSHER_CLUSTER="$PUSHER_CLUSTER" \
    -t "$IMAGE_NAME:$TAG" \
    -t "$IMAGE_NAME:latest" \
    -f Dockerfile \
    .

echo "   ✓ Build selesai: $IMAGE_NAME:$TAG"

# ── 2. Push ke Docker Hub
echo ""
echo "[2/3] Pushing image ke Docker Hub..."
docker push "$IMAGE_NAME:$TAG"
docker push "$IMAGE_NAME:latest"
echo "   ✓ Push selesai"

# ── 3. Update versi di deploy.sh
echo ""
if [ -f deploy.sh ]; then
    sed -i "s/^DEFAULT_IMAGE_TAG=.*/DEFAULT_IMAGE_TAG=\"$TAG\"/" deploy.sh 2>/dev/null || true
fi
if [ -f scripts/deploy.sh ]; then
    sed -i "s/^DEFAULT_IMAGE_TAG=.*/DEFAULT_IMAGE_TAG=\"$TAG\"/" scripts/deploy.sh 2>/dev/null || true
fi
echo "   ✓ deploy.sh DEFAULT_IMAGE_TAG diperbarui"

echo ""
echo "================================================"
echo " ✅ Build & Push selesai!"
echo "   Image   : $IMAGE_NAME:$TAG"
echo "   Langkah : scp deploy.sh ke server, lalu:"
echo "             bash deploy.sh"
echo "================================================"
