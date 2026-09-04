-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterItem_name_idx" ON "MasterItem"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterItem_categoryId_idx" ON "MasterItem"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MasterItem_supplierId_idx" ON "MasterItem"("supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_tanggal_terbit_idx" ON "PurchaseOrder"("tanggal_terbit");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_companyGroupId_idx" ON "PurchaseOrder"("companyGroupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_categoryId_idx" ON "PurchaseOrder"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoItem_purchaseOrderId_idx" ON "PoItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PoItem_masterItemId_idx" ON "PoItem"("masterItemId");
