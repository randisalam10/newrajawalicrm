#!/bin/bash
# ============================================================
# diagnose.sh — Script Diagnostik Error Production
# Jalankan di server: bash diagnose.sh
# ============================================================

echo "=============================================="
echo " 🔍 Rajawali - Diagnostik Error Production"
echo "=============================================="

APP_NAME="rajawali-app"

echo ""
echo "1. Status Container:"
docker ps -a --filter "name=$APP_NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2. Log Error Terbaru (200 baris terakhir):"
docker logs --tail 200 $APP_NAME 2>&1 | grep -E "(Error|error|FATAL|fatal|Exception|unhandled|Cannot|Prisma|database|connect)" | head -50

echo ""
echo "3. Log Lengkap 100 Baris Terakhir:"
docker logs --tail 100 $APP_NAME 2>&1

echo ""
echo "4. Memory & CPU Usage:"
docker stats $APP_NAME --no-stream 2>/dev/null || echo "Container tidak running"

echo ""
echo "5. Cek Environment Variables Kritis:"
docker exec $APP_NAME env 2>/dev/null | grep -E "(DATABASE_URL|NEXTAUTH|FIREBASE|NODE_ENV)" | sed 's/DATABASE_URL=.*/DATABASE_URL=[HIDDEN]/' || echo "Container tidak running"

echo ""
echo "6. Test Koneksi Database dari Container:"
docker exec $APP_NAME node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => { console.log('✅ DB Connected OK'); p.\$disconnect(); })
  .catch(e => { console.error('❌ DB Error:', e.message); process.exit(1); });
" 2>&1 || echo "Gagal test DB"

echo ""
echo "=============================================="
echo " Selesai. Kirim output ini ke developer."
echo "=============================================="
