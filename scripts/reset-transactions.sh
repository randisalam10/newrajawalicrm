#!/bin/bash
# ============================================================
# reset-transactions.sh
# Hapus SEMUA DATA TRANSAKSI dari database production.
#
# Yang DIHAPUS (transaksi):
#   - BillingLog, Payment, InvoiceItem, Invoice
#   - Deposit, Retase, ProductionTransaction
#   - AuditLog, ConcretePlan
#   - MaterialIncoming, AggregateIncoming
#
# Yang DIPERTAHANKAN (master data):
#   - User, Employee, Location
#   - Vehicle, Customer, Project, ProjectPrice
#   - ConcreteQuality, WorkItem, RetaseSetting
#
# JALANKAN DI SERVER: bash reset-transactions.sh
# ============================================================

set -e

ENV_FILE=".env.production"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ⚠️  RESET DATA TRANSAKSI PRODUCTION DATABASE ⚠️    ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Aksi ini TIDAK BISA DIBATALKAN!                     ║"
echo "║  Semua data transaksi akan dihapus permanen.         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Check env file ──
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE tidak ditemukan!"
    exit 1
fi

# ── Extract DATABASE_URL ──
DATABASE_URL=$(grep '^DATABASE_URL=' "$ENV_FILE" | cut -d'=' -f2- | tr -d '"')
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL tidak ditemukan di $ENV_FILE"
    exit 1
fi

echo "💾 STEP 1: Backup database terlebih dahulu (SANGAT DIANJURKAN)"
echo "   Jalankan ini jika belum backup:"
echo ""
echo "   pg_dump \"$DATABASE_URL\" > backup_before_reset_$(date +%Y%m%d_%H%M%S).sql"
echo ""
read -p "   Sudah backup? Lanjutkan? (ketik 'ya' untuk lanjut): " CONFIRM_BACKUP
if [ "$CONFIRM_BACKUP" != "ya" ]; then
    echo "❌ Dibatalkan. Silakan backup dulu."
    exit 1
fi

echo ""
echo "🔐 STEP 2: Konfirmasi penghapusan data"
echo "   Ketik persis  RESET TRANSAKSI  untuk melanjutkan:"
echo ""
read -p "   > " CONFIRM_RESET
if [ "$CONFIRM_RESET" != "RESET TRANSAKSI" ]; then
    echo "❌ Konfirmasi salah. Dibatalkan."
    exit 1
fi

echo ""
echo "📋 Data yang akan DIHAPUS:"
echo "   ✗ BillingLog    ✗ Payment         ✗ InvoiceItem"
echo "   ✗ Invoice       ✗ Deposit         ✗ Retase"
echo "   ✗ ProductionTransaction           ✗ AuditLog"
echo "   ✗ ConcretePlan  ✗ MaterialIncoming ✗ AggregateIncoming"
echo ""
echo "📋 Data yang DIPERTAHANKAN:"
echo "   ✓ User          ✓ Employee        ✓ Location"
echo "   ✓ Vehicle       ✓ Customer        ✓ Project"
echo "   ✓ ProjectPrice  ✓ ConcreteQuality ✓ WorkItem"
echo "   ✓ RetaseSetting"
echo ""
read -p "Lanjutkan penghapusan? (ketik 'HAPUS' untuk eksekusi): " CONFIRM_FINAL
if [ "$CONFIRM_FINAL" != "HAPUS" ]; then
    echo "❌ Dibatalkan."
    exit 1
fi

echo ""
echo "[1/2] Menjalankan DELETE SQL..."

# Gunakan docker container app untuk menjalankan psql via DATABASE_URL
docker run --rm \
    --network host \
    --env-file "$ENV_FILE" \
    --entrypoint sh \
    randisalam1007/rajawali-bp-erp:v1.0.9 \
    -c "npx prisma db execute --stdin --schema /app/prisma/schema.prisma" << 'ENDSQL'
-- ============================================================
-- Reset semua data transaksi (urutan sesuai Foreign Key)
-- ============================================================

-- 1. BillingLog (FK ke Invoice dan Payment)
DELETE FROM "BillingLog";

-- 2. Payment (FK ke Invoice)
DELETE FROM "Payment";

-- 3. InvoiceItem (FK ke Invoice dan ProductionTransaction)
DELETE FROM "InvoiceItem";

-- 4. Invoice (FK ke Project dan Location)
DELETE FROM "Invoice";

-- 5. Deposit (FK ke Project)
DELETE FROM "Deposit";

-- 6. Retase (FK ke ProductionTransaction dan Employee)
DELETE FROM "Retase";

-- 7. AuditLog (FK ke User)
DELETE FROM "AuditLog";

-- 8. ConcretePlan (FK ke Project, ConcreteQuality, WorkItem, Location)
DELETE FROM "ConcretePlan";

-- 9. ProductionTransaction (FK ke Vehicle, Employee, ConcreteQuality, WorkItem, Project, Location)
DELETE FROM "ProductionTransaction";

-- 10. MaterialIncoming (FK ke Location)
DELETE FROM "MaterialIncoming";

-- 11. AggregateIncoming (FK ke Location)
DELETE FROM "AggregateIncoming";

ENDSQL

echo "   ✓ Semua data transaksi berhasil dihapus"

echo ""
echo "[2/2] Verifikasi sisa data..."

docker run --rm \
    --network host \
    --env-file "$ENV_FILE" \
    --entrypoint sh \
    randisalam1007/rajawali-bp-erp:v1.0.9 \
    -c "npx prisma db execute --stdin --schema /app/prisma/schema.prisma" << 'ENDSQL2'
SELECT
    'User'                  AS tabel, COUNT(*) AS jumlah FROM "User"        UNION ALL
SELECT 'Employee',                              COUNT(*) FROM "Employee"     UNION ALL
SELECT 'Location',                              COUNT(*) FROM "Location"     UNION ALL
SELECT 'Customer',                              COUNT(*) FROM "Customer"     UNION ALL
SELECT 'Project',                               COUNT(*) FROM "Project"      UNION ALL
SELECT 'Vehicle',                               COUNT(*) FROM "Vehicle"      UNION ALL
SELECT 'ConcreteQuality',                       COUNT(*) FROM "ConcreteQuality" UNION ALL
SELECT 'WorkItem',                              COUNT(*) FROM "WorkItem"     UNION ALL
SELECT '--- TRANSAKSI ---',                     0                            UNION ALL
SELECT 'ProductionTransaction',                 COUNT(*) FROM "ProductionTransaction" UNION ALL
SELECT 'Invoice',                               COUNT(*) FROM "Invoice"      UNION ALL
SELECT 'Payment',                               COUNT(*) FROM "Payment"      UNION ALL
SELECT 'MaterialIncoming',                      COUNT(*) FROM "MaterialIncoming" UNION ALL
SELECT 'AggregateIncoming',                     COUNT(*) FROM "AggregateIncoming" UNION ALL
SELECT 'ConcretePlan',                          COUNT(*) FROM "ConcretePlan"
ORDER BY tabel;
ENDSQL2

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ Reset selesai!                                  ║"
echo "║   Data transaksi telah dihapus.                      ║"
echo "║   Master data (karyawan, user, dll) tetap ada.       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
