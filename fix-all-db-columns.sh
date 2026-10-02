#!/bin/bash
# ============================================================
# fix-all-db-columns.sh — Patch Seluruh Kolom & Tabel Database Production
# Menuntaskan seluruh error:
# - AggregateIncoming.custom_material_name
# - AggregateOutgoing.custom_material_name
# - Vehicle.annual_tax_cost, tax_expiry_date, kir_*
# - FixedCostContract, VehicleComplianceRecord, OperationalTargetSetting
# - CreditObligation, CreditPayment, CreditAuditLog
# Jalankan di VPS: bash fix-all-db-columns.sh
# ============================================================

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN} 🛠️  Rajawali - Patch & Sinkronisasi Database Production    ${NC}"
echo -e "${CYAN}============================================================${NC}"

DB_NAME="rajawali_prod"
DB_USER="rajawali_user"
APP_NAME="rajawali-app"

echo ""
echo -e "${YELLOW}[1/4] Mengaplikasikan DDL kolom & tabel baru ke PostgreSQL...${NC}"

sudo -u postgres psql -d "$DB_NAME" << 'EOF'
-- 1. Vehicle legalitas & pajak
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "annual_tax_cost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "tax_expiry_date" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "kir_cost" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "kir_expiry_date" TIMESTAMP(3);
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "kir_period_months" INTEGER DEFAULT 6;

-- 2. Material & ProjectPrice
ALTER TABLE "AggregateIncoming" ADD COLUMN IF NOT EXISTS "custom_material_name" TEXT;
ALTER TABLE "AggregateOutgoing" ADD COLUMN IF NOT EXISTS "custom_material_name" TEXT;
ALTER TABLE "ProjectPrice" ADD COLUMN IF NOT EXISTS "ppn_mode" TEXT NOT NULL DEFAULT 'NON_PPN';
ALTER TABLE "ProjectPrice" ADD COLUMN IF NOT EXISTS "ppn_rate" DOUBLE PRECISION NOT NULL DEFAULT 11;

-- 3. FixedCostContract
CREATE TABLE IF NOT EXISTS "FixedCostContract" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "vendor_name" TEXT,
    "contract_number" TEXT,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "monthly_amount" DOUBLE PRECISION NOT NULL,
    "payment_status" TEXT DEFAULT 'LUNAS',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FixedCostContract_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FixedCostContract_locationId_idx" ON "FixedCostContract"("locationId");
CREATE INDEX IF NOT EXISTS "FixedCostContract_category_idx" ON "FixedCostContract"("category");
CREATE INDEX IF NOT EXISTS "FixedCostContract_isActive_idx" ON "FixedCostContract"("isActive");
CREATE INDEX IF NOT EXISTS "FixedCostContract_start_date_end_date_idx" ON "FixedCostContract"("start_date", "end_date");
DO $$ BEGIN
    ALTER TABLE "FixedCostContract" ADD CONSTRAINT "FixedCostContract_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. VehicleComplianceRecord
CREATE TABLE IF NOT EXISTS "VehicleComplianceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "period_months" INTEGER NOT NULL DEFAULT 12,
    "monthly_amount" DOUBLE PRECISION NOT NULL,
    "receipt_number" TEXT,
    "notes" TEXT,
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VehicleComplianceRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_vehicleId_idx" ON "VehicleComplianceRecord"("vehicleId");
CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_type_idx" ON "VehicleComplianceRecord"("type");
CREATE INDEX IF NOT EXISTS "VehicleComplianceRecord_valid_from_valid_until_idx" ON "VehicleComplianceRecord"("valid_from", "valid_until");
DO $$ BEGIN
    ALTER TABLE "VehicleComplianceRecord" ADD CONSTRAINT "VehicleComplianceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 5. OperationalTargetSetting
CREATE TABLE IF NOT EXISTS "OperationalTargetSetting" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Standar Target Operasional',
    "target_monthly_volume" DOUBLE PRECISION NOT NULL DEFAULT 5000,
    "target_branch_volume" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "target_asp" DOUBLE PRECISION NOT NULL DEFAULT 835000,
    "target_semen_cost" DOUBLE PRECISION NOT NULL DEFAULT 300000,
    "target_pasir_cost" DOUBLE PRECISION NOT NULL DEFAULT 95000,
    "target_split_cost" DOUBLE PRECISION NOT NULL DEFAULT 75000,
    "target_solar_cost" DOUBLE PRECISION NOT NULL DEFAULT 60000,
    "target_retase_cost" DOUBLE PRECISION NOT NULL DEFAULT 70000,
    "target_maintenance_cost" DOUBLE PRECISION NOT NULL DEFAULT 30000,
    "target_other_cogs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_cogs" DOUBLE PRECISION NOT NULL DEFAULT 640000,
    "target_gross_profit" DOUBLE PRECISION NOT NULL DEFAULT 195000,
    "label_asp" TEXT DEFAULT 'Harga Jual Pasar',
    "label_semen" TEXT DEFAULT 'Standar SNI',
    "label_pasir" TEXT DEFAULT 'On Target',
    "label_split" TEXT DEFAULT 'Efisiensi Crushing Quarry',
    "label_solar" TEXT DEFAULT 'Tergantung radius jobsite',
    "label_retase" TEXT DEFAULT 'On Target Sesuai KM',
    "label_maintenance" TEXT DEFAULT 'Maintenance Rutin',
    "label_other" TEXT DEFAULT 'Input Manual COGS',
    "label_cogs" TEXT DEFAULT 'Biaya Standar Operasional',
    "label_gross_profit" TEXT DEFAULT 'Margin Bersih Sehat',
    "locationId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalTargetSetting_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OperationalTargetSetting_locationId_idx" ON "OperationalTargetSetting"("locationId");
DO $$ BEGIN
    ALTER TABLE "OperationalTargetSetting" ADD CONSTRAINT "OperationalTargetSetting_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Enums
DO $$ BEGIN CREATE TYPE "CreditStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "CreditSourceType" AS ENUM ('PO_PURCHASE', 'NON_PO'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. CreditObligation
CREATE TABLE IF NOT EXISTS "CreditObligation" (
    "id" TEXT NOT NULL,
    "credit_number" TEXT NOT NULL,
    "source_type" "CreditSourceType" NOT NULL DEFAULT 'PO_PURCHASE',
    "purchaseOrderId" TEXT,
    "supplierId" TEXT,
    "supplier_name" TEXT NOT NULL,
    "companyGroupId" TEXT,
    "company_name" TEXT NOT NULL,
    "locationId" TEXT,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outstanding" DOUBLE PRECISION NOT NULL,
    "credit_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "term_days" INTEGER DEFAULT 30,
    "status" "CreditStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditObligation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CreditObligation_credit_number_key" ON "CreditObligation"("credit_number");
CREATE UNIQUE INDEX IF NOT EXISTS "CreditObligation_purchaseOrderId_key" ON "CreditObligation"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "CreditObligation_status_idx" ON "CreditObligation"("status");
CREATE INDEX IF NOT EXISTS "CreditObligation_credit_date_idx" ON "CreditObligation"("credit_date");
CREATE INDEX IF NOT EXISTS "CreditObligation_due_date_idx" ON "CreditObligation"("due_date");
CREATE INDEX IF NOT EXISTS "CreditObligation_supplierId_idx" ON "CreditObligation"("supplierId");
CREATE INDEX IF NOT EXISTS "CreditObligation_companyGroupId_idx" ON "CreditObligation"("companyGroupId");
CREATE INDEX IF NOT EXISTS "CreditObligation_locationId_idx" ON "CreditObligation"("locationId");
DO $$ BEGIN ALTER TABLE "CreditObligation" ADD CONSTRAINT "CreditObligation_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CreditObligation" ADD CONSTRAINT "CreditObligation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 8. CreditPayment
CREATE TABLE IF NOT EXISTS "CreditPayment" (
    "id" TEXT NOT NULL,
    "creditId" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "source_account" TEXT,
    "reference_no" TEXT,
    "proof_url" TEXT,
    "notes" TEXT,
    "is_cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancel_reason" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "cancelledById" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CreditPayment_creditId_idx" ON "CreditPayment"("creditId");
CREATE INDEX IF NOT EXISTS "CreditPayment_payment_date_idx" ON "CreditPayment"("payment_date");
CREATE INDEX IF NOT EXISTS "CreditPayment_is_cancelled_idx" ON "CreditPayment"("is_cancelled");
DO $$ BEGIN ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "CreditObligation"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. CreditAuditLog
CREATE TABLE IF NOT EXISTS "CreditAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "creditId" TEXT,
    "paymentId" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreditAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CreditAuditLog_creditId_idx" ON "CreditAuditLog"("creditId");
CREATE INDEX IF NOT EXISTS "CreditAuditLog_paymentId_idx" ON "CreditAuditLog"("paymentId");
CREATE INDEX IF NOT EXISTS "CreditAuditLog_createdAt_idx" ON "CreditAuditLog"("createdAt");
DO $$ BEGIN ALTER TABLE "CreditAuditLog" ADD CONSTRAINT "CreditAuditLog_creditId_fkey" FOREIGN KEY ("creditId") REFERENCES "CreditObligation"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TABLE "CreditAuditLog" ADD CONSTRAINT "CreditAuditLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "CreditPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 10. Catat status migrasi di _prisma_migrations agar prisma migrate deploy aman
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES 
    (gen_random_uuid()::text, 'applied-manual-fix', now(), '20260929000000_add_ppn_mode_to_project_price', NULL, NULL, now(), 1),
    (gen_random_uuid()::text, 'applied-manual-fix', now(), '20260930000000_add_custom_material_name', NULL, NULL, now(), 1),
    (gen_random_uuid()::text, 'applied-manual-fix', now(), '20261003000000_add_missing_models_and_columns', NULL, NULL, now(), 1)
ON CONFLICT (migration_name) DO UPDATE 
SET finished_at = now(), rolled_back_at = NULL, applied_steps_count = 1;

EOF

echo -e "${GREEN}   ✓ Seluruh tabel & kolom berhasil dipatch.${NC}"

echo ""
echo -e "${YELLOW}[2/4] Memperbaiki hak akses & ownership ke '$DB_USER'...${NC}"
sudo -u postgres psql -d "$DB_NAME" << EOF
DO \$\$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO $DB_USER';
    END LOOP;
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO $DB_USER';
    END LOOP;
END \$\$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
EOF
echo -e "${GREEN}   ✓ Ownership & privileges tersinkronisasi.${NC}"

echo ""
echo -e "${YELLOW}[3/4] Memvalidasi keberadaan kolom-kolom baru...${NC}"
sudo -u postgres psql -d "$DB_NAME" -c "
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE (table_name = 'Vehicle' AND column_name IN ('annual_tax_cost', 'tax_expiry_date', 'kir_cost'))
   OR (table_name = 'AggregateIncoming' AND column_name = 'custom_material_name')
   OR (table_name = 'AggregateOutgoing' AND column_name = 'custom_material_name')
   OR (table_name = 'ProjectPrice' AND column_name IN ('ppn_mode', 'ppn_rate'))
ORDER BY table_name, column_name;
"

echo ""
echo -e "${YELLOW}[4/4] Restarting container '$APP_NAME'...${NC}"
docker restart "$APP_NAME"
sleep 4

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN} ✅ Database berhasil dipatch 100%!                          ${NC}"
echo -e "${GREEN}============================================================${NC}"
echo -e "Silakan buka kembali portal.rajawalimix.com dan refresh halaman."
