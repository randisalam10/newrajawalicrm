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

-- 13. MasterItemPriceHistory (Tabel & Riwayat Harga)
CREATE TABLE IF NOT EXISTS "MasterItemPriceHistory" (
    "id" TEXT NOT NULL,
    "masterItemId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "priceDiff" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MasterItemPriceHistory_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    ALTER TABLE "MasterItemPriceHistory" ADD CONSTRAINT "MasterItemPriceHistory_masterItemId_fkey" FOREIGN KEY ("masterItemId") REFERENCES "MasterItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MasterItemPriceHistory" ADD CONSTRAINT "MasterItemPriceHistory_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "MasterItemPriceHistory_masterItemId_idx" ON "MasterItemPriceHistory"("masterItemId");
CREATE INDEX IF NOT EXISTS "MasterItemPriceHistory_effectiveDate_idx" ON "MasterItemPriceHistory"("effectiveDate");

-- Backfill initial baseline price history
INSERT INTO "MasterItemPriceHistory" ("id", "masterItemId", "oldPrice", "newPrice", "priceDiff", "percentage", "effectiveDate", "reason", "createdAt")
SELECT 
    gen_random_uuid()::TEXT,
    m."id",
    0,
    m."harga",
    m."harga",
    0,
    m."createdAt",
    'Harga awal pendaftaran barang',
    m."createdAt"
FROM "MasterItem" m
WHERE NOT EXISTS (
    SELECT 1 FROM "MasterItemPriceHistory" h WHERE h."masterItemId" = m."id"
);

-- 9. PO Approval & Signature Schema Updates
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "Position" ADD VALUE IF NOT EXISTS 'Approver';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "submittedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpSignatureUrl" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpNotes" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoSignatureUrl" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoNotes" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedById" TEXT;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "PurchaseOrder_submittedAt_idx" ON "PurchaseOrder"("submittedAt");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_submittedAt_idx" ON "PurchaseOrder"("status", "submittedAt");

-- 14. WebPushSubscription (Tabel Notifikasi Browser Web Push)
CREATE TABLE IF NOT EXISTS "WebPushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebPushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WebPushSubscription_endpoint_key" ON "WebPushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "WebPushSubscription_userId_idx" ON "WebPushSubscription"("userId");

-- 15. RblCategory & RblExpense Vehicle Tracking
CREATE TABLE IF NOT EXISTS "RblCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requireVehicleKm" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RblCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RblCategory_name_key" ON "RblCategory"("name");

ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "RblExpense" ADD COLUMN IF NOT EXISTS "kmMeter" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "RblExpense_categoryId_idx" ON "RblExpense"("categoryId");
CREATE INDEX IF NOT EXISTS "RblExpense_vehicleId_idx" ON "RblExpense"("vehicleId");

DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RblCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RblExpense" ADD CONSTRAINT "RblExpense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 16. VehicleCategory & Dump Truck Specs
CREATE TABLE IF NOT EXISTS "VehicleCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VehicleCategory_name_key" ON "VehicleCategory"("name");

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "capacity_cubic" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "Vehicle_categoryId_idx" ON "Vehicle"("categoryId");

DO $$ BEGIN
    ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 17. AggregateIncoming Dump Truck Link & AggregateRetaseSetting
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "driverId" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "dump_truck_size" TEXT;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "distance_km" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "rate_price" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "retase_amount" DOUBLE PRECISION;
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "is_retase_paid" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "AggregateIncoming_vehicleId_idx" ON "AggregateIncoming"("vehicleId");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_driverId_idx" ON "AggregateIncoming"("driverId");

DO $$ BEGIN
    ALTER TABLE "AggregateIncoming" ADD CONSTRAINT "AggregateIncoming_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AggregateIncoming" ADD CONSTRAINT "AggregateIncoming_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "AggregateRetaseSetting" (
    "id" TEXT NOT NULL,
    "price_dt_besar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_dt_kecil" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "default_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AggregateRetaseSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AggregateRetaseSetting_locationId_key" ON "AggregateRetaseSetting"("locationId");

DO $$ BEGIN
    ALTER TABLE "AggregateRetaseSetting" ADD CONSTRAINT "AggregateRetaseSetting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 18. Sewa Alat / Kendaraan & Vehicle Meter Updates
CREATE TABLE IF NOT EXISTS "DriverCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DriverCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DriverCategory_name_key" ON "DriverCategory"("name");

ALTER TABLE "Employee" ADD COLUMN IF NOT EXISTS "driverCategoryId" TEXT;
CREATE INDEX IF NOT EXISTS "Employee_driverCategoryId_idx" ON "Employee"("driverCategoryId");
DO $$ BEGIN
    ALTER TABLE "Employee" ADD CONSTRAINT "Employee_driverCategoryId_fkey" FOREIGN KEY ("driverCategoryId") REFERENCES "DriverCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "meter_type" TEXT DEFAULT 'KM';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "merk_model" TEXT;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "is_for_rent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "default_day_rate" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "rental_status" TEXT DEFAULT 'Tersedia';
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "rental_notes" TEXT;
CREATE INDEX IF NOT EXISTS "Vehicle_is_for_rent_idx" ON "Vehicle"("is_for_rent");

CREATE TABLE IF NOT EXISTS "MasterSewaAlat" (
    "id" TEXT NOT NULL,
    "kode_alat" TEXT NOT NULL,
    "nama_alat" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "merk_model" TEXT,
    "nomor_seri_plat" TEXT,
    "default_day_rate" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Tersedia',
    "keterangan" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MasterSewaAlat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MasterSewaAlat_kode_alat_key" ON "MasterSewaAlat"("kode_alat");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_locationId_idx" ON "MasterSewaAlat"("locationId");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_kategori_idx" ON "MasterSewaAlat"("kategori");
CREATE INDEX IF NOT EXISTS "MasterSewaAlat_status_idx" ON "MasterSewaAlat"("status");
DO $$ BEGIN
    ALTER TABLE "MasterSewaAlat" ADD CONSTRAINT "MasterSewaAlat_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "SewaTransaction" (
    "id" TEXT NOT NULL,
    "sewa_number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "lokasi_proyek" TEXT,
    "equipmentId" TEXT,
    "vehicleId" TEXT,
    "operatorId" TEXT NOT NULL,
    "date_mode" TEXT NOT NULL DEFAULT 'RANGE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rental_dates" TEXT NOT NULL,
    "total_days" INTEGER NOT NULL,
    "price_per_day" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SewaTransaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SewaTransaction_sewa_number_key" ON "SewaTransaction"("sewa_number");
CREATE INDEX IF NOT EXISTS "SewaTransaction_date_idx" ON "SewaTransaction"("date");
CREATE INDEX IF NOT EXISTS "SewaTransaction_locationId_date_idx" ON "SewaTransaction"("locationId", "date");
CREATE INDEX IF NOT EXISTS "SewaTransaction_customerId_idx" ON "SewaTransaction"("customerId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_equipmentId_idx" ON "SewaTransaction"("equipmentId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_vehicleId_idx" ON "SewaTransaction"("vehicleId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_operatorId_idx" ON "SewaTransaction"("operatorId");
CREATE INDEX IF NOT EXISTS "SewaTransaction_status_idx" ON "SewaTransaction"("status");

DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "MasterSewaAlat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN
    ALTER TABLE "SewaTransaction" ADD CONSTRAINT "SewaTransaction_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Invoice" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoice_type" TEXT NOT NULL DEFAULT 'READYMIX';
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
DO $$ BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

UPDATE "Invoice" i
SET "customerId" = p."customerId"
FROM "Project" p
WHERE i."projectId" = p.id AND i."customerId" IS NULL;

ALTER TABLE "InvoiceItem" ALTER COLUMN "transactionId" DROP NOT NULL;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "sewaTransactionId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "item_type" TEXT NOT NULL DEFAULT 'READYMIX';
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceItem_sewaTransactionId_key" ON "InvoiceItem"("sewaTransactionId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_sewaTransactionId_idx" ON "InvoiceItem"("sewaTransactionId");
DO $$ BEGIN
    ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_sewaTransactionId_fkey" FOREIGN KEY ("sewaTransactionId") REFERENCES "SewaTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
CREATE INDEX IF NOT EXISTS "PurchaseOrder_vehicleId_idx" ON "PurchaseOrder"("vehicleId");
DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "PoItem" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "PoItem" ADD COLUMN IF NOT EXISTS "km_hm" TEXT;
CREATE INDEX IF NOT EXISTS "PoItem_vehicleId_idx" ON "PoItem"("vehicleId");
DO $$ BEGIN
    ALTER TABLE "PoItem" ADD CONSTRAINT "PoItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
EOF
)

# Bersihkan parameter Prisma ?schema=... jika ada agar psql tidak komplain
CLEAN_DB_URL=""
if [ -n "$DB_URL" ]; then
    CLEAN_DB_URL=$(echo "$DB_URL" | sed -E 's/[?&]schema=[^&]*//g')
fi

# Prioritaskan koneksi lokal via user postgres (paling stabil & aman di host)
if sudo -u postgres psql -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "$SQL_COMMANDS" | sudo -u postgres psql -d "$DB_NAME"
elif [ -n "$CLEAN_DB_URL" ]; then
    echo "$SQL_COMMANDS" | psql "$CLEAN_DB_URL"
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
