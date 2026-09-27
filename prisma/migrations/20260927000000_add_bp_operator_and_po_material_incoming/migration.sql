-- Safe, Non-Destructive Migration:
-- 1. Operator BP pada ProductionTransaction & Insentif Operator pada RetaseSetting
-- 2. Integrasi PO Logistik & MaterialIncoming Semen Silo BP
-- 3. Flag is_for_bp pada PurchaseOrder

-- 1. ProductionTransaction: Tambah operatorId
ALTER TABLE "ProductionTransaction" ADD COLUMN IF NOT EXISTS "operatorId" TEXT;
CREATE INDEX IF NOT EXISTS "ProductionTransaction_operatorId_idx" ON "ProductionTransaction"("operatorId");

DO $$ BEGIN
    ALTER TABLE "ProductionTransaction" ADD CONSTRAINT "ProductionTransaction_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. RetaseSetting: Tambah operator_rate_per_cubic
ALTER TABLE "RetaseSetting" ADD COLUMN IF NOT EXISTS "operator_rate_per_cubic" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 3. MaterialIncoming: Kolom Harga, Satuan Beli, dan Referensi PO
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "unit_price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "total_price" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "purchase_unit" TEXT DEFAULT 'KG';
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "purchase_qty" DOUBLE PRECISION;
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "purchaseOrderId" TEXT;
ALTER TABLE "MaterialIncoming" ADD COLUMN IF NOT EXISTS "poItemId" TEXT;

CREATE INDEX IF NOT EXISTS "MaterialIncoming_purchaseOrderId_idx" ON "MaterialIncoming"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "MaterialIncoming_poItemId_idx" ON "MaterialIncoming"("poItemId");

DO $$ BEGIN
    ALTER TABLE "MaterialIncoming" ADD CONSTRAINT "MaterialIncoming_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "MaterialIncoming" ADD CONSTRAINT "MaterialIncoming_poItemId_fkey" FOREIGN KEY ("poItemId") REFERENCES "PoItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 4. PurchaseOrder: Tambah is_for_bp
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "is_for_bp" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "PurchaseOrder_is_for_bp_idx" ON "PurchaseOrder"("is_for_bp");
