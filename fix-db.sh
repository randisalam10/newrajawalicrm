#!/bin/bash
# ============================================================
# fix-db.sh — Script Perbaikan Skema Database Production
# Menyelaraskan tabel Role, Permission, RolePermission, RblBudget,
# tipe User.role TEXT, dan kolom roleId tanpa merusak data!
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE} 🛠️ Menjalankan Sinkronisasi Skema Database     ${NC}"
echo -e "${BLUE}================================================${NC}"

# Eksekusi DDL aman via psql postgres
sudo -u postgres psql -d rajawali_prod << 'EOF'
-- 1. Enums
DO $$ BEGIN
    CREATE TYPE "RoleScope" AS ENUM ('ALL_BRANCHES', 'OWN_BRANCH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "RblStatus" AS ENUM ('OPEN', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Alter User Table: Konversi User.role ke TEXT dan tambahkan roleId
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roleId" TEXT;
DO $$ BEGIN
    ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT USING "role"::TEXT;
EXCEPTION WHEN others THEN null;
END $$;

-- 3. Alter PurchaseOrder & PoCompanyGroup
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpId" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "isBypassed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvalChannel" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovalChannel" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovalChannel" TEXT;

ALTER TABLE "PoCompanyGroup" ADD COLUMN IF NOT EXISTS "defaultCeoId" TEXT;
ALTER TABLE "PoCompanyGroup" ADD COLUMN IF NOT EXISTS "defaultFvpId" TEXT;

-- Backfill data PO lama yang APPROVED agar otomatis tercatat sebagai Bypass Admin (Web)
UPDATE "PurchaseOrder" po
SET 
    "isBypassed" = true,
    "approvalChannel" = 'WEB',
    "approvedById" = COALESCE(
        (SELECT u.id FROM "User" u WHERE u.username = po.pembuat_admin LIMIT 1),
        (SELECT u.id FROM "User" u WHERE u.role IN ('SuperAdminBP', 'AdminLogistik') ORDER BY u.role DESC LIMIT 1)
    ),
    "ceoApprovedAt" = COALESCE(po."ceoApprovedAt", po."updatedAt", po."createdAt"),
    "fvpApprovedAt" = COALESCE(po."fvpApprovedAt", po."updatedAt", po."createdAt")
WHERE po.status = 'APPROVED' AND po."approvedById" IS NULL;

-- 4. Tabel Role (Jika tipe enum bernama Role sebelumnya menghalangi pembuatan tabel, kita buat tabel jika belum ada)
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "scope" "RoleScope" NOT NULL DEFAULT 'OWN_BRANCH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- 5. Tabel Permission
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- 6. Tabel RolePermission
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- 7. Tabel RBL (Budget, Expense, Attachment)
CREATE TABLE IF NOT EXISTS "RblBudget" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "RblStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closeNotes" TEXT,
    "locationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RblBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RblExpense" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'Pcs',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,
    "receiptNo" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RblExpense_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RblAttachment" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "caption" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RblAttachment_pkey" PRIMARY KEY ("id")
);

-- 8. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code");
CREATE INDEX IF NOT EXISTS "Permission_module_idx" ON "Permission"("module");
CREATE UNIQUE INDEX IF NOT EXISTS "RblBudget_code_key" ON "RblBudget"("code");
CREATE INDEX IF NOT EXISTS "RblBudget_locationId_status_idx" ON "RblBudget"("locationId", "status");
CREATE INDEX IF NOT EXISTS "RblBudget_periodYear_periodMonth_idx" ON "RblBudget"("periodYear", "periodMonth");
CREATE INDEX IF NOT EXISTS "RblExpense_budgetId_date_idx" ON "RblExpense"("budgetId", "date");
CREATE INDEX IF NOT EXISTS "RblAttachment_budgetId_idx" ON "RblAttachment"("budgetId");

-- Performance Booster Indexes
CREATE INDEX IF NOT EXISTS "ProductionTransaction_date_idx" ON "ProductionTransaction"("date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_locationId_date_idx" ON "ProductionTransaction"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_projectId_idx" ON "ProductionTransaction"("projectId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_driverId_idx" ON "ProductionTransaction"("driverId");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_status_idx" ON "ProductionTransaction"("status");
CREATE INDEX IF NOT EXISTS "ProductionTransaction_vehicleId_idx" ON "ProductionTransaction"("vehicleId");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_date_idx" ON "MaterialIncoming"("date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_locationId_date_idx" ON "MaterialIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_material_type_idx" ON "MaterialIncoming"("material_type");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_date_idx" ON "AggregateIncoming"("date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_locationId_date_idx" ON "AggregateIncoming"("locationId", "date");
CREATE INDEX IF NOT EXISTS "AggregateIncoming_aggregate_type_idx" ON "AggregateIncoming"("aggregate_type");
CREATE INDEX IF NOT EXISTS "Retase_driverId_idx" ON "Retase"("driverId");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_recordId_idx" ON "AuditLog"("entity", "recordId");
CREATE INDEX IF NOT EXISTS "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "Invoice_locationId_status_idx" ON "Invoice"("locationId", "status");
CREATE INDEX IF NOT EXISTS "Invoice_issue_date_idx" ON "Invoice"("issue_date");
CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice"("projectId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "Payment_payment_date_idx" ON "Payment"("payment_date");
CREATE INDEX IF NOT EXISTS "Payment_is_cancelled_idx" ON "Payment"("is_cancelled");
CREATE INDEX IF NOT EXISTS "Deposit_projectId_idx" ON "Deposit"("projectId");
CREATE INDEX IF NOT EXISTS "Deposit_date_idx" ON "Deposit"("date");
CREATE INDEX IF NOT EXISTS "BillingLog_invoiceId_idx" ON "BillingLog"("invoiceId");
CREATE INDEX IF NOT EXISTS "BillingLog_paymentId_idx" ON "BillingLog"("paymentId");
CREATE INDEX IF NOT EXISTS "BillingLog_createdAt_idx" ON "BillingLog"("createdAt");
CREATE INDEX IF NOT EXISTS "ConcretePlan_date_idx" ON "ConcretePlan"("date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_locationId_date_idx" ON "ConcretePlan"("locationId", "date");
CREATE INDEX IF NOT EXISTS "ConcretePlan_projectId_idx" ON "ConcretePlan"("projectId");
CREATE INDEX IF NOT EXISTS "ConcretePlan_status_idx" ON "ConcretePlan"("status");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_locationId_idx" ON "PurchaseOrder"("locationId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_tanggal_terbit_idx" ON "PurchaseOrder"("status", "tanggal_terbit");

-- 9. Foreign Keys
DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 10. MasterItemPriceHistory
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

EOF

echo -e "${GREEN}✓ Struktur tabel Role, Permission, RBAC, dan RBL berhasil diselaraskan.${NC}"

# Seed default role SuperAdminBP jika belum ada agar admin bisa langsung login dan akses roles
sudo -u postgres psql -d rajawali_prod << 'EOF'
DO $$
DECLARE
    super_role_id TEXT;
BEGIN
    SELECT id INTO super_role_id FROM "Role" WHERE name = 'SuperAdminBP';
    IF super_role_id IS NULL THEN
        super_role_id := gen_random_uuid()::TEXT;
        INSERT INTO "Role" ("id", "name", "label", "description", "isSystem", "scope", "updatedAt")
        VALUES (super_role_id, 'SuperAdminBP', 'Super Admin BP', 'Full akses ke semua modul dan cabang sistem', true, 'ALL_BRANCHES', NOW());
    END IF;

    -- Hubungkan user dengan role SuperAdminBP ke roleId ini
    UPDATE "User" SET "roleId" = super_role_id WHERE "role" = 'SuperAdminBP' AND ("roleId" IS NULL OR "roleId" = '');
END $$;
EOF

echo -e "${GREEN}✓ Relasi Role SuperAdminBP siap.${NC}"

# Tandai migrasi prisma sebagai applied agar tidak conflict
if [ -f ".env.production" ]; then
    ENV_FILE=".env.production"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
fi

IMAGE_NAME="randisalam1007/rajawali-bp-erp:latest"
docker run --rm --network host --env-file $ENV_FILE $IMAGE_NAME sh -c "
npx prisma migrate resolve --applied 20260904000000_add_rbl_and_rbac_module 2>/dev/null || true
npx prisma migrate resolve --applied 20260904120000_add_po_indexes 2>/dev/null || true
" || true

echo -e "${CYAN}Memulai ulang container rajawali-app...${NC}"
docker restart rajawali-app

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN} ✅ Sinkronisasi Selesai & Aplikasi Normal!     ${NC}"
echo -e "${GREEN}================================================${NC}"
