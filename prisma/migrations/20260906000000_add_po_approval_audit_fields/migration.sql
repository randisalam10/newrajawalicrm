-- AlterTable PurchaseOrder: Add Approval Audit Tracking Fields
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "isBypassed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvalChannel" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "ceoApprovalChannel" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovedById" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "fvpApprovalChannel" TEXT;

-- Add Foreign Key constraints safely
DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_ceoApprovedById_fkey" FOREIGN KEY ("ceoApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_fvpApprovedById_fkey" FOREIGN KEY ("fvpApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Backfill existing APPROVED POs to be marked as Bypass Admin (Web)
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

