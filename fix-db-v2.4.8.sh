#!/bin/bash
# ============================================================
# fix-db-v2.4.8.sh — Patch kolom custom_material_name pada
# AggregateIncoming & AggregateOutgoing
# Jalankan di server: bash fix-db-v2.4.8.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

APP_NAME="rajawali-app"
NEW_MIGRATION="20260930000000_add_custom_material_name"

echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN} Fix DB v2.4.8 — custom_material_name Support${NC}"
echo -e "${CYAN}================================================${NC}"

# ── 1. Apply kolom baru via node + PrismaClient raw SQL ───────
echo ""
echo -e "${CYAN}[1/4] Menambahkan kolom custom_material_name ke AggregateIncoming & AggregateOutgoing...${NC}"
docker exec "$APP_NAME" node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.\$executeRawUnsafe(\`
        ALTER TABLE \"AggregateIncoming\"
        ADD COLUMN IF NOT EXISTS \"custom_material_name\" TEXT;
    \`);
    console.log('+ Kolom AggregateIncoming.custom_material_name OK');

    await prisma.\$executeRawUnsafe(\`
        ALTER TABLE \"AggregateOutgoing\"
        ADD COLUMN IF NOT EXISTS \"custom_material_name\" TEXT;
    \`);
    console.log('+ Kolom AggregateOutgoing.custom_material_name OK');

    // Tandai migration sebagai sudah applied agar prisma migrate tidak konflik
    await prisma.\$executeRawUnsafe(\`
        INSERT INTO \"_prisma_migrations\"
            (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
            gen_random_uuid()::text,
            'manual-fix-v248',
            now(),
            '$NEW_MIGRATION',
            NULL,
            NULL,
            now(),
            1
        )
        ON CONFLICT (migration_name) DO NOTHING
    \`);
    console.log('+ Migration $NEW_MIGRATION tercatat di _prisma_migrations');

    await prisma.\$disconnect();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
" 2>&1

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Gagal apply SQL. Cek log error di atas.${NC}"
    exit 1
fi
echo -e "${GREEN}   ✓ Patch SQL kolom selesai.${NC}"

# ── 2. Prisma Generate ─────────────────────────────────────────
echo ""
echo -e "${CYAN}[2/4] Regenerate Prisma Client di container...${NC}"
docker exec "$APP_NAME" npx prisma generate
echo -e "${GREEN}   ✓ Prisma Client regenerated.${NC}"

# ── 3. Verifikasi kolom sudah ada ─────────────────────────────
echo ""
echo -e "${CYAN}[3/4] Verifikasi kolom di information_schema...${NC}"
docker exec "$APP_NAME" node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const resIn = await prisma.\$queryRawUnsafe(\`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'AggregateIncoming'
        AND column_name = 'custom_material_name'
    \`);

    const resOut = await prisma.\$queryRawUnsafe(\`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'AggregateOutgoing'
        AND column_name = 'custom_material_name'
    \`);

    if (resIn.length > 0 && resOut.length > 0) {
        console.log('✓ Kolom custom_material_name verified di AggregateIncoming & AggregateOutgoing');
    } else {
        console.log('Hasil cek: In:', JSON.stringify(resIn), 'Out:', JSON.stringify(resOut));
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
echo -e "${GREEN} ✅ Fix v2.4.8 Selesai!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   custom_material_name telah siap untuk input material bebas & multi-cabang."
echo -e "   Container: $STATUS"
echo -e "${GREEN}================================================${NC}"
