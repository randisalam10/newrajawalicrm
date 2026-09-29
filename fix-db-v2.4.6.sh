#!/bin/bash
# ============================================================
# fix-db-v2.4.6.sh — Patch kolom ppn_mode & ppn_rate
# Jalankan di server: bash fix-db-v2.4.6.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_NAME="rajawali-app"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN} Fix DB v2.4.6 — Add ppn_mode & ppn_rate${NC}"
echo -e "${CYAN}================================================${NC}"

# ── 1. Coba via prisma migrate deploy di dalam container ──────
echo ""
echo -e "${CYAN}[1/3] Menjalankan prisma migrate deploy...${NC}"
if docker exec "$APP_NAME" sh -c "npx prisma migrate deploy" 2>&1; then
    echo -e "${GREEN}   ✓ Prisma migrate deploy berhasil.${NC}"
else
    echo -e "${YELLOW}   ℹ Prisma migrate gagal atau sudah up-to-date, mencoba SQL manual...${NC}"

    # ── 2. Fallback: patch SQL langsung via psql ───────────────
    echo ""
    echo -e "${CYAN}[2/3] Menerapkan patch SQL manual ke database...${NC}"

    # Coba ambil DATABASE_URL dari env file atau container
    if [ -f ".env.production" ]; then
        DB_URL=$(grep -E "^DATABASE_URL=" .env.production | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    elif [ -f ".env" ]; then
        DB_URL=$(grep -E "^DATABASE_URL=" .env | head -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    fi

    SQL="
ALTER TABLE \"ProjectPrice\" ADD COLUMN IF NOT EXISTS \"ppn_mode\" TEXT NOT NULL DEFAULT 'NON_PPN';
ALTER TABLE \"ProjectPrice\" ADD COLUMN IF NOT EXISTS \"ppn_rate\" DOUBLE PRECISION NOT NULL DEFAULT 11;

-- Tandai migration sebagai sudah dijalankan agar prisma tidak error
INSERT INTO \"_prisma_migrations\" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual-patch-v2.4.6',
    now(),
    '20260929000000_add_ppn_mode_to_project_price',
    NULL,
    NULL,
    now(),
    1
) ON CONFLICT (migration_name) DO NOTHING;
"

    PATCHED=false

    # Coba via psql lokal
    if command -v psql &>/dev/null; then
        if sudo -u postgres psql rajawali_prod -c "$SQL" 2>/dev/null; then
            echo -e "${GREEN}   ✓ Patch SQL berhasil via psql lokal (rajawali_prod).${NC}"
            PATCHED=true
        elif sudo -u postgres psql rajawali_db -c "$SQL" 2>/dev/null; then
            echo -e "${GREEN}   ✓ Patch SQL berhasil via psql lokal (rajawali_db).${NC}"
            PATCHED=true
        fi
    fi

    # Coba via Docker + DATABASE_URL
    if [ "$PATCHED" = false ] && [ -n "$DB_URL" ]; then
        if docker run --rm --network host postgres:16-alpine \
            psql "$DB_URL" -c "$SQL" 2>/dev/null; then
            echo -e "${GREEN}   ✓ Patch SQL berhasil via container postgres.${NC}"
            PATCHED=true
        fi
    fi

    if [ "$PATCHED" = false ]; then
        echo -e "${RED}❌ Tidak bisa terhubung ke database. Jalankan SQL ini secara manual:${NC}"
        echo ""
        echo "ALTER TABLE \"ProjectPrice\" ADD COLUMN IF NOT EXISTS \"ppn_mode\" TEXT NOT NULL DEFAULT 'NON_PPN';"
        echo "ALTER TABLE \"ProjectPrice\" ADD COLUMN IF NOT EXISTS \"ppn_rate\" DOUBLE PRECISION NOT NULL DEFAULT 11;"
        echo ""
        exit 1
    fi
fi

# ── 3. Restart container ───────────────────────────────────────
echo ""
echo -e "${CYAN}[3/3] Restart container $APP_NAME...${NC}"
docker restart "$APP_NAME"
sleep 4

STATUS=$(docker inspect -f '{{.State.Status}}' "$APP_NAME" 2>/dev/null || echo "unknown")
echo -e "${GREEN}   ✓ Container status: $STATUS${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Fix v2.4.6 Selesai!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   Kolom ppn_mode & ppn_rate sudah ada di ProjectPrice"
echo -e "   Container: $STATUS"
echo -e "${GREEN}================================================${NC}"
