#!/bin/bash
# ============================================================
# reset-transactions.sh — Hapus semua data transaksi production
# Jalankan di server: bash scripts/reset-transactions.sh
# ============================================================

set -e

ENV_FILE="${1:-.env.production}"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ⚠️  RESET DATA TRANSAKSI PRODUCTION DATABASE ⚠️    ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Aksi ini TIDAK BISA DIBATALKAN!                     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Check env file ──
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE tidak ditemukan!"
    echo "   Usage: bash scripts/reset-transactions.sh [path-ke-env]"
    exit 1
fi

# ── Load env vars dari file (handles special chars dengan benar) ──
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL tidak ditemukan di $ENV_FILE"
    exit 1
fi

# Strip Prisma-specific query params yang tidak dimengerti psql
# Contoh: ?schema=public&connection_limit=5 → dihapus
PSQL_URL=$(echo "$DATABASE_URL" | sed 's/?.*//')

# ── Check psql tersedia ──
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql tidak terinstall."
    echo "   Install dengan: sudo apt-get install -y postgresql-client"
    exit 1
fi

# ── Test koneksi DB ──
echo "🔌 Mengecek koneksi database..."
if ! psql "$PSQL_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Gagal koneksi ke database. Cek DATABASE_URL di $ENV_FILE"
    exit 1
fi
echo "   ✓ Koneksi berhasil"
echo ""

# ── Tampilkan jumlah data SEBELUM ──
echo "📊 Jumlah data SEBELUM reset:"
psql "$PSQL_URL" --no-psqlrc -t -A -F '|' << 'EOF'
SELECT 'ProductionTransaction' AS tabel, COUNT(*) AS jumlah FROM "ProductionTransaction"
UNION ALL SELECT 'Invoice',          COUNT(*) FROM "Invoice"
UNION ALL SELECT 'Payment',          COUNT(*) FROM "Payment"
UNION ALL SELECT 'BillingLog',       COUNT(*) FROM "BillingLog"
UNION ALL SELECT 'Deposit',          COUNT(*) FROM "Deposit"
UNION ALL SELECT 'Retase',           COUNT(*) FROM "Retase"
UNION ALL SELECT 'AuditLog',         COUNT(*) FROM "AuditLog"
UNION ALL SELECT 'ConcretePlan',     COUNT(*) FROM "ConcretePlan"
UNION ALL SELECT 'MaterialIncoming', COUNT(*) FROM "MaterialIncoming"
UNION ALL SELECT 'AggregateIncoming',COUNT(*) FROM "AggregateIncoming";
EOF

echo ""

# ── Konfirmasi backup ──
read -p "💾 Sudah backup database? (ketik 'ya' untuk lanjut): " CONFIRM_BACKUP
if [ "$CONFIRM_BACKUP" != "ya" ]; then
    echo ""
    echo "Backup dulu dengan:"
    echo "  pg_dump \"$PSQL_URL\" > backup_$(date +%Y%m%d_%H%M%S).sql"
    echo "Dibatalkan."
    exit 1
fi

# ── Konfirmasi typed phrase ──
echo ""
read -p "🔐 Ketik  RESET TRANSAKSI  untuk melanjutkan: " CONFIRM_RESET
if [ "$CONFIRM_RESET" != "RESET TRANSAKSI" ]; then
    echo "❌ Konfirmasi salah. Dibatalkan."
    exit 1
fi

echo ""
read -p "⚠️  Terakhir — ketik  HAPUS  untuk eksekusi: " CONFIRM_FINAL
if [ "$CONFIRM_FINAL" != "HAPUS" ]; then
    echo "❌ Dibatalkan."
    exit 1
fi

echo ""
echo "🗑️  Menghapus data transaksi..."

# ── Tulis SQL ke file temp ──
SQL_FILE=$(mktemp /tmp/reset_transactions_XXXXXX.sql)

cat > "$SQL_FILE" << 'ENDSQL'
BEGIN;

-- Urutan sesuai foreign key constraint

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

COMMIT;
ENDSQL

# ── Eksekusi SQL ──
psql "$PSQL_URL" -f "$SQL_FILE"

# ── Hapus temp file ──
rm -f "$SQL_FILE"

echo ""
echo "📊 Verifikasi jumlah data SETELAH reset:"
psql "$PSQL_URL" --no-psqlrc -t -A -F '|' << 'EOF'
SELECT 'ProductionTransaction' AS tabel, COUNT(*) AS jumlah FROM "ProductionTransaction"
UNION ALL SELECT 'Invoice',          COUNT(*) FROM "Invoice"
UNION ALL SELECT 'Payment',          COUNT(*) FROM "Payment"
UNION ALL SELECT 'BillingLog',       COUNT(*) FROM "BillingLog"
UNION ALL SELECT 'Deposit',          COUNT(*) FROM "Deposit"
UNION ALL SELECT 'Retase',           COUNT(*) FROM "Retase"
UNION ALL SELECT 'AuditLog',         COUNT(*) FROM "AuditLog"
UNION ALL SELECT 'ConcretePlan',     COUNT(*) FROM "ConcretePlan"
UNION ALL SELECT 'MaterialIncoming', COUNT(*) FROM "MaterialIncoming"
UNION ALL SELECT 'AggregateIncoming',COUNT(*) FROM "AggregateIncoming";
EOF

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ Reset selesai!                                  ║"
echo "║   Semua angka di atas harus 0.                       ║"
echo "║   Master data (karyawan, user, dll) tetap ada.       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
