#!/bin/bash
# ============================================================
# diagnose.sh — Script Diagnostik Error Production
# Jalankan di server: bash diagnose.sh
# ============================================================

echo "=============================================="
echo " 🔍 Rajawali - Diagnostik Error Production"
echo "=============================================="

APP_NAME="rajawali-app"
ENV_FILE=".env.production"
[ ! -f "$ENV_FILE" ] && ENV_FILE=".env"

echo ""
echo "1. Status Container:"
docker ps -a --filter "name=$APP_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2. Log Error Terbaru:"
docker logs --tail 200 $APP_NAME 2>&1 | grep -E "(Error|error|FATAL|fatal|Exception|unhandled|Cannot|Prisma|database|connect)" | head -50

echo ""
echo "3. Memory & CPU Usage:"
docker stats $APP_NAME --no-stream 2>/dev/null || echo "Container tidak running"

echo ""
echo "4. Cek Environment Variables Kritis:"
docker exec $APP_NAME env 2>/dev/null | grep -E "(DATABASE_URL|NEXTAUTH|FIREBASE|NODE_ENV)" | sed 's/DATABASE_URL=.*/DATABASE_URL=[HIDDEN]/' || echo "Container tidak running"

echo ""
echo "5. Test Koneksi Database:"
docker exec $APP_NAME node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => { console.log('✅ DB Connected OK'); p.\$disconnect(); })
  .catch(e => { console.error('❌ DB Error:', e.message); process.exit(1); });
" 2>&1 || echo "Gagal test DB"

echo ""
echo "6. Cek Koneksi Aktif PostgreSQL:"
DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
if [ -n "$DB_URL" ]; then
  docker run --rm --network host postgres:15-alpine psql "$DB_URL" -c \
    "SELECT count(*), state FROM pg_stat_activity GROUP BY state ORDER BY count DESC;" 2>/dev/null \
    || echo "Tidak bisa query pg_stat_activity"
  
  echo ""
  echo "7. Max Connections PostgreSQL:"
  docker run --rm --network host postgres:15-alpine psql "$DB_URL" -c \
    "SHOW max_connections;" 2>/dev/null \
    || echo "Tidak bisa query max_connections"
fi

echo ""
echo "=============================================="
echo " Selesai. Kirim output ini ke developer."
echo "=============================================="
