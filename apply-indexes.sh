#!/bin/bash
# ============================================================
# apply-indexes.sh — Penambahan Index Database PostgreSQL (Performance Booster)
# Aman, Non-Destructive (IF NOT EXISTS), Instan & 0 MB RAM Overhead.
#
# Cara menjalankan di VPS:
#   cd /home/new_rajawalimix/app
#   git pull origin main
#   bash apply-indexes.sh
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} ⚡ Mengoptimalkan Indexing Database PostgreSQL  ${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Tentukan target database
DB_NAME="rajawali_prod"
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

if [ -n "$ENV_FILE" ]; then
    DB_URL=$(grep -E "^DATABASE_URL=" "$ENV_FILE" | head -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi

echo -e "${CYAN}Menjalankan pembuatan index via native psql...${NC}"

# Eksekusi SQL
SQL_COMMANDS=$(cat << 'EOF'
-- 1. ProductionTransaction
CREATE INDEX IF NOT EXISTS "ProductionTransaction_date_idx" ON "ProductionTransaction"("date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_locationId_date_idx" ON "ProductionTransaction"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_projectId_idx" ON "ProductionTransaction"("projectId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_driverId_idx" ON "ProductionTransaction"("driverId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_status_idx" ON "ProductionTransaction"("status");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_vehicleId_idx" ON "ProductionTransaction"("vehicleId");

-- 2. MaterialIncoming
CREATE INDEX IF NOT EXISTS "MaterialIncoming_date_idx" ON "MaterialIncoming"("date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_locationId_date_idx" ON "MaterialIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_material_type_idx" ON "MaterialIncoming"("material_type");

-- 3. AggregateIncoming
CREATE INDEX IF NOT EXISTS "AggregateIncoming_date_idx" ON "AggregateIncoming"("date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_locationId_date_idx" ON "AggregateIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_aggregate_type_idx" ON "AggregateIncoming"("aggregate_type");

-- 4. Retase
CREATE INDEX IF NOT EXISTS "Retase_driverId_idx" ON "Retase"("driverId");

-- 5. AuditLog
CREATE INDEX IF NOT EXISTS "AuditLog_entity_recordId_idx" ON "AuditLog"("entity", "recordId");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- 6. Invoice
CREATE INDEX IF NOT EXISTS "Invoice_locationId_status_idx" ON "Invoice"("locationId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_issue_date_idx" ON "Invoice"("issue_date");
CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice"("projectId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");

-- 7. InvoiceItem
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- 8. Payment
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_payment_date_idx" ON "Payment"("payment_date");
CREATE INDEX IF NOT EXISTS "Payment_is_cancelled_idx" ON "Payment"("is_cancelled");

-- 9. Deposit
CREATE INDEX IF NOT EXISTS "Deposit_projectId_idx" ON "Deposit"("projectId");
CREATE INDEX IF NOT EXISTS "Deposit_date_idx" ON "Deposit"("date");

-- 10. BillingLog
CREATE INDEX IF NOT EXISTS "BillingLog_invoiceId_idx" ON "BillingLog"("invoiceId");
CREATE INDEX IF NOT EXISTS "BillingLog_paymentId_idx" ON "BillingLog"("paymentId");
CREATE INDEX IF NOT EXISTS "BillingLog_createdAt_idx" ON "BillingLog"("createdAt");

-- 11. ConcretePlan
CREATE INDEX IF NOT EXISTS "ConcretePlan_date_idx" ON "ConcretePlan"("date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_locationId_date_idx" ON "ConcretePlan"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_projectId_idx" ON "ConcretePlan"("projectId");
CREATE INDEX IF NOT EXISTS "ConcretePlan_status_idx" ON "ConcretePlan"("status");

-- 12. PurchaseOrder
CREATE INDEX IF NOT EXISTS "PurchaseOrder_locationId_idx" ON "PurchaseOrder"("locationId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_tanggal_terbit_idx" ON "PurchaseOrder"("status", "tanggal_terbit");
EOF
)

if [ -n "$DB_URL" ]; then
    echo "$SQL_COMMANDS" | psql "$DB_URL" || echo "$SQL_COMMANDS" | sudo -u postgres psql -d "$DB_NAME"
else
    echo "$SQL_COMMANDS" | sudo -u postgres psql -d "$DB_NAME"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Indexing Berhasil Diterapkan!               ${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "   Semua query tanggal, cabang, dan relasi transaksi"
echo -e "   sekarang berjalan dengan performa maksimal."
echo -e "${GREEN}================================================${NC}"
