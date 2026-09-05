#!/bin/bash
# ============================================================
# deploy-hub.sh — Deployment Cepat via Docker Hub Pull
# Menarik image yang sudah dibuild dari laptop lokal,
# melakukan auto-backup database, migrasi, dan restart aplikasi.
#
# Penggunaan di Server:
#   bash deploy-hub.sh
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

APP_NAME="rajawali-app"
IMAGE_NAME="randisalam1007/rajawali-bp-erp:latest"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} 🚀 Deploying via Docker Hub (Fast Pull Mode)   ${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Update source code (jika repo git aktif)
echo ""
echo -e "${CYAN}[1/5] Memeriksa update script & konfigurasi...${NC}"
if [ -d ".git" ]; then
    git fetch origin main || true
    git pull origin main || true
    echo -e "${GREEN}   ✓ Repository up-to-date.${NC}"
fi

# 2. Check environment
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo -e "${RED}❌ File .env atau .env.production tidak ditemukan!${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Menggunakan environment: $ENV_FILE${NC}"

# 3. Pull latest pre-built image from Docker Hub
echo ""
echo -e "${CYAN}[2/5] Menarik image terbaru dari Docker Hub...${NC}"
docker pull $IMAGE_NAME
echo -e "${GREEN}   ✓ Image berhasil di-pull: $IMAGE_NAME${NC}"

# 4. Backup snapshot database sebelum migrasi
echo ""
echo -e "${CYAN}[3/5] Snapshot database otomatis...${NC}"
mkdir -p ./backups
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/backup_db_${BACKUP_TIMESTAMP}.sql"
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")

if [ -n "$DB_URL" ]; then
    echo -e "${YELLOW}   Menyimpan snapshot ke $BACKUP_FILE...${NC}"
    docker run --rm \
        --network host \
        postgres:16-alpine \
        pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/dev/null \
        && echo -e "${GREEN}   ✓ Snapshot berhasil: $BACKUP_FILE${NC}" \
        || echo -e "${YELLOW}   ℹ Catatan: pg_dump dilewati.${NC}"
fi

# 5. Database migration
echo ""
echo -e "${CYAN}[4/5] Menerapkan migrasi database Prisma...${NC}"
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    $IMAGE_NAME \
    npx prisma migrate deploy

echo -e "${GREEN}   ✓ Migrasi database selesai.${NC}"

# 6. Restart container
echo ""
echo -e "${CYAN}[5/5] Memulai ulang container ($APP_NAME)...${NC}"
docker stop $APP_NAME 2>/dev/null && docker rm $APP_NAME 2>/dev/null || true

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
    $IMAGE_NAME

# Bersihkan image yang tidak terpakai
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Deployment via Docker Hub Berhasil!         ${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   Status: $(docker inspect -f '{{.State.Status}}' $APP_NAME 2>/dev/null || echo 'Running')"
echo -e "   URL   : https://portal.rajawalimix.com"
echo -e "${GREEN}================================================${NC}"
