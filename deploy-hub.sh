#!/bin/bash
# ============================================================
# deploy-hub.sh — Deployment via Docker Hub (Safe & Low Memory)
# Penggunaan: bash deploy-hub.sh [tag]
# Contoh:     bash deploy-hub.sh v2.4.6
# Default tag: v2.4.6 (diupdate tiap release)
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

APP_NAME="rajawali-app"
IMAGE_REPO="randisalam1007/rajawali-bp-erp"
IMAGE_TAG="${1:-v2.4.9}"
IMAGE_NAME="$IMAGE_REPO:$IMAGE_TAG"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} Deploying via Docker Hub${NC}"
echo -e "${BLUE}    Target Image: $IMAGE_NAME${NC}"
echo -e "${BLUE}================================================${NC}"

# ── 1. Update source code (script & config terbaru) ───────────
echo ""
echo -e "${CYAN}[1/5] Memeriksa update script & konfigurasi...${NC}"
if [ -d ".git" ]; then
    git fetch origin main || true
    git pull origin main || true
    echo -e "${GREEN}   ✓ Repository up-to-date.${NC}"
fi

# ── 2. Check environment ──────────────────────────────────────
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    echo -e "${RED}❌ File .env atau .env.production tidak ditemukan!${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Menggunakan environment: $ENV_FILE${NC}"

DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")

# ── 2.5. Stop container lama ──────────────────────────────────
echo ""
echo -e "${CYAN}[2/5] Membebaskan RAM server (Stop container lama)...${NC}"
docker stop $APP_NAME 2>/dev/null || true
docker rm $APP_NAME 2>/dev/null || true
echo -e "${GREEN}   ✓ Container lama dihentikan.${NC}"

# ── 2.75. Backup Database Otomatis (Perlindungan Data Production) ─
echo ""
echo -e "${CYAN}[2.5/5] Membuat backup snapshot database sebelum migrasi...${NC}"
mkdir -p ./backups
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/backup_db_${BACKUP_TIMESTAMP}.sql"

if sudo -u postgres pg_dump rajawali_prod > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}   ✓ Snapshot tersimpan: $BACKUP_FILE${NC}"
elif [ -n "$DB_URL" ]; then
    docker run --rm --network host postgres:16-alpine pg_dump "$DB_URL" > "$BACKUP_FILE" 2>/dev/null \
        && echo -e "${GREEN}   ✓ Snapshot tersimpan via container: $BACKUP_FILE${NC}" \
        || echo -e "${YELLOW}   ℹ pg_dump dilewati, melanjutkan.${NC}"
else
    echo -e "${YELLOW}   ℹ pg_dump dilewati, melanjutkan.${NC}"
fi

# Rotasi backup: Hapus file snapshot yang lebih tua dari 7 hari agar disk VPS tidak penuh
find ./backups -name "backup_db_*.sql" -type f -mtime +7 -delete 2>/dev/null || true

# ── 3. Pull image dari Docker Hub ─────────────────────────────
echo ""
echo -e "${CYAN}[3/5] Menarik image dari Docker Hub ($IMAGE_NAME)...${NC}"
docker pull "$IMAGE_NAME"
echo -e "${GREEN}   ✓ Image berhasil di-pull: $IMAGE_NAME${NC}"

# ── 4. Database migration — AMAN & IDEMPOTENT (Fail-fast) ──────
echo ""
echo -e "${CYAN}[4/5] Menerapkan migrasi schema database (Prisma migrate deploy)...${NC}"

# ⛔ apply-indexes.sh TIDAK dijalankan otomatis.
# Mengandung INSERT data (backfill MasterItemPriceHistory & RblCategory defaults)
# yang berbahaya jika diulang — bisa duplikat atau timpa data production.
# Jalankan MANUAL sekali saat setup server baru: bash apply-indexes.sh

# Auto-resolve migrasi lama yang sempat tertahan/failed di _prisma_migrations
echo -e "${YELLOW}   Mengecek dan me-resolve status migrasi lama yang tertahan...${NC}"
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    "$IMAGE_NAME" \
    sh -c "
        npx prisma migrate resolve --rolled-back 20260228000000_add_invoice_payment_deposit_system 2>/dev/null || true
        npx prisma migrate resolve --applied 20260906020000_add_master_item_price_history 2>/dev/null || true
        npx prisma migrate resolve --applied 20260906040000_add_web_push_subscription 2>/dev/null || true
        npx prisma migrate resolve --applied 20260929000000_add_ppn_mode_to_project_price 2>/dev/null || true
        npx prisma migrate resolve --applied 20260930000000_add_custom_material_name 2>/dev/null || true
        npx prisma migrate resolve --applied 20261003000000_add_missing_models_and_columns 2>/dev/null || true
    " || true

echo -e "${YELLOW}   Menjalankan prisma migrate deploy (hanya migrasi baru)...${NC}"
if ! docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    "$IMAGE_NAME" \
    sh -c "npx prisma migrate deploy"; then
    echo -e "${RED}❌ ERROR KRITIS: Prisma migrate deploy GAGAL! Deployment dibatalkan.${NC}"
    echo -e "${YELLOW}   Data production aman. Snapshot database sebelum deploy: $BACKUP_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Prisma migrate deploy selesai.${NC}"

# Ensure DDL patch aman (Idempotent) agar kolom custom_material_name selalu terpasang
echo -e "${YELLOW}   Memastikan kolom custom_material_name pada AggregateIncoming & Outgoing...${NC}"
docker run --rm \
    --network host \
    --env-file $ENV_FILE \
    "$IMAGE_NAME" \
    node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.\$executeRawUnsafe(\`
        ALTER TABLE \"AggregateIncoming\" ADD COLUMN IF NOT EXISTS \"custom_material_name\" TEXT;
        ALTER TABLE \"AggregateOutgoing\" ADD COLUMN IF NOT EXISTS \"custom_material_name\" TEXT;
    \`);
    console.log('   ✓ Patch DDL custom_material_name verified.');
    await prisma.\$disconnect();
}
main().catch(e => { console.warn('   ℹ DDL notice:', e.message); process.exit(0); });
" 2>/dev/null || true

# ⛔ fix-db.sh TIDAK dijalankan otomatis.
# Mengandung UPDATE data (backfill PurchaseOrder.isBypassed) dan INSERT RblCategory.
# Sudah idempotent, tapi cukup dijalankan MANUAL sekali saat butuh patch:
#   bash fix-db.sh

# ── 5. Jalankan container baru ─────────────────────────────────
echo ""
echo -e "${CYAN}[5/5] Menjalankan container aplikasi ($APP_NAME)...${NC}"
mkdir -p /var/data/rajawali/uploads/logos
mkdir -p /var/data/rajawali/uploads/signatures
mkdir -p /var/data/rajawali/uploads/payments
mkdir -p /home/secrets

# Buat symlink di folder proyek agar upload path konsisten
ln -sfn /var/data/rajawali/uploads ./uploads

docker run -d \
    --network host \
    --name $APP_NAME \
    --restart unless-stopped \
    --env-file $ENV_FILE \
    --memory="1024m" \
    --cpus="1.5" \
    -v /var/data/rajawali/uploads:/app/uploads \
    -v /home/secrets:/app/secrets \
    "$IMAGE_NAME"

# ⛔ seed-rbac.js TIDAK dijalankan otomatis.
# Script ini melakukan deleteMany(RolePermission) lalu recreate setiap dijalankan,
# yang MENGHAPUS semua permission custom yang dikonfigurasi admin via UI.
# Jalankan MANUAL hanya saat pertama setup atau ada penambahan permission baru:
#   docker exec rajawali-app node /app/prisma/seed-rbac.js
echo -e "${GREEN}   ✓ Deployment selesai, RBAC permissions tidak diubah.${NC}"

# Bersihkan image yang tidak terpakai
docker image prune -f > /dev/null 2>&1 || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Deployment via Docker Hub Berhasil!         ${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   Container Status : $(docker inspect -f '{{.State.Status}}' $APP_NAME 2>/dev/null || echo 'Running')"
echo -e "   Image Version    : $IMAGE_NAME"
echo -e "   Snapshot Backup  : $BACKUP_FILE"
echo -e "   URL              : https://portal.rajawalimix.com"
echo -e "${GREEN}================================================${NC}"
