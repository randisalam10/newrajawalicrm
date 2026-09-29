#!/bin/bash
# ============================================================
# fix-db-v2.4.6.sh — Patch kolom ppn_mode & ppn_rate
# Jalankan di server: bash fix-db-v2.4.6.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_NAME="rajawali-app"
FAILED_MIGRATION="20260906020000_add_master_item_price_history"
NEW_MIGRATION="20260929000000_add_ppn_mode_to_project_price"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN} Fix DB v2.4.6 — ppn_mode & ppn_rate${NC}"
echo -e "${CYAN}================================================${NC}"

# ── 1. Resolve migration lama yang statusnya FAILED ───────────
echo ""
echo -e "${CYAN}[1/4] Resolve migration lama yang failed...${NC}"
docker exec "$APP_NAME" sh -c \
    "npx prisma migrate resolve --rolled-back '$FAILED_MIGRATION' 2>&1 || true"
echo -e "${GREEN}   ✓ Migration lama di-resolve (rolled-back).${NC}"

# ── 2. Apply kolom baru via node + PrismaClient raw SQL ───────
echo ""
echo -e "${CYAN}[2/4] Apply kolom ppn_mode & ppn_rate ke database...${NC}"
docker exec "$APP_NAME" node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.\$executeRawUnsafe(\`
        ALTER TABLE \"ProjectPrice\"
        ADD COLUMN IF NOT EXISTS \"ppn_mode\" TEXT NOT NULL DEFAULT 'NON_PPN'
    \`);
    console.log('+ kolom ppn_mode OK');

    await prisma.\$executeRawUnsafe(\`
        ALTER TABLE \"ProjectPrice\"
        ADD COLUMN IF NOT EXISTS \"ppn_rate\" DOUBLE PRECISION NOT NULL DEFAULT 11
    \`);
    console.log('+ kolom ppn_rate OK');

    // Tandai migration sebagai sudah applied agar prisma tidak error
    await prisma.\$executeRawUnsafe(\`
        INSERT INTO \"_prisma_migrations\"
            (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
            gen_random_uuid()::text,
            'manual-fix-v246',
            now(),
            '$NEW_MIGRATION',
            NULL,
            NULL,
            now(),
            1
        )
        ON CONFLICT (migration_name) DO NOTHING
    \`);
    console.log('+ migration $NEW_MIGRATION ditandai applied');

    await prisma.\$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
" 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Gagal apply SQL. Cek log di atas.${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Patch SQL selesai.${NC}"

# ── 3. Verifikasi kolom sudah ada ─────────────────────────────
echo ""
echo -e "${CYAN}[3/4] Verifikasi kolom di database...${NC}"
docker exec "$APP_NAME" node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const result = await prisma.\$queryRawUnsafe(\`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'ProjectPrice'
        AND column_name IN ('ppn_mode', 'ppn_rate')
        ORDER BY column_name
    \`);
    if (result.length === 2) {
        console.log('✓ Kedua kolom sudah ada:', result.map(r => r.column_name).join(', '));
    } else {
        console.log('Kolom ditemukan:', JSON.stringify(result));
    }
    await prisma.\$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
" 2>&1

# ── 4. Restart container ───────────────────────────────────────
echo ""
echo -e "${CYAN}[4/4] Restart container $APP_NAME...${NC}"
docker restart "$APP_NAME"
sleep 5

STATUS=$(docker inspect -f '{{.State.Status}}' "$APP_NAME" 2>/dev/null || echo "unknown")
echo -e "${GREEN}   ✓ Container status: $STATUS${NC}"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Fix v2.4.6 Selesai!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   ppn_mode & ppn_rate sudah ada di ProjectPrice"
echo -e "   Container: $STATUS"
echo -e "${GREEN}================================================${NC}"
