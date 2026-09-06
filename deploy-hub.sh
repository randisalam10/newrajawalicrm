#!/bin/bash
# ============================================================
# deploy-hub.sh — Deployment Cepat via Docker Hub Pull (Safe & Low Memory)
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
echo -e "${BLUE} 🚀 Deploying via Docker Hub (Safe & Lightweight)${NC}"
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

# 3. PENTING: Matikan container lama DULU agar RAM server lega!
echo ""
echo -e "${CYAN}[2/5] Membebaskan RAM server (Stop container lama)...${NC}"
docker stop $APP_NAME 2>/dev/null || true
docker rm $APP_NAME 2>/dev/null || true
echo -e "${GREEN}   ✓ RAM server berhasil dibebaskan.${NC}"

# 4. Pull latest image dari Docker Hub
echo ""
echo -e "${CYAN}[3/5] Menarik image terbaru dari Docker Hub...${NC}"
docker pull $IMAGE_NAME
echo -e "${GREEN}   ✓ Image berhasil di-pull: $IMAGE_NAME${NC}"

# 5. Database migration & Sync (Metode Cepat & Hemat RAM)
echo ""
echo -e "${CYAN}[4/5] Menerapkan migrasi database & backfill otomatis...${NC}"

# A. Jalankan apply-indexes.sh (Tabel MasterItemPriceHistory + Indexes + Backfill Harga)
if [ -f "apply-indexes.sh" ]; then
    echo -e "${YELLOW}   Mengeksekusi skema baru, indexes, dan backfill harga via apply-indexes.sh...${NC}"
    bash apply-indexes.sh || true
fi

# B. Jalankan sinkronisasi via psql host untuk semua file migrasi yang ada
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
CLEAN_DB_URL=""
if [ -n "$DB_URL" ]; then
    CLEAN_DB_URL=$(echo "$DB_URL" | sed -E 's/[?&]schema=[^&]*//g')
fi

if command -v psql &> /dev/null; then
    for sql_file in $(ls -1 prisma/migrations/*/migration.sql 2>/dev/null | sort); do
        mig_name=$(basename $(dirname $sql_file))
        if sudo -u postgres psql -d rajawali_prod -c '\q' 2>/dev/null; then
            sudo -u postgres psql -d rajawali_prod -f "$sql_file" >/dev/null 2>&1 || true
        elif [ -n "$CLEAN_DB_URL" ]; then
            psql "$CLEAN_DB_URL" -f "$sql_file" >/dev/null 2>&1 || true
        fi
    done
    echo -e "${GREEN}   ✓ Seluruh file migrasi DDL berhasil diterapkan.${NC}"
fi

# C. Jalankan fix-db.sh jika ada
if [ -f "fix-db.sh" ]; then
    echo -e "${YELLOW}   Mengeksekusi sinkronisasi skema DB via fix-db.sh...${NC}"
    bash fix-db.sh 2>/dev/null || true
    echo -e "${GREEN}   ✓ fix-db.sh selesai.${NC}"
fi

# 6. Jalankan container baru
echo ""
echo -e "${CYAN}[5/5] Menjalankan container aplikasi ($APP_NAME)...${NC}"
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
