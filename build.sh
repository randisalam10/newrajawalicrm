#!/bin/bash
# ============================================================
# build.sh — Build & Push Docker image ke registry
# Jalankan di mesin lokal / CI sebelum deploy
# Usage: bash build.sh [TAG]
#   TAG default: v1.0.4
# ============================================================

set -e

IMAGE_NAME="randisalam1007/rajawali-bp-erp"
TAG="${1:-v1.0.9}"

echo "================================================"
echo " 🔨 Building Rajawali BP ERP — $IMAGE_NAME:$TAG"
echo "================================================"

# ── 1. Build Docker image (multi-platform atau single)
echo ""
echo "[1/3] Building Docker image..."
docker build \
    --platform linux/amd64 \
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
echo "[3/3] Update IMAGE_TAG di deploy.sh → $TAG"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$TAG\"/" deploy.sh
else
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=\"$TAG\"/" deploy.sh
fi
echo "   ✓ deploy.sh IMAGE_TAG diperbarui"

echo ""
echo "================================================"
echo " ✅ Build & Push selesai!"
echo "   Image   : $IMAGE_NAME:$TAG"
echo "   Langkah : scp deploy.sh ke server, lalu:"
echo "             bash deploy.sh"
echo "================================================"
