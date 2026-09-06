#!/bin/bash
# ============================================================
# deploy.sh — Script Deployment Otomatis Rajawali BP ERP
# Jalankan di server: bash deploy.sh
#
# Penggunaan:
#   bash deploy.sh            -> Default: Git pull, build container lokal di server, migrate DB, restart
#   bash deploy.sh --pull     -> Git pull, pull image dari Docker Hub, migrate DB, restart
#   bash deploy.sh --pull vX  -> Pull image dengan tag spesifik dari Docker Hub
# ============================================================

set -e

# Warna output terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

APP_NAME="rajawali-app"
DEFAULT_IMAGE_NAME="randisalam1007/rajawali-bp-erp"
DEFAULT_IMAGE_TAG="v2.0.7"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} 🚀 Memulai Deployment Otomatis Rajawali BP ERP  ${NC}"
echo -e "${BLUE}================================================${NC}"

# ── 1. Pull latest code from Git ──────────────────────────────
echo ""
echo -e "${CYAN}[1/6] Mengambil source code terbaru dari Git (git pull origin main)...${NC}"
if [ -d ".git" ]; then
    git fetch origin main
    git pull origin main
    echo -e "${GREEN}   ✓ Source code berhasil diperbarui dari branch main.${NC}"
else
    echo -e "${YELLOW}   ⚠ Direktori ini bukan git repo atau .git tidak ditemukan. Melewati git pull.${NC}"
fi

# ── 2. Check environment file ─────────────────────────────────
echo ""
echo -e "${CYAN}[2/6] Memeriksa file konfigurasi environment...${NC}"
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo -e "${RED}❌ ERROR: File .env.production atau .env tidak ditemukan!${NC}"
    echo "   Buat file dari template: cp .env.production.example .env.production"
    echo "   Lalu sesuaikan konfigurasi DATABASE_URL, NEXTAUTH_SECRET, dsb."
    exit 1
fi
echo -e "${GREEN}   ✓ Menggunakan file environment: $ENV_FILE${NC}"

# Ekstrak Pusher keys dari env file untuk build args
PUSHER_KEY=$(grep '^NEXT_PUBLIC_PUSHER_APP_KEY=' $ENV_FILE | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
PUSHER_CLUSTER=$(grep '^NEXT_PUBLIC_PUSHER_CLUSTER=' $ENV_FILE | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
[ -z "$PUSHER_KEY" ] && PUSHER_KEY="bc74d4540fb90aef4aa1"
[ -z "$PUSHER_CLUSTER" ] && PUSHER_CLUSTER="ap1"

# ── 3. Persiapan Docker Image ─────────────────────────────────
echo ""
echo -e "${CYAN}[3/6] Mempersiapkan Docker Image aplikasi...${NC}"

MODE="build"
if [ "$1" == "--pull" ] || [ "$1" == "-p" ]; then
    MODE="pull"
    TARGET_TAG="${2:-$DEFAULT_IMAGE_TAG}"
    IMAGE_TO_USE="$DEFAULT_IMAGE_NAME:$TARGET_TAG"
elif [[ "$1" =~ ^v[0-9] ]]; then
    MODE="pull"
    TARGET_TAG="$1"
    IMAGE_TO_USE="$DEFAULT_IMAGE_NAME:$TARGET_TAG"
else
    MODE="build"
    IMAGE_TO_USE="$APP_NAME:latest"
fi

if [ "$MODE" == "pull" ]; then
    echo -e "${YELLOW}   Mode: Pulling pre-built image dari Docker Hub ($IMAGE_TO_USE)...${NC}"
    docker pull $IMAGE_TO_USE
    echo -e "${GREEN}   ✓ Image berhasil di-pull: $IMAGE_TO_USE${NC}"
else
    echo -e "${YELLOW}   Mode: Building Docker image langsung di server ($IMAGE_TO_USE)...${NC}"
    docker build \
        --build-arg NEXT_PUBLIC_PUSHER_APP_KEY="$PUSHER_KEY" \
        --build-arg NEXT_PUBLIC_PUSHER_CLUSTER="$PUSHER_CLUSTER" \
        -t "$IMAGE_TO_USE" \
        -f Dockerfile \
        .
    echo -e "${GREEN}   ✓ Build Docker image selesai: $IMAGE_TO_USE${NC}"
fi

# ── 3.5. Backup Database Otomatis Sebelum Migrasi ─────────────
echo ""
echo -e "${CYAN}[3.5/6] Membuat backup otomatis snapshot database sebelum migrasi...${NC}"
mkdir -p ./backups
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/backup_db_${BACKUP_TIMESTAMP}.sql"

if [ -f "$ENV_FILE" ]; then
    DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ -n "$DB_URL" ]; then
        echo -e "${YELLOW}   Menyimpan snapshot data production ke $BACKUP_FILE...${NC}"
        docker run --rm \
            --network host \
            postgres:16-alpine \
            pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/dev/null \
            && echo -e "${GREEN}   ✓ Snapshot database tersimpan aman: $BACKUP_FILE${NC}" \
            || echo -e "${YELLOW}   ℹ Catatan: pg_dump via docker dilewati.${NC}"
    fi
fi

# ── 4. Eksekusi Migrasi Database Prisma ───────────────────────
echo ""
echo -e "${CYAN}[4/6] Menjalankan migrasi database Prisma...${NC}"

# 1. Resolve rollback jika ada migrasi lama yang tertahan
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_TO_USE \
    sh -c "npx prisma migrate resolve --rolled-back 20260228000000_add_invoice_payment_deposit_system 2>/dev/null || true"

# 2. Jalankan migrasi deploy resmi
echo -e "${YELLOW}   Mengeksekusi npx prisma migrate deploy...${NC}"
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_TO_USE \
    npx prisma migrate deploy

echo -e "${GREEN}   ✓ Seluruh migrasi database berhasil diterapkan.${NC}"

# ── 5. Seed Akun SuperAdmin & Role Permissions ────────────────
echo ""
echo -e "${CYAN}[5/6] Memeriksa data master & seed bawaan sistem...${NC}"
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_TO_USE \
    sh -c "node /app/prisma/seed.js" \
    || echo -e "${YELLOW}   ⚠ Seed akun admin dilewati (mungkin sudah terdaftar).${NC}"

docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_TO_USE \
    sh -c "node /app/prisma/seed-rbac.js 2>/dev/null || true" \
    || echo -e "${YELLOW}   ⚠ Seed RBAC dilewati.${NC}"

echo -e "${GREEN}   ✓ Data seed siap.${NC}"

# ── 6. Restart Container Aplikasi ─────────────────────────────
echo ""
echo -e "${CYAN}[6/6] Memulai ulang container aplikasi ($APP_NAME)...${NC}"
docker stop $APP_NAME 2>/dev/null && docker rm $APP_NAME 2>/dev/null || true

# Pastikan direktori uploads dan secrets ada di host
mkdir -p /var/data/rajawali/uploads
mkdir -p /home/secrets

docker run -d \
    --network host \
    --name $APP_NAME \
    --restart unless-stopped \
    --env-file $ENV_FILE \
    --memory="1024m" \
    --cpus="1.5" \
    -v /var/data/rajawali/uploads:/app/uploads \
    -v /home/secrets:/app/secrets \
    $IMAGE_TO_USE

# Bersihkan unused/dangling image agar hemat disk VPS
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Deployment Berhasil Selesai!                ${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   Container Status : $(docker inspect -f '{{.State.Status}}' $APP_NAME 2>/dev/null || echo 'Running')"
echo -e "   Lihat Logs       : docker logs -f $APP_NAME"
echo -e "   Cek Kontainer    : docker ps"
echo -e "   Portal Web       : https://portal.rajawalimix.com"
echo -e "${GREEN}================================================${NC}"
