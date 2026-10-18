-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "is_for_crusher" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseOrder_is_for_crusher_idx" ON "PurchaseOrder"("is_for_crusher");
