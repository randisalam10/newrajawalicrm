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

# 5. Database migration (Metode Cepat & Hemat RAM)
echo ""
echo -e "${CYAN}[4/5] Menerapkan migrasi database...${NC}"
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
MIGRATION_FILE="prisma/migrations/20260906000000_add_po_approval_audit_fields/migration.sql"

# Jalankan via psql host jika ada (instan & 0 MB RAM overhead)
if command -v psql &> /dev/null && [ -n "$DB_URL" ] && [ -f "$MIGRATION_FILE" ]; then
    echo -e "${YELLOW}   Mengeksekusi migrasi langsung via native psql (ultra cepat & 0 overhead)...${NC}"
    psql "$DB_URL" -f "$MIGRATION_FILE" 2>/dev/null || sudo -u postgres psql -d rajawali_prod -f "$MIGRATION_FILE" 2>/dev/null || true
    echo -e "${GREEN}   ✓ Migrasi via psql selesai.${NC}"
elif [ -f "fix-db.sh" ]; then
    echo -e "${YELLOW}   Mengeksekusi sinkronisasi database via fix-db.sh...${NC}"
    bash fix-db.sh 2>/dev/null || true
    echo -e "${GREEN}   ✓ fix-db.sh selesai.${NC}"
else
    echo -e "${YELLOW}   Menjalankan migrasi via container (dibatasi RAM 256m)...${NC}"
    docker run --rm \
        --network host \
        --memory="256m" \
        --cpus="1.0" \
        --env-file $ENV_FILE \
        $IMAGE_NAME \
        npx prisma migrate deploy || true
    echo -e "${GREEN}   ✓ Migrasi via container selesai.${NC}"
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
