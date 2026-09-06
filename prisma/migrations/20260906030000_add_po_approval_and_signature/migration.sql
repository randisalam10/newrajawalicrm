-- AlterEnum
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "PurchaseOrderStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;

-- AlterTable PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "submittedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpSignatureUrl" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpNotes" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoSignatureUrl" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoNotes" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3);
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "rejectedById" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrder_submittedById_fkey'
    ) THEN
        ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PurchaseOrder_rejectedById_fkey'
    ) THEN
        ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
